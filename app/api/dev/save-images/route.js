import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function POST(request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'disabled' }, { status: 403 });
  }

  const { files } = await request.json();
  const dir = join(process.cwd(), 'public', 'products');
  mkdirSync(dir, { recursive: true });

  const saved = [];
  for (const file of files || []) {
    if (!/^[a-z0-9-]+\.jpg$/.test(file.name || '')) continue;
    const buffer = Buffer.from(file.data || '', 'base64');
    if (buffer.length < 4000) continue;
    writeFileSync(join(dir, file.name), buffer);
    saved.push({ name: file.name, bytes: buffer.length });
  }

  return NextResponse.json({ saved });
}
