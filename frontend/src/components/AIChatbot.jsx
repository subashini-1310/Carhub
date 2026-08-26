import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  LogIn, 
  Eye, 
  CheckCircle2, 
  ChevronRight,
  Flame,
  Info
} from 'lucide-react';

export default function AIChatbot({ user, onNavigateToCar, onOpenAuth }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "👋 Hello! I am **CarHub AI**. Ask me anything like *'Show me Tata brand cars'*, *'SUVs under ₹10 Lakhs'*, *'Rental rules'*, or *'EMI calculation'*!",
      quickReplies: [
        'Show me Tata brand cars',
        'SUVs under ₹10 Lakhs',
        'Hyundai & Toyota Cars',
        'Self-Drive Rentals',
        'Calculate EMI',
        'Contact Admin'
      ]
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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
        recommendations: res.recommendations,
        quickReplies: res.quickReplies
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "I am here to assist! Try asking: *'Show me Tata brand cars'* or *'SUVs under ₹10 Lakhs'*.",
        quickReplies: ['Show me Tata brand cars', 'SUVs under ₹10 Lakhs', 'Contact Admin']
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCarClick = (car) => {
    if (!user) {
      // Prompt user to login/signup
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          isAuthPrompt: true,
          targetCar: car,
          text: `🔒 To view full 140+ point inspection reports, verified service history, and pricing for **${car.title}**, please login or create a free account!`
        }
      ]);
      if (onOpenAuth) {
        onOpenAuth('Buyer / Renter');
      }
      return;
    }

    if (onNavigateToCar) {
      onNavigateToCar(car);
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
            minHeight: '44px',
            transition: 'all 0.2s ease'
          }}
        >
          <Bot size={20} />
          <span>CarHub AI</span>
          <span style={{ 
            background: 'rgba(255,255,255,0.25)', 
            padding: '2px 7px', 
            borderRadius: '10px', 
            fontSize: '0.68rem',
            fontWeight: '800' 
          }}>
            LIVE
          </span>
        </button>
      ) : (
        <div className="glass-panel" style={{
          width: 'min(94vw, 390px)',
          height: 'clamp(420px, 72vh, 560px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          borderRadius: '20px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          background: 'var(--bg-main)'
        }}>
          {/* Chat Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            color: '#fff',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                background: 'rgba(255,255,255,0.15)', 
                padding: '6px', 
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={18} color="#93c5fd" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0 }}>CarHub AI Concierge</h4>
                <span style={{ fontSize: '0.7rem', color: '#bfdbfe', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span>
                  Online • Smart Search & Recommendations
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ 
                background: 'rgba(255,255,255,0.12)', 
                border: 'none', 
                color: '#fff', 
                cursor: 'pointer',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div style={{ 
            flex: 1, 
            padding: '14px', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            background: 'var(--bg-main)'
          }}>
            {messages.map((m, idx) => (
              <div 
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                  background: m.sender === 'user' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'var(--bg-secondary)',
                  color: m.sender === 'user' ? '#fff' : 'var(--text-main)',
                  padding: '12px 14px',
                  borderRadius: m.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  fontSize: '0.84rem',
                  lineHeight: 1.45,
                  boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--border-color)'
                }}
              >
                {/* Message Text */}
                <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>

                {/* Login/Signup Prompt for non-logged-in users */}
                {m.isAuthPrompt && !user && (
                  <div style={{ marginTop: '10px' }}>
                    <button
                      onClick={() => onOpenAuth && onOpenAuth('Buyer / Renter')}
                      className="btn-primary"
                      style={{
                        width: '100%',
                        padding: '8px 14px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <LogIn size={15} /> Login / Sign Up to View Car
                    </button>
                  </div>
                )}

                {/* Primary Cars returned by AI */}
                {m.cars && m.cars.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    {m.cars.map((c, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleCarClick(c)}
                        style={{ 
                          background: 'var(--bg-main)', 
                          padding: '8px', 
                          borderRadius: '12px', 
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease, border-color 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      >
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <img 
                            src={c.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600'} 
                            alt={c.title} 
                            style={{ width: '64px', height: '48px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} 
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '800', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                              <span style={{ color: '#10b981', fontWeight: '800', fontSize: '0.8rem' }}>
                                ₹{(c.price || 0).toLocaleString()}
                              </span>
                              {c.kmDriven > 0 && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                                  • {c.kmDriven.toLocaleString()} km
                                </span>
                              )}
                              {c.fuelType && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                                  • {c.fuelType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Badges & Action */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px dashed var(--border-color)' }}>
                          <span style={{ 
                            fontSize: '0.68rem', 
                            color: '#3b82f6', 
                            background: 'rgba(59, 130, 246, 0.12)', 
                            padding: '2px 6px', 
                            borderRadius: '6px',
                            fontWeight: '700'
                          }}>
                            {c.recommendationReason || '⭐ 140+ Point Score: 98/100'}
                          </span>
                          <span style={{ 
                            fontSize: '0.72rem', 
                            fontWeight: '700', 
                            color: user ? '#3b82f6' : '#f59e0b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            {user ? 'View Car' : 'Login to View'} <ChevronRight size={13} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Smart Recommendations Section */}
                {m.recommendations && m.recommendations.length > 0 && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '8px', 
                    background: 'rgba(59, 130, 246, 0.06)', 
                    borderRadius: '10px',
                    border: '1px dashed rgba(59, 130, 246, 0.3)'
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#60a5fa', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={12} /> AI Recommended Alternatives:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {m.recommendations.map((rec, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleCarClick(rec)}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '4px 8px', 
                            background: 'var(--bg-main)', 
                            borderRadius: '6px', 
                            cursor: 'pointer',
                            fontSize: '0.74rem'
                          }}
                        >
                          <span style={{ fontWeight: '700' }}>{rec.title}</span>
                          <span style={{ color: '#10b981', fontWeight: '800' }}>₹{(rec.price || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Reply Chips */}
                {m.quickReplies && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                    {m.quickReplies.map((qr, i) => (
                      <button 
                        key={i}
                        onClick={() => handleSend(qr)}
                        style={{ 
                          background: 'rgba(59, 130, 246, 0.12)', 
                          border: '1px solid rgba(59, 130, 246, 0.35)', 
                          color: '#60a5fa', 
                          fontSize: '0.72rem', 
                          padding: '4px 10px', 
                          borderRadius: '14px', 
                          cursor: 'pointer',
                          fontWeight: '600',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.12)';
                          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.35)';
                        }}
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ 
                alignSelf: 'flex-start', 
                background: 'var(--bg-secondary)', 
                padding: '10px 14px', 
                borderRadius: '14px', 
                fontSize: '0.78rem', 
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Sparkles size={14} className="spin-slow" color="#3b82f6" />
                CarHub AI is analyzing certified database...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{ 
              padding: '10px 14px', 
              borderTop: '1px solid var(--border-color)', 
              display: 'flex', 
              gap: '8px',
              background: 'var(--bg-secondary)'
            }}
          >
            <input 
              type="text"
              placeholder="e.g. show me the tata brand cars"
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{ 
                flex: 1, 
                padding: '9px 14px', 
                borderRadius: '24px', 
                border: '1px solid var(--border-color)', 
                background: 'var(--bg-main)', 
                color: 'var(--text-main)', 
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ 
                padding: '9px 14px', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
                minHeight: '40px'
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
