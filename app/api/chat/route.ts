import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'OPENAI_API_KEY is not configured.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const pdfText =
      typeof body.pdfText === 'string'
        ? body.pdfText
        : '';

    const messages: ChatMessage[] = Array.isArray(body.messages)
      ? body.messages
          .filter(
            (message: ChatMessage) =>
              message &&
              (message.role === 'user' ||
                message.role === 'assistant') &&
              typeof message.content === 'string'
          )
          .slice(-12)
      : [];

    if (!pdfText.trim()) {
      return NextResponse.json(
        {
          error: 'Please upload a PDF first.',
        },
        { status: 400 }
      );
    }

    /*
     * Keep the request within a reasonable size.
     * Page markers are preserved so the AI can mention pages.
     */
    const safePdfText = pdfText.slice(0, 120000);

    const systemPrompt = `
You are ZorPDF AI, an intelligent assistant for answering questions about an uploaded PDF.

IMPORTANT RULES:

1. Answer primarily from the supplied PDF.
2. Never invent information that is not supported by the PDF.
3. If the requested information is not available in the PDF, say clearly:
   "This information is not available in the uploaded PDF."
4. Reply in the same language as the user's question.
5. Be accurate, clear and helpful.
6. For summaries, use headings and bullet points.
7. The PDF contains page markers such as [Page 1], [Page 2], etc.
8. Mention the relevant page number when the answer can be located on a specific page.

UPLOADED PDF CONTENT:

${safePdfText}
`;

    const openAIResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            ...messages,
          ],
        }),
      }
    );

    const data = await openAIResponse.json();

    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', data);

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            'OpenAI request failed.',
        },
        { status: openAIResponse.status }
      );
    }

    const answer =
      data?.choices?.[0]?.message?.content;

    if (!answer) {
      return NextResponse.json(
        {
          error: 'AI returned an empty response.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      answer,
    });
  } catch (error) {
    console.error('ZorPDF AI Chat error:', error);

    return NextResponse.json(
      {
        error: 'Unable to process your AI request.',
      },
      { status: 500 }
    );
  }
}
