import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 20MB' }, { status: 400 });
    }

    const apiKey = process.env.REMOVE_BG_API_KEY || process.env.BRIA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Background removal service is not configured. Please add an API key.' },
        { status: 503 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const provider = process.env.BG_REMOVAL_PROVIDER || 'removebg';

    if (provider === 'bria') {
      const response = await fetch('https://api.bria.ai/v1/remove-background', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: `data:${file.type};base64,${buffer.toString('base64')}`,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Bria API error:', errText);
        return NextResponse.json({ error: 'Background removal failed' }, { status: 502 });
      }

      const result = await response.json();
      const resultUrl = result.result_url || result.image_url;

      if (!resultUrl) {
        return NextResponse.json({ error: 'No result returned from service' }, { status: 502 });
      }

      const imgResponse = await fetch(resultUrl);
      if (!imgResponse.ok) {
        return NextResponse.json({ error: 'Failed to download result' }, { status: 502 });
      }

      const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
      return new NextResponse(imgBuffer, {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      });
    }

    // Default: remove.bg
    const formDataToSend = new FormData();
    formDataToSend.append('image_file', new Blob([buffer]), file.name);
    formDataToSend.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formDataToSend,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('remove.bg API error:', errText);
      return NextResponse.json({ error: 'Background removal failed' }, { status: 502 });
    }

    const resultBuffer = Buffer.from(await response.arrayBuffer());
    return new NextResponse(resultBuffer, {
      status: 200,
      headers: { 'Content-Type': 'image/png' },
    });
  } catch (error) {
    console.error('Remove BG error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during background removal' },
      { status: 500 }
    );
  }
}
