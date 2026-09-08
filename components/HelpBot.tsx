'use client';

import { useEffect, useRef, useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  action?: {
    label: string;
    path: string;
  };
};

const defaultMessage: Message = {
  role: 'assistant',
  content:
    'Assalamo Alaikum 🤝\n\nMain ZorPDF Help Bot hoon.\n\nBatayiye, main aapki kaise madad kar sakta hoon? Aap kisi bhi ZorPDF tool ke baare mein pooch sakte hain.',
};

const tools = [
  {
    name: 'JPG to PDF',
    icon: '🖼️',
    path: '/tool/jpg-to-pdf',
    question: 'JPG ko PDF kaise banaye?',
    answer:
      'JPG image ko PDF mein convert karna bahut easy hai.\n\n1. JPG to PDF tool open karein.\n2. Apni JPG image upload karein.\n3. Processing complete hone ka wait karein.\n4. PDF file download karein.\n\nAap ek ya multiple JPG images ko PDF mein convert karne ke liye is tool ka use kar sakte hain.',
  },
  {
    name: 'PDF to JPG',
    icon: '📄',
    path: '/tool/pdf-to-jpg',
    question: 'PDF ko JPG mein kaise badlein?',
    answer:
      'PDF ko JPG image mein convert karne ke liye:\n\n1. PDF to JPG tool open karein.\n2. Apni PDF upload karein.\n3. Conversion complete hone ka wait karein.\n4. JPG result download karein.\n\nPDF ke pages JPG images mein convert ho jayenge.',
  },
  {
    name: 'PNG to JPG',
    icon: '🔄',
    path: '/tool/png-to-jpg',
    question: 'PNG ko JPG mein kaise badlein?',
    answer:
      'PNG image ko JPG mein convert karne ke liye:\n\n1. PNG to JPG tool open karein.\n2. Apni PNG image upload karein.\n3. Conversion complete hone dein.\n4. JPG image download karein.',
  },
  {
    name: 'Word to PDF',
    icon: '📝',
    path: '/tool/word-to-pdf',
    question: 'Word ko PDF kaise banaye?',
    answer:
      'Word document ko PDF mein convert karne ke liye:\n\n1. Word to PDF tool open karein.\n2. Apni Word file upload karein.\n3. Processing complete hone ka wait karein.\n4. PDF download karein.',
  },
  {
    name: 'PDF to Word',
    icon: '📘',
    path: '/tool/pdf-to-word',
    question: 'PDF ko Word mein kaise badlein?',
    answer:
      'PDF ko Word document mein convert karne ke liye:\n\n1. PDF to Word tool open karein.\n2. Apni PDF upload karein.\n3. Conversion complete hone ka wait karein.\n4. Word file download karein.',
  },
  {
    name: 'PDF Compressor',
    icon: '🗜️',
    path: '/tool/pdf-compressor',
    question: 'PDF kaise compress karein?',
    answer:
      'PDF ka size kam karne ke liye:\n\n1. PDF Compressor tool open karein.\n2. Apni PDF upload karein.\n3. Compression complete hone ka wait karein.\n4. Compressed PDF download karein.\n\nAgar PDF bahut badi hai, to processing mein thoda extra time lag sakta hai.',
  },
  {
    name: 'Zor Remover',
    icon: '✨',
    path: '/zor-remover',
    question: 'Zor Remover kaise use karein?',
    answer:
      'Zor Remover image ka background automatically remove karne ke liye hai.\n\n1. Zor Remover open karein.\n2. Apni image upload karein.\n3. Background removal complete hone ka wait karein.\n4. Final image download karein.',
  },
];

const helpTopics = [
  {
    title: 'Tool kaise use karein?',
    icon: '💡',
    question: 'ZorPDF tools kaise use karein?',
    answer:
      'ZorPDF use karna bahut easy hai:\n\n1. Apni zarurat ka tool choose karein.\n2. File upload karein.\n3. Processing ya conversion complete hone ka wait karein.\n4. Result download karein.\n\nNeeche diye gaye ZorPDF Tools par click karke aap kisi bhi tool ki details dekh sakte hain.',
  },
  {
    title: 'File upload problem',
    icon: '📤',
    question: 'Mera file upload nahi ho raha',
    answer:
      'Agar file upload nahi ho rahi hai:\n\n1. File format check karein.\n2. Chhoti file ke saath try karein.\n3. Internet connection check karein.\n4. Page refresh karein.\n5. Chrome ya Edge jaise doosre browser mein try karein.\n6. Kuch der baad dobara try karein.',
  },
  {
    title: 'Conversion problem',
    icon: '⚙️',
    question: 'Mera conversion nahi ho raha',
    answer:
      'Agar conversion nahi ho raha hai:\n\n1. Input file check karein.\n2. Supported format use karein.\n3. Page refresh karein.\n4. Chhoti file ke saath try karein.\n5. Doosre browser mein try karein.\n\nAgar phir bhi problem rahe, Help Bot mein apni exact problem likhein.',
  },
  {
    title: 'Download problem',
    icon: '⬇️',
    question: 'Download button kaam nahi kar raha',
    answer:
      'Agar download button kaam nahi kar raha hai:\n\n1. Processing complete hone ka wait karein.\n2. Download button dobara click karein.\n3. Page refresh karke try karein.\n4. Browser download settings check karein.\n5. Doosre browser mein try karein.',
  },
];

const popularQuestions = [
  {
    question: 'PDF kaise compress karein?',
    answer:
      'PDF compress karne ke liye PDF Compressor open karein, PDF upload karein, processing complete hone dein aur compressed PDF download karein.',
    path: '/tool/pdf-compressor',
    label: 'Open PDF Compressor',
  },
  {
    question: 'PDF ko JPG mein kaise badlein?',
    answer:
      'PDF to JPG tool open karein, PDF upload karein, conversion complete hone dein aur JPG result download karein.',
    path: '/tool/pdf-to-jpg',
    label: 'Open PDF to JPG',
  },
  {
    question: 'JPG ko PDF kaise banaye?',
    answer:
      'JPG to PDF tool open karein, JPG image upload karein, conversion complete hone dein aur PDF download karein.',
    path: '/tool/jpg-to-pdf',
    label: 'Open JPG to PDF',
  },
  {
    question: 'PDF ko Word mein kaise badlein?',
    answer:
      'PDF to Word tool open karein, PDF upload karein, conversion complete hone dein aur Word file download karein.',
    path: '/tool/pdf-to-word',
    label: 'Open PDF to Word',
  },
];

export default function HelpBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    defaultMessage,
  ]);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, loading]);

  const addConversation = (
    question: string,
    answer: string,
    action?: {
      label: string;
      path: string;
    }
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: question,
      },
      {
        role: 'assistant',
        content: answer,
        action,
      },
    ]);
  };

  const handleToolClick = (
    tool: (typeof tools)[number]
  ) => {
    addConversation(
      tool.question,
      tool.answer,
      {
        label: `Open ${tool.name}`,
        path: tool.path,
      }
    );
  };

  const handleHelpClick = (
    topic: (typeof helpTopics)[number]
  ) => {
    addConversation(
      topic.question,
      topic.answer
    );
  };

  const handlePopularClick = (
    item: (typeof popularQuestions)[number]
  ) => {
    addConversation(
      item.question,
      item.answer,
      {
        label: item.label,
        path: item.path,
      }
    );
  };

  const getLocalAnswer = (
    question: string
  ): {
    answer: string;
    action?: {
      label: string;
      path: string;
    };
  } | null => {
    const q = question.toLowerCase();

    const matchedTool = tools.find((tool) =>
      q.includes(
        tool.question
          .toLowerCase()
          .replace('?', '')
      )
    );

    if (matchedTool) {
      return {
        answer: matchedTool.answer,
        action: {
          label: `Open ${matchedTool.name}`,
          path: matchedTool.path,
        },
      };
    }

    if (
      q.includes('compress') ||
      q.includes('compression') ||
      q.includes('size kam')
    ) {
      return {
        answer:
          'PDF ka size kam karne ke liye PDF Compressor open karein, PDF upload karein, compression complete hone dein aur compressed PDF download karein.',
        action: {
          label: 'Open PDF Compressor',
          path: '/tool/pdf-compressor',
        },
      };
    }

    if (
      q.includes('pdf ko jpg') ||
      q.includes('pdf to jpg')
    ) {
      return {
        answer:
          'PDF ko JPG mein convert karne ke liye PDF to JPG tool open karein, PDF upload karein, conversion complete hone dein aur JPG download karein.',
        action: {
          label: 'Open PDF to JPG',
          path: '/tool/pdf-to-jpg',
        },
      };
    }

    if (
      q.includes('jpg ko pdf') ||
      q.includes('jpg to pdf')
    ) {
      return {
        answer:
          'JPG ko PDF mein convert karne ke liye JPG to PDF tool open karein, JPG upload karein, conversion complete hone dein aur PDF download karein.',
        action: {
          label: 'Open JPG to PDF',
          path: '/tool/jpg-to-pdf',
        },
      };
    }

    if (
      q.includes('png to jpg') ||
      q.includes('png ko jpg')
    ) {
      return {
        answer:
          'PNG ko JPG mein convert karne ke liye PNG to JPG tool open karein, PNG upload karein, conversion complete hone dein aur JPG download karein.',
        action: {
          label: 'Open PNG to JPG',
          path: '/tool/png-to-jpg',
        },
      };
    }

    if (
      q.includes('word to pdf') ||
      q.includes('word ko pdf')
    ) {
      return {
        answer:
          'Word document ko PDF mein convert karne ke liye Word to PDF tool open karein, Word file upload karein, conversion complete hone dein aur PDF download karein.',
        action: {
          label: 'Open Word to PDF',
          path: '/tool/word-to-pdf',
        },
      };
    }

    if (
      q.includes('pdf to word') ||
      q.includes('pdf ko word')
    ) {
      return {
        answer:
          'PDF ko Word mein convert karne ke liye PDF to Word tool open karein, PDF upload karein, conversion complete hone dein aur Word file download karein.',
        action: {
          label: 'Open PDF to Word',
          path: '/tool/pdf-to-word',
        },
      };
    }

    if (
      q.includes('zor remover') ||
      q.includes('background remove') ||
      q.includes('background hata')
    ) {
      return {
        answer:
          'Zor Remover image ka background automatically remove karta hai. Image upload karein, processing complete hone dein aur result download karein.',
        action: {
          label: 'Open Zor Remover',
          path: '/zor-remover',
        },
      };
    }

    if (
      q.includes('upload') ||
      q.includes('upload nahi')
    ) {
      return {
        answer:
          'Agar file upload nahi ho rahi hai:\n\n1. File format check karein.\n2. Chhoti file try karein.\n3. Internet connection check karein.\n4. Page refresh karein.\n5. Doosre browser mein try karein.',
      };
    }

    if (
      q.includes('download') ||
      q.includes('download button')
    ) {
      return {
        answer:
          'Download problem ke liye:\n\n1. Processing complete hone ka wait karein.\n2. Download button dobara click karein.\n3. Page refresh karein.\n4. Browser download settings check karein.\n5. Doosre browser mein try karein.',
      };
    }

    return null;
  };

  const sendMessage = async (
    text?: string
  ) => {
    const question = (text ?? input).trim();

    if (!question || loading) return;

    setInput('');

    const localAnswer =
      getLocalAnswer(question);

    if (localAnswer) {
      addConversation(
        question,
        localAnswer.answer,
        localAnswer.action
      );
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: question,
      },
    ]);

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
            'Sorry, abhi answer nahi mil pa raha hai.',
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
            'Abhi AI service temporarily available nahi hai. Neeche diye gaye ZorPDF Tools se aap directly apna kaam kar sakte hain.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([defaultMessage]);
  };

  const openTool = (path: string) => {
    window.location.href = path;
  };

  return (
    <>
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
          {/* HEADER */}
          <div
            style={{
              padding: '16px 18px',
              background:
                'linear-gradient(135deg,#2563eb,#1d4ed8)',
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
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '13px',
                    background:
                      'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                      'center',
                  }}
                >
                  🤖
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
                  style={{
                    width: '34px',
                    height: '34px',
                    border: 'none',
                    borderRadius: '10px',
                    background:
                      'rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                >
                  ↻
                </button>

                <button
                  onClick={() =>
                    setOpen(false)
                  }
                  aria-label="Close"
                  style={{
                    width: '34px',
                    height: '34px',
                    border: 'none',
                    borderRadius: '10px',
                    background:
                      'rgba(255,255,255,0.14)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '24px',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              background: '#f8fbff',
              padding: '14px',
            }}
          >
            {/* CHAT */}
            {messages.map(
              (message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  style={{
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        message.role === 'user'
                          ? 'flex-end'
                          : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '88%',
                        padding:
                          '11px 13px',
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
                          message.role ===
                          'assistant'
                            ? '1px solid #dbeafe'
                            : 'none',
                        boxShadow:
                          message.role ===
                          'assistant'
                            ? '0 3px 10px rgba(37,99,235,.05)'
                            : '0 6px 18px rgba(37,99,235,.13)',
                        fontSize: '13px',
                        lineHeight: 1.6,
                        whiteSpace:
                          'pre-wrap',
                      }}
                    >
                      {message.content}
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  {message.action && (
                    <button
                      onClick={() =>
                        openTool(
                          message.action!
                            .path
                        )
                      }
                      style={{
                        marginTop: '7px',
                        marginLeft:
                          message.role ===
                          'assistant'
                            ? '2px'
                            : 'auto',
                        display: 'block',
                        padding:
                          '8px 12px',
                        borderRadius: '10px',
                        border:
                          '1px solid #bfdbfe',
                        background:
                          '#eff6ff',
                        color: '#1d4ed8',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {message.action.label}
                      {'  →'}
                    </button>
                  )}
                </div>
              )
            )}

            {loading && (
              <div
                style={{
                  display: 'inline-flex',
                  padding:
                    '9px 12px',
                  borderRadius: '13px',
                  background:
                    '#ffffff',
                  border:
                    '1px solid #dbeafe',
                  color: '#64748b',
                  fontSize: '12px',
                }}
              >
                Help Bot is typing...
              </div>
            )}

            <div ref={messagesEndRef} />

            {/* QUICK HELP */}
            {messages.length === 1 && (
              <>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#475569',
                    margin:
                      '6px 0 8px',
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
                    marginBottom:
                      '17px',
                  }}
                >
                  {helpTopics.map(
                    (topic) => (
                      <button
                        key={topic.title}
                        onClick={() =>
                          handleHelpClick(
                            topic
                          )
                        }
                        style={{
                          textAlign:
                            'left',
                          padding:
                            '11px',
                          borderRadius:
                            '13px',
                          border:
                            '1px solid #dbeafe',
                          background:
                            '#ffffff',
                          cursor:
                            'pointer',
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              '17px',
                            marginBottom:
                              '4px',
                          }}
                        >
                          {topic.icon}
                        </div>

                        <div
                          style={{
                            fontSize:
                              '11px',
                            fontWeight:
                              800,
                            color:
                              '#1d4ed8',
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

            {/* ALL TOOLS */}
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                marginBottom:
                  '8px',
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
                  color: '#94a3b8',
                }}
              >
                Click for help
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection:
                  'column',
                gap: '7px',
                marginBottom:
                  '18px',
              }}
            >
              {tools.map((tool) => (
                <button
                  key={tool.path}
                  onClick={() =>
                    handleToolClick(
                      tool
                    )
                  }
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: '10px',
                    padding: '10px',
                    borderRadius:
                      '12px',
                    border:
                      '1px solid #dbeafe',
                    background:
                      '#ffffff',
                    cursor:
                      'pointer',
                    textAlign:
                      'left',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius:
                        '10px',
                      background:
                        '#eff6ff',
                      display: 'flex',
                      alignItems:
                        'center',
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
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          '12px',
                        fontWeight:
                          800,
                        color:
                          '#1d4ed8',
                      }}
                    >
                      {tool.name}
                    </div>

                    <div
                      style={{
                        fontSize:
                          '10px',
                        color:
                          '#64748b',
                        marginTop:
                          '2px',
                      }}
                    >
                      Click to learn
                    </div>
                  </div>

                  <div
                    style={{
                      color:
                        '#93c5fd',
                      fontSize:
                        '17px',
                    }}
                  >
                    →
                  </div>
                </button>
              ))}
            </div>

            {/* POPULAR */}
            <div
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#475569',
                marginBottom:
                  '8px',
              }}
            >
              🔥 Popular Questions
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection:
                  'column',
                gap: '7px',
                paddingBottom:
                  '8px',
              }}
            >
              {popularQuestions.map(
                (item) => (
                  <button
                    key={item.question}
                    onClick={() =>
                      handlePopularClick(
                        item
                      )
                    }
                    style={{
                      width: '100%',
                      padding:
                        '10px 12px',
                      textAlign:
                        'left',
                      borderRadius:
                        '11px',
                      border:
                        '1px solid #dbeafe',
                      background:
                        '#ffffff',
                      color:
                        '#334155',
                      cursor:
                        'pointer',
                      fontSize:
                        '12px',
                    }}
                  >
                    {item.question}
                  </button>
                )
              )}
            </div>
          </div>

          {/* INPUT */}
          <div
            style={{
              padding: '11px',
              background:
                '#ffffff',
              borderTop:
                '1px solid #e5efff',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '7px',
              }}
            >
              <input
                value={input}
                onChange={(e) =>
                  setInput(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter'
                  ) {
                    sendMessage();
                  }
                }}
                placeholder="Batayiye, main aapki kaise madad kar sakta hoon?"
                disabled={loading}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding:
                    '11px 12px',
                  borderRadius:
                    '11px',
                  border:
                    '1px solid #cbdffb',
                  outline:
                    'none',
                  fontSize:
                    '12px',
                  background:
                    '#f8fbff',
                  color:
                    '#1e293b',
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
                  borderRadius:
                    '11px',
                  border:
                    'none',
                  background:
                    loading ||
                    !input.trim()
                      ? '#bfdbfe'
                      : '#2563eb',
                  color:
                    '#ffffff',
                  cursor:
                    loading ||
                    !input.trim()
                      ? 'not-allowed'
                      : 'pointer',
                  fontWeight:
                    800,
                }}
              >
                Send
              </button>
            </div>

            <div
              style={{
                textAlign:
                  'center',
                fontSize:
                  '9px',
                color:
                  '#94a3b8',
                marginTop:
                  '6px',
              }}
            >
              ZorPDF Help Bot • Smart Customer Support
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BUTTON */}
      <button
        onClick={() =>
          setOpen(
            (prev) => !prev
          )
        }
        aria-label="Open ZorPDF Help Bot"
        title="ZorPDF Help Bot"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          width: '64px',
          height: '64px',
          borderRadius:
            '50%',
          border:
            '3px solid #ffffff',
          background:
            'linear-gradient(135deg,#3b82f6,#1d4ed8)',
          color:
            '#ffffff',
          boxShadow:
            '0 12px 30px rgba(37,99,235,.30)',
          cursor:
            'pointer',
          zIndex: 10000,
          display: 'flex',
          alignItems:
            'center',
          justifyContent:
            'center',
          fontSize: '30px',
        }}
      >
        {open ? '×' : '🤖'}
      </button>
    </>
  );
}
