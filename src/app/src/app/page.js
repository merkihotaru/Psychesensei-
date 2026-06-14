'use client';
import { useState, useEffect, useRef } from 'react';

const GARDEN_DB = [
  { id: 1, text: "If we decoupled your value from visible output, what changes?", tags: ["Identity", "Success"] },
  { id: 2, text: "Whose timeline are you actively running on right now?", tags: ["Parents", "Expectations"] },
  { id: 3, text: "What is the specific worst-case scenario you are avoiding?", tags: ["Fear", "Future"] },
  { id: 4, text: "What belief about yourself have you never actually tested?", tags: ["Identity", "Assumptions"] }
];

function AnimatedMascot({ size = 64, isThinking = false }) {
  return (
    <div className="mascot-wrapper" style={{ width: size, height: size, position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ borderRadius: '50%' }}>
        <g>
          <rect x="0" y="0" width="50" height="100" fill="#6FD6FF" />
          <rect x="50" y="0" width="50" height="100" fill="#D84A4A" />
        </g>
        <circle cx="50" cy="50" r="48" fill="none" stroke="#2C3137" strokeWidth="2" />
        <g fill="#111315">
          <circle cx="35" cy="50" r="4.5" />
          <circle cx="65" cy="50" r="4.5" />
        </g>
        <path d="M42 65 Q50 70 58 65" stroke="#111315" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function Home() {
  const [page, setPage] = useState("home");
  const [greeting, setGreeting] = useState("Welcome back.");
  const [chatLog, setChatLog] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [activeTag, setActiveTag] = useState(null);
  const [labView, setLabView] = useState("menu");
  const [labInput, setLabInput] = useState("");
  const [labStep, setLabStep] = useState(0);
  const [journalInput, setJournalInput] = useState("");
  const [journalEntries, setJournalEntries] = useState([]);
  const chatEndRef = useRef(null);

  // Time-Aware & Welcome Back Engine
  useEffect(() => {
    const hours = new Date().getHours();
    const hasVisited = localStorage.getItem('psyche_visited');
    
    let baseGreeting = "Welcome.";
    if (hours < 12) baseGreeting = "Good morning. What's worth noticing today?";
    else if (hours < 18) baseGreeting = "Good afternoon. Anything on your mind?";
    else baseGreeting = "Before you sleep, what remains unresolved?";

    if (hasVisited) {
      setGreeting(`Welcome back. ${baseGreeting}`);
    } else {
      setGreeting(baseGreeting);
      localStorage.setItem('psyche_visited', 'true');
    }

    // Local Storage Recovery System
    const savedLogs = localStorage.getItem('psyche_chat');
    if (savedLogs) setChatLog(JSON.parse(savedLogs));
    else setChatLog([{ role: "sensei", text: "What is an assumption about your path that you treat as an absolute fact?" }]);

    const savedJournal = localStorage.getItem('psyche_journal');
    if (savedJournal) setJournalEntries(JSON.parse(savedJournal));
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, isThinking]);

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const updatedLog = [...chatLog, { role: "user", text: chatInput }];
    setChatLog(updatedLog);
    localStorage.setItem('psyche_chat', JSON.stringify(updatedLog));
    setChatInput("");
    setIsThinking(true);

    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedLog })
      });
      const data = await response.json();
      const nextLog = [...updatedLog, { role: "sensei", text: data.text }];
      setChatLog(nextLog);
      localStorage.setItem('psyche_chat', JSON.stringify(nextLog));
    } catch (err) {
      setChatLog(prev => [...prev, { role: "sensei", text: "Connection thin. What happens if we step back and re-evaluate that thought?" }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleJournalSave = () => {
    if (!journalInput.trim()) return;
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      text: journalInput
    };
    const updatedJournal = [newEntry, ...journalEntries];
    setJournalEntries(updatedJournal);
    localStorage.setItem('psyche_journal', JSON.stringify(updatedJournal));
    setJournalInput("");
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '20px' }}>
      
      {/* Dynamic Nav System */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', borderBottom: '1px solid #2C3137' }}>
        {['home', 'inquiry', 'lab', 'garden', 'vault', 'journal'].map((tab) => (
          <button key={tab} onClick={() => setPage(tab)} style={{
            background: page === tab ? '#E8E8E8' : 'transparent',
            color: page === tab ? '#111315' : '#A39A8E',
            border: '1px solid #2C3137', padding: '8px 16px', borderRadius: '999px', cursor: 'pointer', textTransform: 'capitalize'
          }}>{tab}</button>
        ))}
      </div>

      {/* Main Container */}
      <main style={{ flexGrow: 1, paddingTop: '24px' }}>
        {page === "home" && (
          <div style={{ textAlign: 'center' }}>
            <AnimatedMascot size={80} />
            <h1 style={{ fontSize: '24px', margin: '16px 0', fontWeight: '400' }}>{greeting}</h1>
            <p style={{ color: '#A39A8E', fontStyle: 'italic' }}>"Not Answers. Better Questions."</p>
          </div>
        )}

        {page === "inquiry" && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
            <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {chatLog.map((msg, idx) => (
                <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', background: msg.role === 'user' ? '#1B1E22' : 'transparent', padding: '12px', borderRadius: '12px', maxWidth: '85%' }}>
                  <p style={{ margin: 0, color: msg.role === 'user' ? '#E8E8E8' : '#6FD6FF', fontSize: '15px', lineHeight: '1.5' }}>{msg.text}</p>
                </div>
              ))}
              {isThinking && <p style={{ color: '#A39A8E', fontStyle: 'italic', fontSize: '13px' }}>Sensei is deep in thought...</p>}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChatSend()} placeholder="Explore the thought..." style={{ flexGrow: 1, background: '#1B1E22', border: '1px solid #2C3137', color: '#E8E8E8', padding: '12px', borderRadius: '8px', outline: 'none' }} />
              <button onClick={handleChatSend} style={{ background: '#E8E8E8', color: '#111315', border: 'none', padding: '0 16px', borderRadius: '8px', fontWeight: '600' }}>Send</button>
            </div>
          </div>
        )}

        {page === "journal" && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Private Timeline</h2>
            <textarea value={journalInput} onChange={e => setJournalInput(e.target.value)} placeholder="Log a reflection safely to your local device memory..." style={{ width: '100%', background: '#1B1E22', border: '1px solid #2C3137', color: '#E8E8E8', padding: '12px', borderRadius: '8px', height: '100px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}></textarea>
            <button onClick={handleJournalSave} style={{ width: '100%', padding: '12px', background: '#E8E8E8', color: '#111315', border: 'none', borderRadius: '8px', marginTop: '8px', fontWeight: '600' }}>Lock to Device Storage</button>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {journalEntries.map(entry => (
                <div key={entry.id} style={{ borderLeft: '2px solid #6FD6FF', paddingLeft: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#A39A8E' }}>{entry.date}</span>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', lineHeight: '1.4' }}>{entry.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === "lab" && (
          <div>
            <h2 style={{ fontSize: '20px' }}>Thought Lab</h2>
            {labStep === 0 ? (
              <div style={{ background: '#1B1E22', padding: '16px', borderRadius: '12px', marginTop: '12px', border: '1px solid #2C3137' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Assumption Detector: Paste a statement causing pressure.</p>
                <input type="text" value={labInput} onChange={e => setLabInput(e.target.value)} placeholder="e.g., I must get answers right away." style={{ width: '100%', padding: '12px', background: '#111315', border: '1px solid #2C3137', color: '#E8E8E8', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }} />
                <button onClick={() => { if(labInput.trim()) setLabStep(1); }} style={{ width: '100%', background: '#D84A4A', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', marginTop: '12px', fontWeight: '600' }}>Isolate Premises</button>
              </div>
            ) : (
              <div style={{ background: '#1B1E22', padding: '16px', borderRadius: '12px', marginTop: '12px', border: '1px solid #2C3137' }}>
                <p style={{ color: '#A39A8E', fontSize: '12px', textTransform: 'uppercase' }}>Analyzed Statement</p>
                <p style={{ fontStyle: 'italic', margin: '4px 0 16px' }}>"{labInput}"</p>
                <p style={{ color: '#D84A4A', fontSize: '14px', fontWeight: '600' }}>Detected Blindspot:</p>
                <p style={{ fontSize: '14px', lineHeight: '1.5', margin: '4px 0 16px' }}>You are operating under the core assumption that uncertainty is inherently dangerous. What changes if uncertainty is treated as space to move?</p>
                <button onClick={() => { setLabStep(0); setLabInput(""); }} style={{ background: 'transparent', color: '#6FD6FF', border: 'none', cursor: 'pointer', padding: 0 }}>← Reset Workbench</button>
              </div>
            )}
          </div>
        )}

        {page === "garden" && (
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Question Garden</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {GARDEN_DB.map(item => (
                <div key={item.id} style={{ background: '#1B1E22', padding: '16px', borderRadius: '12px', border: '1px solid #2C3137' }}>
                  <p style={{ margin: '0 0 12px 0', lineHeight: '1.4' }}>{item.text}</p>
                  <button onClick={() => { setChatLog([{ role: 'sensei', text: item.text }]); setPage('inquiry'); }} style={{ background: '#E8E8E8', color: '#111315', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>Reflect →</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === "vault" && (
          <div style={{ textAlign: 'center', paddingTop: '20px' }}>
            <h2 style={{ fontSize: '20px', margin: '0 0 8px' }}>Deep Observation</h2>
            <p style={{ color: '#A39A8E', fontSize: '14px', marginBottom: '24px' }}>Long-form context blocks anchoring core paths.</p>
            <div style={{ background: '#1B1E22', aspectRatio: '16/9', borderRadius: '12px', border: '1px dashed #2C3137', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A39A8E' }}>
              <span>6-8 Min Vault Anchor Locked</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
  }
                  
