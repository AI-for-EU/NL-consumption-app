import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription ?? error)}`
    )
  }

  if (code) {
    const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(url, key)
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (!exchangeError) {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
