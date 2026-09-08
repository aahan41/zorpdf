'use client';

import { useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const tools = [
  {
    name: 'JPG to PDF',
    description: 'Images ko PDF mein badlein',
    path: '/tool/jpg-to-pdf',
    icon: '🖼️',
  },
  {
    name: 'PDF to JPG',
    description: 'PDF pages ko JPG banayein',
    path: '/tool/pdf-to-jpg',
    icon: '📄',
  },
  {
    name: 'PNG to JPG',
    description: 'PNG image ko JPG banayein',
    path: '/tool/png-to-jpg',
    icon: '🔄',
  },
  {
    name: 'Word to PDF',
    description: 'Word file ko PDF banayein',
    path: '/tool/word-to-pdf',
    icon: '📝',
  },
  {
    name: 'PDF to Word',
    description: 'PDF ko editable Word banayein',
    path: '/tool/pdf-to-word',
    icon: '📘',
  },
  {
    name: 'PDF Compressor',
    description: 'PDF size kam karein',
    path: '/tool/pdf-compressor',
    icon: '🗜️',
  },
  {
    name: 'Zor Remover',
    description: 'Image background remove karein',
    path: '/zor-remover',
    icon: '✨',
  },
];

const helpTopics = [
  {
    title: 'How to use?',
    icon: '💡',
    question: 'ZorPDF tools kaise use karein?',
  },
  {
    title: 'Upload Problem',
    icon: '📤',
    question: 'Mera file upload nahi ho raha',
  },
  {
    title: 'Conversion Problem',
    icon: '⚙️',
    question: 'Mera conversion nahi ho raha',
  },
  {
    title: 'Download Problem',
    icon: '⬇️',
    question: 'Download button kaam nahi kar raha',
  },
];

const quickQuestions = [
  'PDF kaise compress karein?',
  'PDF ko JPG mein kaise badlein?',
  'JPG ko PDF kaise banaye?',
  'PDF ko Word mein kaise badlein?',
];

export default function HelpBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Assalamo Alaikum 🤝\n\nMain ZorPDF Help Bot hoon.\n\nBatayiye, main aapki kaise madad kar sakta hoon? Aap tool use karne, file upload, conversion, compression ya download se related koi bhi sawal pooch sakte hain.',
    },
  ]);

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
            'Sorry 😔 Abhi Help Bot se connection nahi ho pa raha hai. Please thodi der baad try karein.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openTool = (path: string) => {
    window.location.href = path;
  };

  return (
    <>
      {/* Help Bot Window */}
      {open && (
        <div
          style={{
            position: 'fixed',
            right: '18px',
            bottom: '92px',
            width: '400px',
            maxWidth: 'calc(100vw - 20px)',
            height: '650px',
            maxHeight: 'calc(100vh - 110px)',
            background: '#ffffff',
            borderRadius: '22px',
            border: '1px solid #dbeafe',
            boxShadow:
              '0 25px 70px rgba(15, 23, 42, 0.20)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '18px',
              background:
                'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '11px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 48 48"
                    fill="none"
                  >
                    <rect
                      x="9"
                      y="13"
                      width="30"
                      height="24"
                      rx="8"
                      stroke="white"
                      strokeWidth="3"
                    />
                    <path
                      d="M24 13V7"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="24"
                      cy="5"
                      r="2.5"
                      fill="white"
                    />
                    <circle
                      cx="18"
                      cy="24"
                      r="2.5"
                      fill="white"
                    />
                    <circle
                      cx="30"
                      cy="24"
                      r="2.5"
                      fill="white"
                    />
                    <path
                      d="M18 30C21 32 27 32 30 30"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                    }}
                  >
                    ZorPDF Help Bot
                  </div>

                  <div
                    style={{
                      fontSize: '12px',
                      opacity: 0.9,
                      marginTop: '3px',
                    }}
                  >
                    Online • Customer Support
                  </div>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                aria-label="Close Help Bot"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '11px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.14)',
                  color: '#ffffff',
                  fontSize: '25px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              background: '#f8fbff',
              padding: '14px',
            }}
          >
            {/* Messages */}
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent:
                    message.role === 'user'
                      ? 'flex-end'
                      : 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    maxWidth: '88%',
                    padding: '12px 14px',
                    borderRadius:
                      message.role === 'user'
                        ? '16px 16px 5px 16px'
                        : '16px 16px 16px 5px',
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
                        ? '0 4px 14px rgba(37,99,235,0.06)'
                        : '0 6px 18px rgba(37,99,235,0.16)',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {/* Welcome Help */}
            {messages.length === 1 && (
              <>
                <div
                  style={{
                    marginTop: '4px',
                    marginBottom: '8px',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#475569',
                  }}
                >
                  👇 Quick Help
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  {helpTopics.map((topic) => (
                    <button
                      key={topic.title}
                      onClick={() => sendMessage(topic.question)}
                      style={{
                        textAlign: 'left',
                        padding: '11px',
                        borderRadius: '13px',
                        border: '1px solid #dbeafe',
                        background: '#ffffff',
                        cursor: 'pointer',
                        boxShadow:
                          '0 3px 10px rgba(37,99,235,0.05)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '18px',
                          marginBottom: '5px',
                        }}
                      >
                        {topic.icon}
                      </div>

                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#1d4ed8',
                        }}
                      >
                        {topic.title}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Tools */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#475569',
                    }}
                  >
                    🛠️ ZorPDF Tools
                  </div>

                  <div
                    style={{
                      fontSize: '10px',
                      color: '#64748b',
                    }}
                  >
                    Open directly
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  {tools.map((tool) => (
                    <button
                      key={tool.path}
                      onClick={() => openTool(tool.path)}
                      style={{
                        textAlign: 'left',
                        padding: '10px',
                        borderRadius: '13px',
                        border: '1px solid #dbeafe',
                        background: '#ffffff',
                        cursor: 'pointer',
                        boxShadow:
                          '0 3px 10px rgba(37,99,235,0.05)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>
                          {tool.icon}
                        </span>

                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: '#1d4ed8',
                          }}
                        >
                          {tool.name}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: '10px',
                          lineHeight: 1.4,
                          color: '#64748b',
                        }}
                      >
                        {tool.description}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Popular Questions */}
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#475569',
                    marginBottom: '8px',
                  }}
                >
                  🔥 Popular Questions
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '7px',
                    marginBottom: '6px',
                  }}
                >
                  {quickQuestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => sendMessage(question)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        textAlign: 'left',
                        borderRadius: '11px',
                        border: '1px solid #dbeafe',
                        background: '#ffffff',
                        color: '#334155',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </>
            )}

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
                  fontSize: '12px',
                }}
              >
                <span style={{ color: '#2563eb' }}>●</span>
                <span>Help Bot typing...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div
            style={{
              padding: '12px',
              background: '#ffffff',
              borderTop: '1px solid #e5efff',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '8px',
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
                placeholder="Batayiye, main aapki kaise madad kar sakta hoon?"
                disabled={loading}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #cbdffb',
                  outline: 'none',
                  fontSize: '13px',
                  background: '#f8fbff',
                  color: '#1e293b',
                }}
              />

              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                style={{
                  padding: '10px 15px',
                  borderRadius: '12px',
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
                  fontWeight: 800,
                }}
              >
                Send
              </button>
            </div>

            <div
              style={{
                textAlign: 'center',
                fontSize: '10px',
                color: '#94a3b8',
                marginTop: '7px',
              }}
            >
              ZorPDF Help Bot • Smart customer support
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
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
            '0 12px 30px rgba(37,99,235,0.30)',
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
            width="34"
            height="34"
            viewBox="0 0 48 48"
            fill="none"
          >
            <rect
              x="9"
              y="13"
              width="30"
              height="24"
              rx="8"
              stroke="white"
              strokeWidth="3"
            />

            <path
              d="M24 13V7"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <circle
              cx="24"
              cy="5"
              r="2.5"
              fill="white"
            />

            <circle
              cx="18"
              cy="24"
              r="2.5"
              fill="white"
            />

            <circle
              cx="30"
              cy="24"
              r="2.5"
              fill="white"
            />

            <path
              d="M18 30C21 32 27 32 30 30"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            <path
              d="M9 23H6"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <path
              d="M39 23H42"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </>
  );
}
