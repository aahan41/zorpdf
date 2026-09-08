'use client';

import { useEffect, useRef, useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const STORAGE_KEY = 'zorpdf-helpbot-messages';

const defaultMessage: Message = {
  role: 'assistant',
  content:
    'Assalamo Alaikum 🤝\n\nMain ZorPDF Help Bot hoon.\n\nBatayiye, main aapki kaise madad kar sakta hoon? Aap tool use karne, file upload, conversion, compression ya download se related koi bhi sawal pooch sakte hain.',
};

const tools = [
  {
    name: 'JPG to PDF',
    description: 'JPG images ko PDF mein badlein',
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
    description: 'Word document ko PDF banayein',
    path: '/tool/word-to-pdf',
    icon: '📝',
  },
  {
    name: 'PDF to Word',
    description: 'PDF ko editable Word mein badlein',
    path: '/tool/pdf-to-word',
    icon: '📘',
  },
  {
    name: 'PDF Compressor',
    description: 'PDF file ka size kam karein',
    path: '/tool/pdf-compressor',
    icon: '🗜️',
  },
  {
    name: 'Zor Remover',
    description: 'Image ka background remove karein',
    path: '/zor-remover',
    icon: '✨',
  },
];

const helpTopics = [
  {
    title: 'Tool kaise use karein?',
    icon: '💡',
    question: 'ZorPDF tools kaise use karein?',
  },
  {
    title: 'File upload nahi ho raha',
    icon: '📤',
    question: 'Mera file upload nahi ho raha',
  },
  {
    title: 'Conversion problem',
    icon: '⚙️',
    question: 'Mera conversion nahi ho raha',
  },
  {
    title: 'Download problem',
    icon: '⬇️',
    question: 'Download button kaam nahi kar raha',
  },
];

const popularQuestions = [
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
    defaultMessage,
  ]);
  const [loaded, setLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /*
   * Load saved chat
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (
          Array.isArray(parsed) &&
          parsed.length > 0
        ) {
          setMessages(parsed);
        }
      }
    } catch (error) {
      console.error(
        'Help Bot load error:',
        error
      );
    } finally {
      setLoaded(true);
    }
  }, []);

  /*
   * Save chat
   */
  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages)
      );
    } catch (error) {
      console.error(
        'Help Bot save error:',
        error
      );
    }
  }, [messages, loaded]);

  /*
   * Scroll to latest message
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, loading]);

  /*
   * Local customer support answers
   */
  const getLocalHelpAnswer = (
    question: string
  ): string | null => {
    const q = question.toLowerCase().trim();

    if (
      q.includes('compress') ||
      q.includes('compression') ||
      q.includes('size kam')
    ) {
      return `PDF compress karne ke liye:

1. PDF Compressor tool open karein.
2. Apni PDF upload karein.
3. Processing complete hone ka wait karein.
4. Compressed PDF download karein.

PDF Compressor:
${window.location.origin}/tool/pdf-compressor`;
    }

    if (
      q.includes('pdf ko jpg') ||
      q.includes('pdf to jpg') ||
      q.includes('pdf se jpg')
    ) {
      return `PDF ko JPG mein convert karne ke liye:

1. PDF to JPG tool open karein.
2. Apni PDF upload karein.
3. Conversion complete hone dein.
4. JPG download karein.

PDF to JPG:
${window.location.origin}/tool/pdf-to-jpg`;
    }

    if (
      q.includes('jpg ko pdf') ||
      q.includes('jpg to pdf') ||
      q.includes('jpg se pdf')
    ) {
      return `JPG ko PDF mein banane ke liye:

1. JPG to PDF tool open karein.
2. Apni JPG image upload karein.
3. Conversion complete hone dein.
4. PDF download karein.

JPG to PDF:
${window.location.origin}/tool/jpg-to-pdf`;
    }

    if (
      q.includes('png to jpg') ||
      q.includes('png ko jpg') ||
      q.includes('png se jpg')
    ) {
      return `PNG ko JPG mein convert karne ke liye:

1. PNG to JPG tool open karein.
2. Apni PNG image upload karein.
3. Conversion complete hone dein.
4. JPG download karein.

PNG to JPG:
${window.location.origin}/tool/png-to-jpg`;
    }

    if (
      q.includes('word to pdf') ||
      q.includes('word ko pdf') ||
      q.includes('word se pdf')
    ) {
      return `Word file ko PDF mein convert karne ke liye:

1. Word to PDF tool open karein.
2. Apni Word file upload karein.
3. Conversion complete hone dein.
4. PDF download karein.

Word to PDF:
${window.location.origin}/tool/word-to-pdf`;
    }

    if (
      q.includes('pdf to word') ||
      q.includes('pdf ko word') ||
      q.includes('pdf se word')
    ) {
      return `PDF ko Word mein convert karne ke liye:

1. PDF to Word tool open karein.
2. Apni PDF upload karein.
3. Conversion complete hone dein.
4. Word file download karein.

PDF to Word:
${window.location.origin}/tool/pdf-to-word`;
    }

    if (
      q.includes('zor remover') ||
      q.includes('background remove') ||
      q.includes('background hata')
    ) {
      return `Zor Remover se image ka background remove kar sakte hain:

1. Zor Remover open karein.
2. Apni image upload karein.
3. Background removal complete hone dein.
4. Result download karein.

Zor Remover:
${window.location.origin}/zor-remover`;
    }

    if (
      q.includes('upload') ||
      q.includes('file upload') ||
      q.includes('file nahi') ||
      q.includes('upload nahi')
    ) {
      return `Agar file upload nahi ho rahi hai, to:

1. File format check karein.
2. Chhoti file ke saath try karein.
3. Internet connection check karein.
4. Page refresh karein.
5. Chrome ya Edge jaise doosre browser mein try karein.
6. Thodi der baad dobara try karein.`;
    }

    if (
      q.includes('download') ||
      q.includes('download button')
    ) {
      return `Download problem ke liye:

1. Processing complete hone ka wait karein.
2. Download button dobara click karein.
3. Page refresh karke try karein.
4. Browser ke download settings check karein.
5. Doosre browser mein try karein.`;
    }

    if (
      q.includes('conversion') ||
      q.includes('convert nahi') ||
      q.includes('conversion nahi')
    ) {
      return `Agar conversion nahi ho raha hai:

1. Input file check karein.
2. Supported file format use karein.
3. Page refresh karein.
4. Chhoti file ke saath try karein.
5. Doosre browser mein try karein.`;
    }

    if (
      q.includes('tools kaise use') ||
      q.includes('how to use') ||
      q.includes('zorpdf kaise use')
    ) {
      return `ZorPDF use karna bahut easy hai:

1. Apni zarurat ke according tool choose karein.
2. File upload karein.
3. Processing complete hone ka wait karein.
4. Result download karein.

Aap neeche "All ZorPDF Tools" section se bhi directly tool open kar sakte hain.`;
    }

    return null;
  };

  /*
   * Send message
   */
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

    /*
     * First use local answers.
     * These work even if Gemini is unavailable.
     */
    const localAnswer =
      getLocalHelpAnswer(question);

    if (localAnswer) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: localAnswer,
          },
        ]);
      }, 250);

      return;
    }

    /*
     * Use Gemini for unknown questions.
     */
    setLoading(true);

    try {
      const response = await fetch(
        '/api/ai-help',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: question,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Something went wrong'
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            data?.reply ||
            'Sorry, abhi main answer nahi de pa raha hoon.',
        },
      ]);
    } catch (error) {
      console.error(
        'Help Bot error:',
        error
      );

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Abhi AI service temporarily available nahi hai. Neeche diye gaye ZorPDF tools se aap directly apna kaam kar sakte hain.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openTool = (path: string) => {
    window.location.href = path;
  };

  const clearChat = () => {
    setMessages([defaultMessage]);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error(
        'Help Bot clear error:',
        error
      );
    }
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
            width: '410px',
            maxWidth:
              'calc(100vw - 20px)',
            height: '680px',
            maxHeight:
              'calc(100vh - 105px)',
            background: '#ffffff',
            borderRadius: '22px',
            border:
              '1px solid #dbeafe',
            boxShadow:
              '0 24px 70px rgba(15,23,42,0.20)',
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
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'space-between',
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
                    background:
                      'rgba(255,255,255,0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                      'center',
                  }}
                >
                  <svg
                    width="27"
                    height="27"
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
                      fontSize: '17px',
                      fontWeight: 800,
                    }}
                  >
                    ZorPDF Help Bot
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      opacity: 0.9,
                      marginTop: '3px',
                    }}
                  >
                    Online • Customer Support
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                }}
              >
                <button
                  onClick={clearChat}
                  title="Clear chat"
                  aria-label="Clear chat"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    border: 'none',
                    background:
                      'rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '15px',
                  }}
                >
                  ↻
                </button>

                <button
                  onClick={() =>
                    setOpen(false)
                  }
                  aria-label="Close Help Bot"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    border: 'none',
                    background:
                      'rgba(255,255,255,0.14)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '25px',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Main Content */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              background: '#f8fbff',
              padding: '14px',
            }}
          >
            {/* Messages */}
            {messages.map(
              (message, index) => (
                <div
                  key={`${message.role}-${index}`}
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
                      maxWidth: '88%',
                      padding: '11px 13px',
                      borderRadius:
                        message.role ===
                        'user'
                          ? '16px 16px 5px 16px'
                          : '16px 16px 16px 5px',
                      background:
                        message.role ===
                        'user'
                          ? '#2563eb'
                          : '#ffffff',
                      color:
                        message.role ===
                        'user'
                          ? '#ffffff'
                          : '#1e293b',
                      border:
                        message.role ===
                        'assistant'
                          ? '1px solid #dbeafe'
                          : 'none',
                      boxShadow:
                        message.role ===
                        'assistant'
                          ? '0 3px 10px rgba(37,99,235,0.05)'
                          : '0 6px 18px rgba(37,99,235,0.13)',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {message.content}
                  </div>
                </div>
              )
            )}

            {loading && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: '#ffffff',
                  border:
                    '1px solid #dbeafe',
                  borderRadius: '14px',
                  padding: '10px 12px',
                  color: '#64748b',
                  fontSize: '12px',
                }}
              >
                <span
                  style={{
                    color: '#2563eb',
                  }}
                >
                  ●
                </span>

                <span>
                  Help Bot is preparing your
                  answer...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />

            {/* Quick Help */}
            {messages.length === 1 && (
              <>
                <div
                  style={{
                    marginTop: '7px',
                    marginBottom: '8px',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#475569',
                  }}
                >
                  💡 Quick Help
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: '8px',
                    marginBottom: '17px',
                  }}
                >
                  {helpTopics.map(
                    (topic) => (
                      <button
                        key={topic.title}
                        onClick={() =>
                          sendMessage(
                            topic.question
                          )
                        }
                        style={{
                          textAlign: 'left',
                          padding: '11px',
                          borderRadius: '13px',
                          border:
                            '1px solid #dbeafe',
                          background:
                            '#ffffff',
                          cursor: 'pointer',
                          boxShadow:
                            '0 3px 10px rgba(37,99,235,0.05)',
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              '17px',
                            marginBottom:
                              '5px',
                          }}
                        >
                          {topic.icon}
                        </div>

                        <div
                          style={{
                            fontSize:
                              '11px',
                            fontWeight: 800,
                            color:
                              '#1d4ed8',
                            lineHeight: 1.35,
                          }}
                        >
                          {topic.title}
                        </div>
                      </button>
                    )
                  )}
                </div>
              </>
            )}

            {/* All Tools */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'space-between',
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
                🛠️ All ZorPDF Tools
              </div>

              <div
                style={{
                  fontSize: '10px',
                  color: '#94a3b8',
                }}
              >
                Tap to open
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '7px',
                marginBottom: '17px',
              }}
            >
              {tools.map((tool) => (
                <button
                  key={tool.path}
                  onClick={() =>
                    openTool(tool.path)
                  }
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '11px',
                    padding: '11px',
                    borderRadius: '12px',
                    border:
                      '1px solid #dbeafe',
                    background: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent:
                        'center',
                      fontSize: '17px',
                      flexShrink: 0,
                    }}
                  >
                    {tool.icon}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#1d4ed8',
                      }}
                    >
                      {tool.name}
                    </div>

                    <div
                      style={{
                        marginTop: '2px',
                        fontSize: '10px',
                        color: '#64748b',
                      }}
                    >
                      {tool.description}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '18px',
                      color: '#93c5fd',
                    }}
                  >
                    →
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
                paddingBottom: '8px',
              }}
            >
              {popularQuestions.map(
                (question) => (
                  <button
                    key={question}
                    onClick={() =>
                      sendMessage(question)
                    }
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      textAlign: 'left',
                      borderRadius: '11px',
                      border:
                        '1px solid #dbeafe',
                      background: '#ffffff',
                      color: '#334155',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {question}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Input */}
          <div
            style={{
              padding: '12px',
              background: '#ffffff',
              borderTop:
                '1px solid #e5efff',
              flexShrink: 0,
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
                onChange={(e) =>
                  setInput(e.target.value)
                }
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
                  padding: '11px 12px',
                  borderRadius: '11px',
                  border:
                    '1px solid #cbdffb',
                  outline: 'none',
                  fontSize: '12px',
                  background:
                    '#f8fbff',
                  color: '#1e293b',
                }}
              />

              <button
                onClick={() =>
                  sendMessage()
                }
                disabled={
                  loading ||
                  !input.trim()
                }
                style={{
                  padding:
                    '10px 15px',
                  borderRadius: '11px',
                  border: 'none',
                  background:
                    loading ||
                    !input.trim()
                      ? '#bfdbfe'
                      : '#2563eb',
                  color: '#ffffff',
                  cursor:
                    loading ||
                    !input.trim()
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
                fontSize: '9px',
                color: '#94a3b8',
                marginTop: '7px',
              }}
            >
              ZorPDF Help Bot • Smart Customer
              Support
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() =>
          setOpen((prev) => !prev)
        }
        aria-label="Open ZorPDF Help Bot"
        title="ZorPDF Help Bot"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          border:
            '3px solid #ffffff',
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
