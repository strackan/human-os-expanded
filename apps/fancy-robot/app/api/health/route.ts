import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'fancy-robot',
    demo: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
    timestamp: new Date().toISOString(),
  });
}
