'use client';

import { useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function HelpBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Namaste! 👋 Main ZorPDF Help Bot hoon. ZorPDF ke tools use karne, file upload, conversion, compression ya download se related koi bhi sawal pooch sakte hain.',
    },
  ]);

  const quickQuestions = [
    'PDF kaise compress karein?',
    'PDF ko JPG mein kaise badlein?',
    'PDF upload nahi ho raha',
  ];

  const sendMessage = async (text?: string) => {
    const question = (text ?? input).trim();

    if (!question || loading) return;

    setInput('');

    const userMessage: Message = {
      role: 'user',
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai-help', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Something went wrong');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            data?.reply ||
            'Sorry, abhi main answer nahi de pa raha hoon. Please thodi der baad try karein.',
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry 😔 Help Bot se connection nahi ho pa raha hai. Please thodi der baad try karein.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div
          style={{
            position: 'fixed',
            right: '20px',
            bottom: '90px',
            width: '360px',
            maxWidth: 'calc(100vw - 30px)',
            height: '520px',
            background: '#ffffff',
            borderRadius: '18px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              background: '#111827',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                }}
              >
                ZorPDF Help Bot
              </div>

              <div
                style={{
                  fontSize: '12px',
                  opacity: 0.8,
                  marginTop: '3px',
                }}
              >
                Online • How can I help?
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              aria-label="Close Help Bot"
              style={{
                border: 'none',
                background: 'transparent',
                color: '#ffffff',
                fontSize: '24px',
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: '14px',
              overflowY: 'auto',
              background: '#f9fafb',
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent:
                    message.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '10px 12px',
                    borderRadius: '13px',
                    background:
                      message.role === 'user' ? '#111827' : '#ffffff',
                    color:
                      message.role === 'user' ? '#ffffff' : '#1f2937',
                    border:
                      message.role === 'assistant'
                        ? '1px solid #e5e7eb'
                        : 'none',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div
                style={{
                  color: '#6b7280',
                  fontSize: '13px',
                  padding: '8px',
                }}
              >
                Help Bot typing...
              </div>
            )}
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div
              style={{
                padding: '8px 12px',
                background: '#ffffff',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => sendMessage(question)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    marginBottom: '5px',
                    borderRadius: '9px',
                    border: '1px solid #e5e7eb',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#374151',
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '12px',
              background: '#ffffff',
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
              placeholder="Apna sawal likhein..."
              disabled={loading}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #d1d5db',
                outline: 'none',
                fontSize: '14px',
              }}
            />

            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background:
                  loading || !input.trim() ? '#9ca3af' : '#111827',
                color: '#ffffff',
                cursor:
                  loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open ZorPDF Help Bot"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          border: 'none',
          background: '#111827',
          color: '#ffffff',
          boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          zIndex: 10000,
          fontSize: '25px',
        }}
      >
        {open ? '×' : '?'}
      </button>
    </>
  );
}
