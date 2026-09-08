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

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: question,
      },
    ]);

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
      console.error('Help Bot error:', error);

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
            bottom: '92px',
            width: '370px',
            maxWidth: 'calc(100vw - 24px)',
            height: '540px',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 18px 50px rgba(37, 99, 235, 0.18)',
            border: '1px solid #dbeafe',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '17px 18px',
              background:
                'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.18)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  letterSpacing: '-0.2px',
                }}
              >
                ZorPDF Help Bot
              </div>

              <div
                style={{
                  fontSize: '12px',
                  opacity: 0.9,
                  marginTop: '4px',
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
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                fontSize: '24px',
                cursor: 'pointer',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: '15px',
              overflowY: 'auto',
              background: '#f8fbff',
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent:
                    message.role === 'user'
                      ? 'flex-end'
                      : 'flex-start',
                  marginBottom: '11px',
                }}
              >
                <div
                  style={{
                    maxWidth: '84%',
                    padding: '11px 13px',
                    borderRadius:
                      message.role === 'user'
                        ? '15px 15px 4px 15px'
                        : '15px 15px 15px 4px',
                    background:
                      message.role === 'user'
                        ? '#2563eb'
                        : '#ffffff',
                    color:
                      message.role === 'user'
                        ? '#ffffff'
                        : '#1e293b',
                    border:
                      message.role === 'assistant'
                        ? '1px solid #dbeafe'
                        : 'none',
                    boxShadow:
                      message.role === 'assistant'
                        ? '0 3px 10px rgba(37, 99, 235, 0.06)'
                        : '0 4px 12px rgba(37, 99, 235, 0.16)',
                    fontSize: '14px',
                    lineHeight: 1.55,
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
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: '#ffffff',
                  border: '1px solid #dbeafe',
                  borderRadius: '14px',
                  padding: '10px 12px',
                  color: '#64748b',
                  fontSize: '13px',
                }}
              >
                <span>●</span>
                <span>Help Bot typing...</span>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div
              style={{
                padding: '10px 12px',
                background: '#ffffff',
                borderTop: '1px solid #e5efff',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#64748b',
                  marginBottom: '7px',
                  paddingLeft: '2px',
                }}
              >
                Quick Help
              </div>

              {quickQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => sendMessage(question)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 11px',
                    marginBottom: '6px',
                    borderRadius: '10px',
                    border: '1px solid #dbeafe',
                    background: '#f8fbff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#1d4ed8',
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
              borderTop: '1px solid #e5efff',
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
                padding: '11px 12px',
                borderRadius: '11px',
                border: '1px solid #cbdffb',
                outline: 'none',
                fontSize: '14px',
                color: '#1e293b',
                background: '#f8fbff',
              }}
            />

            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                padding: '10px 15px',
                borderRadius: '11px',
                border: 'none',
                background:
                  loading || !input.trim()
                    ? '#bfdbfe'
                    : '#2563eb',
                color: '#ffffff',
                cursor:
                  loading || !input.trim()
                    ? 'not-allowed'
                    : 'pointer',
                fontWeight: 700,
                boxShadow:
                  loading || !input.trim()
                    ? 'none'
                    : '0 5px 14px rgba(37, 99, 235, 0.22)',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Floating Help Bot Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open ZorPDF Help Bot"
        title="ZorPDF Help Bot"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          border: '3px solid #ffffff',
          background:
            'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: '#ffffff',
          boxShadow:
            '0 10px 30px rgba(37, 99, 235, 0.30)',
          cursor: 'pointer',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {open ? (
          <span
            style={{
              fontSize: '30px',
              lineHeight: 1,
              fontWeight: 300,
            }}
          >
            ×
          </span>
        ) : (
          <svg
            width="32"
            height="32"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect
              x="9"
              y="13"
              width="30"
              height="24"
              rx="8"
              stroke="currentColor"
              strokeWidth="3"
            />

            <path
              d="M24 13V7"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <circle
              cx="24"
              cy="5"
              r="2.5"
              fill="currentColor"
            />

            <circle
              cx="18"
              cy="24"
              r="2.5"
              fill="currentColor"
            />

            <circle
              cx="30"
              cy="24"
              r="2.5"
              fill="currentColor"
            />

            <path
              d="M18 30C21 32 27 32 30 30"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            <path
              d="M9 23H6"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <path
              d="M39 23H42"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </>
  );
}
