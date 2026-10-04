// FILE: src/components/common/ChatbotWidget.jsx
//
// Floating chat button + panel. Health-info only, never a diagnosis —
// the actual guardrails live server-side in the system prompt
// (backend/routes/chatbot.js); this just renders the conversation.

import { useState } from "react";
import { askChatbot } from "../../utils/chatbotApi";
import { useAuth } from "../../services/AuthContext";

export default function ChatbotWidget() {
  const { firebaseUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm Setu, your health-info assistant. Ask me anything general — for anything urgent, please use Emergency Help instead." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const reply = await askChatbot(firebaseUser, text, messages);
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (err) {
      console.error("Chatbot error:", err);
      setMessages((m) => [...m, { role: "assistant", text: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button type="button" className="chatbot-fab" onClick={() => setOpen((v) => !v)} aria-label="Open health assistant">
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">Setu — Health Assistant</div>
          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chatbot-bubble chatbot-bubble-${m.role}`}>
                {m.text}
              </div>
            ))}
            {sending && <div className="chatbot-bubble chatbot-bubble-assistant">Typing…</div>}
          </div>
          <form className="chatbot-input-row" onSubmit={handleSend}>
            <input
              placeholder="Ask a health question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={sending}>Send</button>
          </form>
        </div>
      )}
    </>
  );
}