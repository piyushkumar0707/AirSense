import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const ZONES = [
  'anand-vihar', 'rk-puram', 'ito', 'dwarka', 'rohini',
  'punjabi-bagh', 'okhla', 'narela', 'lodhi-road', 'wazirpur',
];

const RISK_COLORS = {
  low: '#22c55e', moderate: '#facc15', high: '#f97316', 'very-high': '#ef4444', severe: '#7c3aed',
};

/**
 * AdvisoryChat — Citizen health advisory chatbot (Hindi + English).
 * Props: none
 */
export default function AdvisoryChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'नमस्ते! 🌿 Select your location and ask about air quality, health tips, or precautions. / Select location below and type your question.',
      language: 'en',
    },
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [location, setLocation] = useState('anand-vihar');
  const [loading, setLoading] = useState(false);
  const [riskLevel, setRiskLevel] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await axios.post('/api/advisory/chat', {
        location,
        query: input,
        language,
      });
      setRiskLevel(data.riskLevel);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.reply, riskLevel: data.riskLevel, currentAQI: data.currentAQI },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: language === 'hi'
            ? 'क्षमा करें, सेवा अभी उपलब्ध नहीं है।'
            : 'Sorry, advisory service is temporarily unavailable. Please try again.',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '480px' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ flex: 1, background: '#1a2332', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.4rem 0.75rem', color: '#f1f5f9', fontSize: '0.85rem' }}
        >
          {ZONES.map((z) => (
            <option key={z} value={z}>{z.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['en', 'hi'].map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              style={{
                padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                background: language === lang ? 'rgba(59,130,246,0.2)' : 'transparent',
                color: language === lang ? '#3b82f6' : '#64748b',
                border: language === lang ? '1px solid rgba(59,130,246,0.4)' : '1px solid #1e293b',
              }}
            >
              {lang === 'en' ? '🇬🇧 EN' : '🇮🇳 HI'}
            </button>
          ))}
        </div>
        {riskLevel && (
          <span style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, background: `${RISK_COLORS[riskLevel]}20`, color: RISK_COLORS[riskLevel], border: `1px solid ${RISK_COLORS[riskLevel]}40` }}>
            Risk: {riskLevel.replace('-', ' ').toUpperCase()}
          </span>
        )}
      </div>

      {/* Message list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '0.25rem', marginBottom: '0.75rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '0.6rem 0.9rem', borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.role === 'user' ? 'rgba(59,130,246,0.2)' : msg.isError ? 'rgba(239,68,68,0.1)' : '#1a2332',
              border: `1px solid ${msg.role === 'user' ? 'rgba(59,130,246,0.3)' : msg.isError ? 'rgba(239,68,68,0.3)' : '#1e293b'}`,
              fontSize: '0.85rem', lineHeight: 1.6, color: msg.isError ? '#ef4444' : '#f1f5f9',
            }}>
              {msg.text}
              {msg.currentAQI && (
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                  📍 {location.replace(/-/g, ' ')} · AQI {msg.currentAQI}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '0.6rem 0.9rem', borderRadius: '12px 12px 12px 2px', background: '#1a2332', border: '1px solid #1e293b', fontSize: '0.85rem', color: '#64748b' }}>
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={language === 'hi' ? 'अपना सवाल यहाँ लिखें…' : 'Ask about air quality, precautions, health tips…'}
          style={{
            flex: 1, background: '#1a2332', border: '1px solid #1e293b', borderRadius: '8px',
            padding: '0.6rem 0.9rem', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none',
          }}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
            background: loading || !input.trim() ? 'rgba(59,130,246,0.3)' : '#3b82f6',
            color: '#fff', border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
