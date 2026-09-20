import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('[TEST ROUTE] Handler started');
  try {
    const result = NextResponse.json({ status: 'ok', message: 'Test route works', ts: Date.now() });
    console.log('[TEST ROUTE] Handler returning success');
    return result;
  } catch (e) {
    console.log('[TEST ROUTE] Handler error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
