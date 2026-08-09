import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Set up multer to store uploaded files in memory
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/analyze', upload.array('files'), async (req, res) => {
  try {
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Backend is missing the Gemini API key." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded." });
    }

    const parts = [];
    let hasPdf = false;

    const promptText = `
      You are a highly intelligent Context Analyzer for software developers.
      I am going to provide you with a massive dump of project documents, which might include PDF chat histories, code files, or READMEs.
      
      Read through all the provided documents/files and extract the following 5 pieces of information:
      1. projectName: Write a 2-4 word creative name for this project based on the context.
      2. techStack: All the programming languages, frameworks, and tools used.
      3. overallGoal: What is the grand purpose or final product they are trying to build?
      4. currentTask: What is the most recent unsolved problem, error, or immediate next step?
      5. handoffNotes: Write a 2-3 sentence summary intended for a NEW AI Agent to read, explaining what was tried previously and what failed.
      
      You MUST respond with ONLY a raw JSON object. Do not wrap it in markdown code blocks. 
      Format strictly as: {"projectName": "...", "techStack": "...", "overallGoal": "...", "currentTask": "...", "handoffNotes": "..."}
    `;
    
    parts.push(promptText);

    // Parse all files natively
    for (const file of req.files) {
      if (file.mimetype === 'application/pdf') {
        hasPdf = true;
        parts.push({
          inlineData: {
            data: file.buffer.toString("base64"),
            mimeType: "application/pdf"
          }
        });
      } else {
        const text = file.buffer.toString('utf-8');
        parts.push(`\n--- File: ${file.originalname} ---\n${text}\n`);
      }
    }

    if (parts.length === 1) {
      return res.status(400).json({ error: "No files were processed successfully." });
    }

    console.log(`Sending prompt to Gemini. Contains PDF: ${hasPdf}. Number of file parts: ${parts.length - 1}`);

    // Call Gemini API using the official SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We try gemini-3.5-flash first, fallback to gemini-2.5-flash if not found
    let model;
    try {
      model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    } catch (e) {
      model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    let rawJsonText = "";
    try {
      const result = await model.generateContent(parts);
      const response = await result.response;
      rawJsonText = response.text();
    } catch (modelErr) {
      console.warn("Primary model failed, attempting fallback...", modelErr);
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const fallbackResult = await fallbackModel.generateContent(parts);
      rawJsonText = (await fallbackResult.response).text();
    }
    
    // Clean up if the model still wrapped in markdown
    rawJsonText = rawJsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(rawJsonText);
    
    res.json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "An error occurred during analysis." });
  }
});

app.listen(port, () => {
  console.log(`MyMemoRem Backend running on http://localhost:${port}`);
});
