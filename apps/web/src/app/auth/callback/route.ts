import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (code) {
    const supabase = await createClient();
    if (supabase) await supabase.auth.exchangeCodeForSession(code);
  }
  const next = request.nextUrl.searchParams.get('next');
  const destination = next?.startsWith('/') && !next.startsWith('//') ? next : '/';
  return NextResponse.redirect(new URL(destination, request.url));
}
