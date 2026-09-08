import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'GEMINI_API_KEY Vercel me nahi mil raha.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const message =
      typeof body.message === 'string'
        ? body.message.trim()
        : '';

    if (!message) {
      return NextResponse.json(
        {
          error: 'Please enter a question.',
        },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are ZorPDF Help Bot.

You are a customer support assistant for ZorPDF.

ZorPDF tools:

JPG to PDF: /tool/jpg-to-pdf
PDF to JPG: /tool/pdf-to-jpg
PNG to JPG: /tool/png-to-jpg
Word to PDF: /tool/word-to-pdf
PDF to Word: /tool/pdf-to-word
PDF Compressor: /tool/pdf-compressor
Zor Remover: /zor-remover

Never ask the user to upload a PDF just to chat.

Reply in the same language as the user.

Be friendly, simple and helpful.

Help with:
- using ZorPDF tools
- upload problems
- conversion problems
- compression problems
- download problems
- Zor Remover

Never invent file-size limits.
Never reveal secrets or API keys.
`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: systemPrompt,
              },
            ],
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: message,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('GEMINI ERROR:', data);

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            JSON.stringify(data?.error) ||
            `Gemini API Error ${response.status}`,
        },
        { status: response.status }
      );
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return NextResponse.json(
        {
          error:
            'Gemini ne response nahi diya. Raw response: ' +
            JSON.stringify(data),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      reply,
    });
  } catch (error) {
    console.error('ZorPDF Help Bot ERROR:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unknown server error.',
      },
      { status: 500 }
    );
  }
}
