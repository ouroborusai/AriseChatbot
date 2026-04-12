import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Usa el script sync_templates.ts en lugar de esta ruta' }, { status: 400 });
}