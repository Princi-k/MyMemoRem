import { useState, useEffect, useRef } from 'react';
import { Plus, Copy, MessageSquare, ShieldCheck, UploadCloud, CheckCircle, Loader2, Save, LogOut, BookOpen, User, X } from 'lucide-react';
import './App.css';

// Types
interface Fragment {
  id: string;
  title: string;
  content: string;
  type: 'directive' | 'context' | 'summary';
}

interface Profile {
  id: string;
  name: string;
  techStack: string;
  overallGoal: string;
  currentTask: string;
  handoffNotes: string;
  fragments: Fragment[];
}

interface User {
  email: string;
  name: string;
}

type ViewState = 'login' | 'signup' | 'workspace' | 'guide';

function App() {
  // Global State
  const [activeView, setActiveView] = useState<ViewState>('signup');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('omni-context-user');
    return saved ? JSON.parse(saved) : null;
  });
  
  // App State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Form States
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);

  // Persistence
  useEffect(() => {
    if (currentUser && profiles.length > 0) {
      localStorage.setItem(`omni-context-profiles-${currentUser.email}`, JSON.stringify(profiles));
    }
  }, [profiles, currentUser]);

  // Load profiles when user changes
  useEffect(() => {
    if (currentUser) {
      const saved = localStorage.getItem(`omni-context-profiles-${currentUser.email}`);
      if (saved) {
        const parsedProfiles = JSON.parse(saved);
        setProfiles(parsedProfiles);
        if (parsedProfiles.length > 0) {
          setActiveProfileId(parsedProfiles[0].id);
        }
      } else {
        // Fresh user
        const newId = Date.now().toString();
        setProfiles([{
          id: newId, 
          name: 'New Workspace',
          techStack: '',
          overallGoal: '',
          currentTask: '',
          handoffNotes: '',
          fragments: [] 
        }]);
        setActiveProfileId(newId);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('omni-context-user', JSON.stringify(currentUser));
      if (activeView === 'login' || activeView === 'signup') {
        setActiveView('workspace');
      }
    } else {
      localStorage.removeItem('omni-context-user');
      if (activeView === 'workspace' || activeView === 'guide') {
        setActiveView('signup');
      }
    }
  }, [currentUser, activeView]);

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  const updateActiveProfile = (updates: Partial<Profile>) => {
    setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, ...updates } : p));
  };

  const handleCopyContext = () => {
    if (!activeProfile) return;
    
    let contextString = `[SYSTEM CONTEXT: ${activeProfile.name}]\n`;
    contextString += `Please review the following context before answering my next question.\n\n`;
    
    if (activeProfile.techStack) contextString += `### TECH STACK:\n${activeProfile.techStack}\n\n`;
    if (activeProfile.overallGoal) contextString += `### OVERALL GOAL:\n${activeProfile.overallGoal}\n\n`;
    if (activeProfile.currentTask) contextString += `### CURRENT PROBLEM/TASK:\n${activeProfile.currentTask}\n\n`;
    if (activeProfile.handoffNotes) contextString += `### HANDOFF NOTES (From previous AI agent):\n${activeProfile.handoffNotes}\n\n`;
    
    navigator.clipboard.writeText(contextString);
    alert('Handoff Context Copied! You can now paste this into your next AI Agent.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setUploadedFiles(fileArray);
  };

  const handleAnalyzeFiles = async () => {
    if (uploadedFiles.length === 0) {
      setErrorMessage('Please select files to upload.');
      return;
    }
    setErrorMessage('');
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Backend Error");
      }
      
      updateActiveProfile({
        name: data.projectName || activeProfile?.name || 'New Workspace',
        techStack: data.techStack || '',
        overallGoal: data.overallGoal || '',
        currentTask: data.currentTask || '',
        handoffNotes: data.handoffNotes || ''
      });

      setUploadedFiles([]);
      setSavedToast(true);
      setTimeout(() => {
        setSavedToast(false);
        // Scroll to Step 2 smoothly after a tiny delay so the user sees it happen
        step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
      
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleNewWorkspace = () => {
    const newId = Date.now().toString();
    setProfiles(prev => [...prev, {
      id: newId,
      name: 'New Workspace',
      techStack: '',
      overallGoal: '',
      currentTask: '',
      handoffNotes: '',
      fragments: []
    }]);
    setActiveProfileId(newId);
    setActiveView('workspace');
  };

  // Auth Handlers (Mock)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    setCurrentUser({ email: authEmail, name: authEmail.split('@')[0] });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authName) return;
    
    // Clear any previous data for this email so they get a completely fresh workspace
    localStorage.removeItem(`omni-context-profiles-${authEmail}`);
    
    setCurrentUser({ email: authEmail, name: authName });
  };

  const handleGuestLogin = () => {
    localStorage.removeItem(`omni-context-profiles-guest@hackathon.com`);
    setCurrentUser({ email: 'guest@hackathon.com', name: 'Judge (Guest)' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setProfiles([]);
    setActiveProfileId('');
    setAuthEmail('');
    setAuthPassword('');
  };

  // =======================================================================
  // VIEWS
  // =======================================================================

  if (activeView === 'login') {
    return (
      <div className="auth-container">
        <div className="auth-card neu-extruded">
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', marginBottom: '0.75rem' }} className="neu-inset">
              <MessageSquare size={24} color="var(--accent-primary)" />
            </div>
            <h1 className="text-gradient">Welcome Back</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Log in to your MyMemoRem account</p>
          </div>

          <form onSubmit={handleLogin} className="form-group">
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
            </div>
            <button type="submit" className="neu-button neu-button-primary neu-extruded-hover" style={{ marginTop: '0.5rem', width: '100%', padding: '0.85rem' }}>
              Sign In
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            <span style={{ padding: '0 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          </div>

          <button onClick={handleGuestLogin} className="neu-button neu-extruded-hover" style={{ width: '100%', padding: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
            Continue as Guest 🚀
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
            Don't have an account? <span style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setActiveView('signup')}>Sign up</span>
          </p>
        </div>
      </div>
    );
  }

  if (activeView === 'signup') {
    return (
      <div className="auth-container">
        <div className="auth-card neu-extruded">
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', marginBottom: '0.75rem' }} className="neu-inset">
              <User size={24} color="var(--accent-primary)" />
            </div>
            <h1 className="text-gradient">Create Account</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Start building your AI memory today</p>
          </div>

          <form onSubmit={handleSignup} className="form-group">
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" value={authName} onChange={e => setAuthName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
            </div>
            <button type="submit" className="neu-button neu-button-primary neu-extruded-hover" style={{ marginTop: '0.5rem', width: '100%', padding: '0.85rem' }}>
              Create Account
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            <span style={{ padding: '0 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          </div>

          <button onClick={handleGuestLogin} className="neu-button neu-extruded-hover" style={{ width: '100%', padding: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
            Continue as Guest 🚀
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
            Already have an account? <span style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setActiveView('login')}>Log in</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="text-gradient" style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="neu-inset" style={{ padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
              <MessageSquare size={20} color="var(--accent-primary)" />
            </div>
            MyMemoRem
          </h1>
        </div>
        
        <div className="sidebar-content">
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', marginLeft: '0.5rem' }}>
            Menu
          </h3>
          
          <div 
            className={`workspace-item ${activeView === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveView('guide')}
          >
            <BookOpen size={18} /> How to Use Guide
          </div>

          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', marginTop: '2rem', marginLeft: '0.5rem' }}>
            Workspaces
          </h3>

          {profiles.map(profile => (
            <div 
              key={profile.id}
              className={`workspace-item ${(activeProfileId === profile.id && activeView === 'workspace') ? 'active' : ''}`}
              onClick={() => {
                setActiveProfileId(profile.id);
                setActiveView('workspace');
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: (activeProfileId === profile.id && activeView === 'workspace') ? 'var(--accent-primary)' : 'var(--text-muted)' }}></span>
              {profile.name}
            </div>
          ))}
          
          <button className="neu-button neu-extruded-hover" onClick={handleNewWorkspace} style={{ marginTop: '1.5rem', width: '100%' }}>
            <Plus size={16} /> New Workspace
          </button>
        </div>

        <div className="sidebar-footer" style={{ borderTop: '2px solid rgba(255,255,255,0.02)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="neu-inset" style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                {currentUser?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{currentUser?.name}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="neu-button" style={{ padding: '0.5rem', borderRadius: '50%' }} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        
        {/* Onboarding Banner */}
        {showOnboarding && activeView === 'workspace' && (
          <div className="neu-extruded" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ShieldCheck size={20} color="var(--accent-primary)" />
              <p><strong>Welcome!</strong> Create a workspace, upload your AI chat PDFs, and let Gemini generate your context handoff.</p>
            </div>
            <button onClick={() => setShowOnboarding(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        )}

        <div className="view-container">
          
          {/* Guide View */}
          {activeView === 'guide' && (
            <div className="neu-extruded" style={{ padding: '3rem' }}>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }} className="text-gradient">How to use MyMemoRem</h1>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '3rem', lineHeight: 1.6 }}>
                MyMemoRem eliminates the friction of switching between different AI agents. By feeding your raw chat histories to our secure Gemini Multimodal engine, we instantly build perfect system prompts for your next AI to inherit.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="neu-inset" style={{ padding: '2rem' }}>
                  <div className="step-number" style={{ marginBottom: '1rem' }}>1</div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Export Your Chats</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    Go to your current AI agent (ChatGPT, Gemini, Claude) and use their native export button to download your chat history as a PDF or JSON.
                  </p>
                </div>

                <div className="neu-inset" style={{ padding: '2rem' }}>
                  <div className="step-number" style={{ marginBottom: '1rem' }}>2</div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Upload & Process</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    Select your workspace in the sidebar, and upload multiple PDFs at once. Our backend natively parses the documents securely.
                  </p>
                </div>

                <div className="neu-inset" style={{ padding: '2rem' }}>
                  <div className="step-number" style={{ marginBottom: '1rem' }}>3</div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Review AI Context</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    Our custom Gemini 3.5 model reads your entire project history and perfectly extracts the tech stack, goals, and current blockers.
                  </p>
                </div>

                <div className="neu-inset" style={{ padding: '2rem' }}>
                  <div className="step-number" style={{ marginBottom: '1rem' }}>4</div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Seamless Handoff</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    Copy the generated prompt in Step 3 and paste it as the very first message into your new AI agent. You'll pick up exactly where you left off.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <button className="neu-button neu-button-primary neu-extruded-hover" onClick={() => setActiveView('workspace')} style={{ padding: '1rem 2rem' }}>
                  Get Started Now
                </button>
              </div>
            </div>
          )}

          {/* Workspace View */}
          {activeView === 'workspace' && activeProfile && (
            <>
              <header className="main-header neu-inset" style={{ padding: '0.75rem 1.5rem', borderRadius: '24px' }}>
                <input 
                  type="text" 
                  value={activeProfile.name} 
                  onChange={e => updateActiveProfile({ name: e.target.value })}
                  style={{ fontSize: '1.4rem', fontWeight: 800, background: 'transparent', border: 'none', padding: 0, color: 'var(--success)', boxShadow: 'none' }}
                />
              </header>

              <div className="step-container">
                
                {/* STEP 1: UPLOAD */}
                <div className="step-card neu-extruded">
                  <div className="step-header" style={{ marginBottom: '1rem' }}>
                    <div className="step-number">1</div>
                    <h2>Upload Chat History</h2>
                  </div>
                  <p className="text-muted" style={{ marginBottom: '1rem' }}>Upload PDFs, JSON, or text files from your previous AI agent.</p>
                  
                  <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                    <input 
                      type="file" 
                      multiple 
                      style={{ display: 'none' }} 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <UploadCloud size={40} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>Click to Upload Files</h3>
                    <p style={{ color: 'var(--text-muted)' }}>We support Native PDF Processing via Gemini Multimodal.</p>
                  </div>

                  {errorMessage && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{errorMessage}</span>
                      <button onClick={() => setErrorMessage('')} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}>✕</button>
                    </div>
                  )}

                  {uploadedFiles.length > 0 && (
                    <div style={{ marginTop: '1rem', padding: '1rem' }} className="neu-inset">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '0.75rem', fontWeight: 600 }}>
                        <CheckCircle size={20} /> {uploadedFiles.length} file(s) ready for analysis.
                      </div>
                      <button 
                        className="neu-button neu-button-primary neu-extruded-hover" 
                        onClick={handleAnalyzeFiles} 
                        disabled={isAnalyzing}
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                      >
                        {isAnalyzing ? (
                          <><Loader2 size={24} className="spin" /> Processing securely...</>
                        ) : (
                          <><MessageSquare size={24} /> Extract Context with AI</>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* STEP 2: EDITOR */}
                <div className="step-card neu-extruded" ref={step2Ref}>
                  <div className="step-header">
                    <div className="step-number">2</div>
                    <h2>Edit & Save Context</h2>
                  </div>
                  <p className="text-muted" style={{ marginBottom: '2rem' }}>Review the AI-extracted data. Your changes are automatically saved to your account.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    <div>
                      <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Project Name / Goal</label>
                      <input 
                        className="neu-inset" 
                        value={activeProfile.overallGoal}
                        onChange={e => updateActiveProfile({ overallGoal: e.target.value })}
                        placeholder="e.g. Build a decentralized voting app" 
                        style={{ width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', borderRadius: '12px' }} 
                      />
                    </div>

                    <div>
                      <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Tech Stack</label>
                      <input 
                        className="neu-inset" 
                        value={activeProfile.techStack}
                        onChange={e => updateActiveProfile({ techStack: e.target.value })}
                        placeholder="e.g. React, Node, PostgreSQL" 
                        style={{ width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', borderRadius: '12px' }} 
                      />
                    </div>

                    <div>
                      <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Current Blocker / Task</label>
                      <textarea 
                        className="neu-inset" 
                        value={activeProfile.currentTask}
                        onChange={e => updateActiveProfile({ currentTask: e.target.value })}
                        placeholder="e.g. API is returning 500 error on login." 
                        style={{ width: '100%', minHeight: '120px', padding: '0.75rem 1rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', borderRadius: '12px', resize: 'vertical' }} 
                      />
                    </div>

                    <div>
                      <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Handoff Notes for AI</label>
                      <textarea 
                        className="neu-inset" 
                        value={activeProfile.handoffNotes}
                        onChange={e => updateActiveProfile({ handoffNotes: e.target.value })}
                        placeholder="e.g. We already tried using CORS middleware but it failed." 
                        style={{ width: '100%', minHeight: '120px', padding: '0.75rem 1rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', borderRadius: '12px', resize: 'vertical' }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                    {savedToast && <span style={{ color: 'var(--success)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}><CheckCircle size={16} /> Saved!</span>}
                    <button className="neu-button neu-extruded-hover" onClick={handleManualSave}>
                      <Save size={18} /> Save Changes
                    </button>
                  </div>
                </div>

                {/* STEP 3: OUTPUT */}
                <div className="step-card neu-extruded" style={{ border: '2px solid var(--accent-primary)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'var(--accent-primary)' }}></div>
                  <div className="step-header" style={{ marginTop: '0.5rem' }}>
                    <div className="step-number" style={{ color: 'var(--bg-primary)', background: 'var(--accent-primary)', boxShadow: 'none' }}>3</div>
                    <h2>Ready for Handoff</h2>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Paste this directly into your new AI agent.</p>
                    <button className="neu-button neu-button-primary neu-extruded-hover" onClick={handleCopyContext}>
                      <Copy size={18} /> Copy Prompt
                    </button>
                  </div>
                  
                  <textarea 
                    readOnly
                    rows={8}
                    value={(() => {
                      let contextString = `[SYSTEM CONTEXT: ${activeProfile.name}]\n`;
                      contextString += `Please review the following context before answering my next question.\n\n`;
                      if (activeProfile.techStack) contextString += `### TECH STACK:\n${activeProfile.techStack}\n\n`;
                      if (activeProfile.overallGoal) contextString += `### OVERALL GOAL:\n${activeProfile.overallGoal}\n\n`;
                      if (activeProfile.currentTask) contextString += `### CURRENT PROBLEM/TASK:\n${activeProfile.currentTask}\n\n`;
                      if (activeProfile.handoffNotes) contextString += `### HANDOFF NOTES:\n${activeProfile.handoffNotes}\n\n`;
                      return contextString;
                    })()}
                    style={{ background: '#121519', color: 'var(--success)', fontFamily: 'monospace', fontSize: '0.9rem', padding: '1.5rem' }}
                  />
                </div>

              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
