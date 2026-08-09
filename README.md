# 🧠 MyMemoRem

**MyMemoRem** is a powerful context-handoff utility built for developers who seamlessly switch between multiple AI agents. 

Instead of manually copy-pasting code snippets and explaining your project goals over and over every time you switch from ChatGPT to Gemini or Claude, MyMemoRem automates the entire onboarding process. 

Simply upload your raw chat history PDFs. MyMemoRem leverages **Google's Gemini 3.5 Native Multimodal API** to securely read and extract your exact tech stack, overall project goals, and immediate blockers. It instantly generates a perfect "System Prompt" that you can feed into your next AI agent so it can pick up exactly where you left off.

## ✨ Features
- **Native PDF Processing**: Uses Gemini's Multimodal Engine to flawlessly read and understand highly-formatted chat logs without relying on brittle OCR scrapers.
- **Batch Processing**: Upload dozens of chat logs at once; the AI synthesizes them into a single coherent project state.
- **Dark Neumorphism UI**: A stunning, custom-built physics-based soft UI design system that feels premium and tactile.
- **Automated Project Naming**: The AI automatically deduces a creative project name based on your code and context.
- **Frictionless Handoff**: 1-click copy-to-clipboard for the generated AI system prompt.

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Vanilla CSS (Custom Neumorphic Design System)
- **Backend**: Node.js, Express, Multer (Memory Storage)
- **AI Integration**: `@google/generative-ai` (Gemini 3.5 Flash Multimodal)
- **State Management**: LocalStorage for Mock Authentication and persistent workspace sessions.

## 🚀 How to Run Locally

1. **Clone the repository**
```bash
git clone https://github.com/YourUsername/MyMemoRem.git
cd MyMemoRem
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Environment Variables**
Create a `.env` file in the root directory and add your Gemini API Key:
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

4. **Start the Backend Server**
```bash
node server.js
```
*(Runs on http://localhost:3000)*

5. **Start the Frontend Application**
Open a new terminal and run:
```bash
npm run dev
```
*(Runs on http://localhost:5173)*

## 💡 Designed for Hackathons
This project was built rapidly with a focus on solving a very real developer pain point: context fragmentation across AI tools. It features a complete Mock Authentication flow for rapid demonstration.
