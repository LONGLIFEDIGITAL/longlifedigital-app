import { useState, useRef, useEffect } from "react";

const WELCOME = "Hi! I'm your Longlife Digital AI assistant. Ask me anything about our services, courses, domains, or digital products. 👋";

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const apiMessages = next.filter(m => m.role !== "assistant" || m.content !== WELCOME);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Sorry, I couldn't respond. Try again!" }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: "linear-gradient(135deg, #7C3AED, #9333EA)",
          color: "#fff", border: "none", borderRadius: 50,
          width: 60, height: 60, fontSize: 26, cursor: "pointer",
          boxShadow: "0 4px 24px rgba(147,51,234,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        title="Live Chat with AI Assistant"
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: 94, right: 24, zIndex: 9998,
          width: 360, height: 500,
          background: "linear-gradient(160deg, #0a001e, #1a0533)",
          border: "1px solid rgba(147,51,234,0.4)",
          borderRadius: 20,
          boxShadow: "0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(147,51,234,0.2)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          animation: "chatSlideIn 0.25s ease",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 18px",
            background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(147,51,234,0.2))",
            borderBottom: "1px solid rgba(147,51,234,0.3)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "linear-gradient(135deg,#7C3AED,#9333EA)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0,
            }}>🤖</div>
            <div>
              <div style={{ color: "#E8C97A", fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>AI Assistant</div>
              <div style={{ color: "#A78BFA", fontSize: 11 }}>Longlife Digital • Online now</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, background: "#22C55E", borderRadius: "50%", boxShadow: "0 0 6px #22C55E" }} />
              <span style={{ color: "#A78BFA", fontSize: 11 }}>Live</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "14px 14px 6px",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "82%",
                  padding: "9px 13px",
                  borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.role === "user"
                    ? "linear-gradient(135deg,#7C3AED,#9333EA)"
                    : "rgba(255,255,255,0.07)",
                  border: m.role === "user" ? "none" : "1px solid rgba(147,51,234,0.2)",
                  color: m.role === "user" ? "#fff" : "#E2D9F3",
                  fontSize: 13, lineHeight: 1.5,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "9px 16px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(147,51,234,0.2)",
                  borderRadius: "14px 14px 14px 4px",
                  color: "#A78BFA", fontSize: 20, letterSpacing: 2,
                }}>
                  <span style={{ animation: "dot 1.2s infinite" }}>•</span>
                  <span style={{ animation: "dot 1.2s 0.4s infinite" }}>•</span>
                  <span style={{ animation: "dot 1.2s 0.8s infinite" }}>•</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px",
            borderTop: "1px solid rgba(147,51,234,0.2)",
            display: "flex", gap: 8, alignItems: "center",
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask about our services..."
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(147,51,234,0.3)",
                borderRadius: 10,
                color: "#fff",
                fontSize: 13,
                padding: "9px 12px",
                outline: "none",
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim()
                  ? "rgba(124,58,237,0.3)"
                  : "linear-gradient(135deg,#7C3AED,#9333EA)",
                border: "none",
                borderRadius: 10,
                color: "#fff",
                width: 38, height: 38,
                fontSize: 16, cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatSlideIn { from { opacity:0; transform:translateY(20px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes dot { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
      `}</style>
    </>
  );
}
