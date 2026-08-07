import { NextRequest, NextResponse } from 'next/server';
import { removeBackground } from '@/lib/bria';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Koi image file upload nahi hui' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Sirf JPEG, PNG ya WEBP images allowed hain' },
        { status: 415 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Image bahut badi hai. 12MB se choti file upload karo.' },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const imageUrl = await removeBackground(base64);

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error('remove-bg error:', err);
    const message = err instanceof Error ? err.message : 'Background remove nahi ho paya';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
