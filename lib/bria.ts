// lib/bria.ts
// Server-side only helper for BRIA's Image Editing API (RMBG 2.0).
// NEVER import this file from a client component — it reads a secret API key.

const BRIA_IMAGE_EDIT_BASE_URL = 'https://engine.prod.bria-api.com/v2/image/edit';

interface BriaImageResult {
  result: {
    image_url: string;
    seed?: number;
    refined_prompt?: string;
  };
  request_id: string;
}

function getApiKey(): string {
  const key = process.env.BRIA_API_KEY;
  if (!key) {
    throw new Error(
      'BRIA_API_KEY environment variable set nahi hai. .env.local (ya hosting provider ke env settings) mein add karo.'
    );
  }
  return key;
}

async function callBria(path: string, body: Record<string, unknown>): Promise<BriaImageResult> {
  const res = await fetch(`${BRIA_IMAGE_EDIT_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      api_token: getApiKey(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let details = '';
    try {
      const errJson = await res.json();
      details = errJson?.error?.message || errJson?.error?.details || JSON.stringify(errJson);
    } catch {
      details = await res.text();
    }
    throw new Error(`BRIA API error (${res.status}): ${details}`);
  }

  return (await res.json()) as BriaImageResult;
}

export async function removeBackground(
  imageBase64: string,
  opts?: { preserveAlpha?: boolean }
): Promise<string> {
  const data = await callBria('/remove_background', {
    image: imageBase64,
    sync: true,
    preserve_alpha: opts?.preserveAlpha ?? false,
  });

  return data.result.image_url;
}

export async function replaceBackground(
  imageBase64: string,
  options: { color?: string; prompt?: string }
): Promise<string> {
  if (!options.color && !options.prompt) {
    throw new Error('replaceBackground: color ya prompt mein se ek dena zaroori hai');
  }

  const data = await callBria('/replace_background', {
    image: imageBase64,
    sync: true,
    mode: 'fast',
    prompt: options.color ?? options.prompt,
  });

  return data.result.image_url;
}
