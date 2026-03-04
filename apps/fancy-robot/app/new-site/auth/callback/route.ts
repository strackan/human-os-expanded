import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/new-site/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Upsert fancyrobot.profiles using service role client
      const serviceClient = getSupabaseServer()
      if (serviceClient) {
        const user = data.session.user
        await serviceClient
          .schema('fancyrobot')
          .from('profiles')
          .upsert(
            {
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || null,
            },
            { onConflict: 'id', ignoreDuplicates: true }
          )
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/new-site/login?error=auth-code-error`)
}
