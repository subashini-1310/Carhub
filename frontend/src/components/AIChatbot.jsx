import React, { useState } from 'react';
import { api } from '../services/api';
import { Bot, Send, X, MessageSquare, Sparkles } from 'lucide-react';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am CarHub AI. Ask me about SUVs under ₹10 Lakhs, rental rules, EMI financing, or booking status!",
      quickReplies: ['SUVs under ₹10 Lakhs', 'How Selling Works', 'Rental Rules', 'Loan EMI Info']
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.askAIChatbot(query);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: res.text,
        cars: res.cars,
        quickReplies: res.quickReplies
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "I am ready to assist! Ask me 'I need an SUV below ₹10 Lakhs' or 'Rental rules'."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 'clamp(74px, 10vh, 24px)', right: 'clamp(12px, 3vw, 24px)', zIndex: 1000 }}>
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="pulse-active"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: '#fff',
            border: 'none',
            borderRadius: '50px',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)',
            fontSize: '0.86rem',
            minHeight: '44px'
          }}
        >
          <Bot size={20} />
          <span>CarHub AI</span>
        </button>
      ) : (
        <div className="glass-panel" style={{
          width: 'min(92vw, 360px)',
          height: 'clamp(380px, 65vh, 480px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          borderRadius: '18px'
        }}>
          {/* Chat Header */}
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: '#fff',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800' }}>CarHub AI Chatbot</h4>
                <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>Online • Instant Assistance</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages Body */}
          <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((m, idx) => (
              <div 
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: m.sender === 'user' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: m.sender === 'user' ? '#fff' : 'var(--text-main)',
                  padding: '10px 14px',
                  borderRadius: m.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  fontSize: '0.82rem',
                  lineHeight: 1.4,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              >
                <div>{m.text}</div>

                {/* Car Cards returned by AI */}
                {m.cars && m.cars.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    {m.cars.map((c, i) => (
                      <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={c.image} alt={c.title} style={{ width: '40px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.78rem' }}>{c.title}</div>
                          <div style={{ color: '#10b981', fontSize: '0.72rem' }}>₹{c.price.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Reply Chips */}
                {m.quickReplies && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {m.quickReplies.map((qr, i) => (
                      <button 
                        key={i}
                        onClick={() => handleSend(qr)}
                        style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#60a5fa', fontSize: '0.68rem', padding: '3px 8px', borderRadius: '12px', cursor: 'pointer' }}
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                CarHub AI is thinking...
              </div>
            )}
          </div>

          {/* Input Box */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{ padding: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '6px' }}
          >
            <input 
              type="text"
              placeholder="e.g. I need an SUV below ₹10 Lakhs"
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.8rem' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '8px 12px', borderRadius: '50%' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
