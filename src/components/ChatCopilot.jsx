import React, { useState, useRef, useEffect } from 'react';

const ChatCopilot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'GridShield AI online. How can I assist you with telemetry forensics today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      // Add empty AI message placeholder to show typing in real-time
      setMessages(prev => [...prev, { role: 'ai', content: '' }]);
      
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiResponse = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        aiResponse += decoder.decode(value, { stream: true });
        
        setMessages(prev => {
          const newMsg = [...prev];
          newMsg[newMsg.length - 1].content = aiResponse;
          return newMsg;
        });
      }
    } catch (err) {
      setMessages(prev => {
        const newMsg = [...prev];
        newMsg[newMsg.length - 1].content = `Error: ${err.message}`;
        return newMsg;
      });
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-copilot-panel">
      <div className="chat-header">
        <div className="chat-title">
          <span className="material-symbols-outlined chat-icon">robot_2</span>
          <h3>Ollama Forensics Copilot</h3>
        </div>
        <button className="chat-close-btn" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="chat-body" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            {msg.role === 'ai' && <span className="material-symbols-outlined chat-avatar">smart_toy</span>}
            <div className="chat-bubble">
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chat-message ai">
            <span className="material-symbols-outlined chat-avatar">smart_toy</span>
            <div className="chat-bubble typing-dots">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}
      </div>

      <form className="chat-footer" onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask GridShield AI..." 
          disabled={isTyping}
        />
        <button type="submit" disabled={isTyping || !input.trim()}>
          <span className="material-symbols-outlined">send</span>
        </button>
      </form>
    </div>
  );
};

export default ChatCopilot;
