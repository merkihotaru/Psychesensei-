'use client';
import { useState, useEffect, useRef } from 'react';

const QUOTES = [
  { text: "We suffer more in imagination than in reality.", author: "Seneca" },
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "Not everything that is faced can be changed, but nothing can be changed until it is faced.", author: "James Baldwin" }
];

const GARDEN_DB = [
  { id: 1, text: "If we decoupled your value from visible output, what changes?", tags: ["Identity", "Success"] },
  { id: 2, text: "Whose timeline are you actively running on right now?", tags: ["Parents", "Expectations"] },
  { id: 3, text: "What is the specific worst-case scenario you are avoiding?", tags: ["Fear", "Future"] },
  { id: 4, text: "What belief about yourself have you never actually tested?", tags: ["Identity", "Assumptions"] }
];

function AnimatedMascot({ size = 64, isThinking = false }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', transition: 'transform 0.3s ease' }}>
      <div style={{ position: 'absolute', width: '120%', height: '120%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(111,214,255,0.15) 0%, rgba(216,74,74,0.15) 100%)', filter: 'blur(12px)', opacity: isThinking ? 0.8 : 0.4 }}></div>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ zIndex: 1, borderRadius: '50%' }}>
        <defs><clipPath id="circle-clip"><circle cx="50" cy="50" r="48" /></clipPath></defs>
        <g clipPath="url(#circle-clip)">
          <rect x="0" y="0" width="50" height="100" fill="#6FD6FF" />
          <rect x="50" y="0" width="50" height="100" fill="#D84A4A" />
        </g>
        <circle cx="50" cy="50" r="48" fill="none" stroke="#2C3137" strokeWidth="2" />
        <g>
          {isThinking ? (
            <>
              <path d="M30 48 Q35 45 40 48" stroke="#111315" strokeWidth="3" fill="none" />
              <path d="M60 48 Q65 45 70 48" stroke="#111315" strokeWidth="3" fill="none" />
            </>
          ) : (
            <>
              <circle cx="35" cy="50" r="4.5" fill="#111315" />
              <circle cx="65" cy="50" r="4.5" fill="#111315" />
            </>
          )}
        </g>
        {isThinking ? (
          <path d="M44 65 Q50 63 56 65" stroke="#111315" strokeWidth="3" fill="none" />
        ) : (
          <path d="M42 65 Q50 70 58 65" stroke="#111315" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "home", label: "Campfire" },
  { id: "inquiry", label: "Inquiry" },
  { id: "lab", label: "Thought Lab" },
  { id: "garden", label: "Garden" },
  { id: "vault", label: "Vault" },
  { id: "journal", label: "Journal" }
];

export default function Home() {
  const [page, setPage] = useState("home");
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [greeting, setGreeting] = useState("Welcome back.");
  const [chatLog, setChatLog] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [activeTag, setActiveTag] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [labView, setLabView] = useState("menu");
  const [labInput, setLabInput] = useState("");
  const [labStep, setLabStep] = useState(0);
  const [journalInput, setJournalInput] = useState("");
  const [journalEntries, setJournalEntries] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const hours = new Date().getHours();
    const hasVisited = localStorage.getItem('psyche_visited');
    let baseGreeting = "Welcome.";
    if (hours < 12) baseGreeting = "Good morning. What's worth noticing today?";
    else if (hours < 18) baseGreeting = "Good afternoon. Anything on your mind?";
    else baseGreeting = "Before you sleep, what remains unresolved?";

    if (hasVisited) setGreeting(`Welcome back. ${baseGreeting}`);
    else {
      setGreeting(baseGreeting);
      localStorage.setItem('psyche_visited', 'true');
    }

    const savedLogs = localStorage.getItem('psyche_chat');
    if (savedLogs) setChatLog(JSON.parse(savedLogs));
    else setChatLog([{ role: "sensei", text: "What is an assumption about your path that you treat as an absolute fact?" }]);

    const savedJournal = localStorage.getItem('psyche_journal');
    if (savedJournal) setJournalEntries(JSON.parse(savedJournal));

    const interval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, isThinking, page]);

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
      
      if (!response.ok) throw new Error("API Route Failed");
      
      const data = await response.json();
      
      // Safety net so you know exactly why it fails
      const replyText = data.text || "My API connection is severed. You need to add the AI_API_KEY in Vercel settings so I can think.";
        
      const nextLog = [...updatedLog, { role: "sensei", text: replyText }];
      setChatLog(nextLog);
      localStorage.setItem('psyche_chat', JSON.stringify(nextLog));
    } catch (err) {
      setChatLog(prev => [...prev, { role: "sensei", text: "Network error. Make sure 'src/app/api/inquiry/route.js' exists and Vercel has your API key configured." }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleExploreGarden = (questionText) => {
    setChatLog([{ role: "sensei", text: questionText }]);
    setPage("inquiry");
  };

  const filteredGarden = GARDEN_DB.filter(q => 
    (activeTag ? q.tags.includes(activeTag) : true) &&
    (searchTerm ? q.text.toLowerCase().includes(searchTerm.toLowerCase()) : true)
  );

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <header style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #2C3137', background: '#111315', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(90deg, #6FD6FF 50%, #D84A4A 50%)', marginRight: 12 }}></div>
        <span style={{ fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', fontSize: 14 }}>PsycheSensei</span>
      </header>

      <nav style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '8px' }}>
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              border: '1px solid #2C3137', background: page === item.id ? '#E8E8E8' : 'transparent', color: page === item.id ? '#111315' : '#A39A8E'
            }}>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ flexGrow: 1, padding: '24px 20px', overflowY: 'auto' }}>
        
        {page === "home" && (
          <div style={{ textAlign: 'center', paddingBottom: '40px' }}>
            <div style={{ margin: '10px 0 30px' }}><AnimatedMascot size={80} /></div>
            <h1 style={{ fontFamily: 'serif', fontSize: 28, margin: '0 0 12px', fontWeight: 400 }}>Not Answers.<br/>Better Questions.</h1>
            <div style={{ minHeight: '60px', marginBottom: '32px', padding: '0 20px' }}>
              <p style={{ fontFamily: 'serif', color: '#E8E8E8', fontSize: 15, fontStyle: 'italic', margin: '0 0 6px' }}>"{QUOTES[quoteIdx].text}"</p>
              <p style={{ color: '#A39A8E', fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>— {QUOTES[quoteIdx].author}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'left' }}>
              <div style={{ background: '#1B1E22', border: '1px solid #2C3137', padding: 16, borderRadius: 12, cursor: 'pointer' }} onClick={() => setPage("inquiry")}>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, color: '#6FD6FF' }}>The Inquiry</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#A39A8E' }}>Socratic dialogue.</p>
              </div>
              <div style={{ background: '#1B1E22', border: '1px solid #2C3137', padding: 16, borderRadius: 12, cursor: 'pointer' }} onClick={() => setPage("lab")}>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, color: '#D84A4A' }}>Thought Lab</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#A39A8E' }}>Bias & assumptions.</p>
              </div>
            </div>
          </div>
        )}

        {page === "inquiry" && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', paddingBottom: 20 }}>
              {chatLog.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                  {msg.role === 'sensei' && <div style={{ marginBottom: 6 }}><AnimatedMascot size={28} /></div>}
                  <div style={{ background: msg.role === 'user' ? '#1B1E22' : 'transparent', border: msg.role === 'user' ? '1px solid #2C3137' : 'none', padding: msg.role === 'user' ? '12px 16px' : '0', borderRadius: 16, fontSize: msg.role === 'sensei' ? 18 : 14, color: msg.role === 'sensei' ? '#6FD6FF' : '#E8E8E8', fontFamily: msg.role === 'sensei' ? 'serif' : 'sans-serif', lineHeight: 1.5 }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                  <div style={{ marginBottom: 6 }}><AnimatedMascot size={28} isThinking={true} /></div>
                  <div style={{ fontSize: 13, color: '#A39A8E', fontStyle: 'italic' }}>Sensei is observing...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 12 }}>
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChatSend()} placeholder="Explore the thought..." style={{ flexGrow: 1, background: '#1B1E22', border: '1px solid #2C3137', color: '#E8E8E8', padding: '14px 16px', borderRadius: 999, outline: 'none', fontSize: 14 }} />
              <button onClick={handleChatSend} style={{ background: '#E8E8E8', color: '#111315', border: 'none', borderRadius: 999, padding: '0 20px', fontWeight: 600 }}>Send</button>
            </div>
          </div>
        )}

        {page === "lab" && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <AnimatedMascot size={40} />
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>Thought Lab</h2>
                <p style={{ margin: 0, fontSize: 12, color: '#D84A4A' }}>Interactive mechanics.</p>
              </div>
            </div>

            {labView === "menu" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#1B1E22', padding: 20, borderRadius: 16, border: '1px solid #2C3137', cursor: 'pointer' }} onClick={() => setLabView("assumption")}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#E8E8E8' }}>Assumption Detector</h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#A39A8E', lineHeight: 1.5 }}>Isolate the hidden premises in your current source of stress.</p>
                </div>
                <div style={{ background: '#1B1E22', padding: 20, borderRadius: 16, border: '1px solid #2C3137', cursor: 'pointer' }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#E8E8E8' }}>Perspective Shift</h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#A39A8E', lineHeight: 1.5 }}>Examine a situation entirely without using the word "I".</p>
                </div>
              </div>
            )}

            {labView === "assumption" && labStep === 0 && (
              <div style={{ background: '#1B1E22', border: '1px solid #2C3137', padding: 24, borderRadius: 16 }}>
                <p style={{ fontFamily: 'serif', fontSize: 18, marginBottom: 16, lineHeight: 1.4 }}>What is a statement you currently believe to be absolute fact?</p>
                <textarea value={labInput} onChange={e => setLabInput(e.target.value)} placeholder="e.g., I will fail if my timeline shifts..." style={{ width: '100%', background: '#111315', border: '1px solid #2C3137', color: '#E8E8E8', padding: 16, borderRadius: 12, minHeight: 120, outline: 'none', marginBottom: 16, fontSize: 14, boxSizing: 'border-box' }}></textarea>
                <button onClick={() => { if(labInput.trim()) setLabStep(1); }} style={{ width: '100%', background: '#D84A4A', color: '#E8E8E8', border: 'none', borderRadius: 8, padding: '14px', fontWeight: 600 }}>Isolate Assumptions</button>
                <button onClick={() => setLabView("menu")} style={{ marginTop: 16, background: 'transparent', color: '#A39A8E', border: 'none', width: '100%', padding: '10px' }}>Cancel</button>
              </div>
            )}

            {labView === "assumption" && labStep === 1 && (
              <div>
                <p style={{ fontSize: 13, color: '#A39A8E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>Original Thought</p>
                <div style={{ padding: 16, background: '#111315', borderRadius: 12, border: '1px dashed #2C3137', marginBottom: 24, color: '#E8E8E8', fontStyle: 'italic' }}>"{labInput}"</div>
                <p style={{ fontSize: 13, color: '#A39A8E', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>Detected Premises</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: '#1B1E22', padding: 16, borderRadius: 12, border: '1px solid #2C3137', color: '#E8E8E8', fontSize: 14, lineHeight: 1.5 }}>
                    <span style={{ color: '#D84A4A', fontWeight: 'bold', marginRight: 8 }}>1.</span> You believe success is tied strictly to a visible, universally agreed-upon output.
                  </div>
                </div>
                <button onClick={() => { setLabView("menu"); setLabStep(0); setLabInput(""); }} style={{ marginTop: 24, background: 'transparent', color: '#6FD6FF', border: 'none', fontSize: 14, width: '100%' }}>← Reset Workbench</button>
              </div>
            )}
          </div>
        )}

        {page === "garden" && (
          <div>
            <h2 style={{ fontFamily: 'serif', fontSize: 24, margin: '0 0 16px' }}>Question Garden</h2>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by topic or feeling..." style={{ width: '100%', background: '#1B1E22', border: '1px solid #2C3137', color: '#E8E8E8', padding: '12px 16px', borderRadius: 12, outline: 'none', marginBottom: 20, boxSizing: 'border-box' }} />
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {["Identity", "Expectations", "Fear", "Parents"].map(tag => (
                <span key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} style={{
                  padding: '6px 12px', borderRadius: '999px', fontSize: 12, cursor: 'pointer', border: '1px solid transparent',
                  background: activeTag === tag ? '#E8E8E8' : '#2C3137', color: activeTag === tag ? '#111315' : '#E8E8E8'
                }}># {tag}</span>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredGarden.length > 0 ? filteredGarden.map(item => (
                <div key={item.id} style={{ background: '#1B1E22', padding: 16, borderRadius: 12, border: '1px solid #2C3137' }}>
                  <p style={{ fontFamily: 'serif', margin: '0 0 12px', fontSize: 16, lineHeight: 1.4, color: '#E8E8E8' }}>{item.text}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                       {item.tags.map(tag => <span key={tag} style={{ fontSize: 10, color: '#6FD6FF', background: '#111315', padding: '2px 8px', borderRadius: 4 }}>{tag}</span>)}
                    </div>
                    <button onClick={() => handleExploreGarden(item.text)} style={{ padding: '6px 16px', fontSize: 12, background: '#E8E8E8', color: '#111315', border: 'none', borderRadius: 999, cursor: 'pointer' }}>Explore →</button>
                  </div>
                </div>
              )) : (
                <p style={{ color: '#A39A8E', textAlign: 'center', marginTop: 20 }}>No reflections found.</p>
              )}
            </div>
          </div>
        )}

        {page === "vault" && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ margin: '0 auto 20px', display: 'flex', justifyContent: 'center' }}><AnimatedMascot size={56} /></div>
            <h2 style={{ fontFamily: 'serif', fontSize: 24, margin: '0 0 8px' }}>Deep Observation</h2>
            <p style={{ color: '#A39A8E', fontSize: 14, marginBottom: 32, lineHeight: 1.5 }}>Uncluttered 6-8 minute philosophical frameworks.<br/>No short-form content allowed.</p>
            <div style={{ background: '#1B1E22', aspectRatio: '16/9', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#A39A8E', border: '1px solid #2C3137' }}>
              <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>Load 6-8 Min Anchor</span>
            </div>
          </div>
        )}

        {page === "journal" && (
          <div>
            <h2 style={{ fontFamily: 'serif', fontSize: 24, margin: '0 0 8px' }}>Private Timeline</h2>
            <p style={{ color: '#A39A8E', fontSize: 14, marginBottom: 24 }}>A quiet place to track how your philosophical map shifts over time.</p>
            <textarea value={journalInput} onChange={e => setJournalInput(e.target.value)} placeholder="Log a reflection..." style={{ width: '100%', background: '#1B1E22', border: '1px solid #2C3137', color: '#E8E8E8', padding: 16, borderRadius: 12, minHeight: 120, outline: 'none', marginBottom: 12, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}></textarea>
            <button onClick={() => {
              if(!journalInput.trim()) return;
              const newEntry = { id: Date.now(), date: new Date().toLocaleDateString(), text: journalInput };
              const updated = [newEntry, ...journalEntries];
              setJournalEntries(updated);
              localStorage.setItem('psyche_journal', JSON.stringify(updated));
              setJournalInput("");
            }} style={{ width: '100%', background: '#E8E8E8', color: '#111315', borde
