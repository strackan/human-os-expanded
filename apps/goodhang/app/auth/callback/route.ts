import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/members'
  const source = searchParams.get('source') ?? 'login'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      const user = data.session.user
      const userMetadata = user.user_metadata

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, assessment_status, invite_code_used')
        .eq('id', user.id)
        .single()

      // Track if this is a new user (no existing profile)
      const isNewUser = !existingProfile

      // If new user, create profile with initial assessment status
      if (isNewUser) {
        const linkedinData = {
          id: user.id,
          email: user.email || '',
          name: userMetadata.name || userMetadata.full_name || 'New Member',
          avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
          linkedin_url: userMetadata.provider_id
            ? `https://www.linkedin.com/in/${userMetadata.provider_id}`
            : null,
          assessment_status: 'not_started',
        }

        await supabase
          .from('profiles')
          .insert(linkedinData)
      } else {
        // Update existing profile with LinkedIn data if available
        const linkedinData = {
          avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
          linkedin_url: userMetadata.provider_id
            ? `https://www.linkedin.com/in/${userMetadata.provider_id}`
            : null,
        }

        if (linkedinData.avatar_url || linkedinData.linkedin_url) {
          await supabase
            .from('profiles')
            .update(linkedinData)
            .eq('id', user.id)
        }
      }

      // Determine redirect path based on source
      let redirectPath = next

      // If coming from login, always go to members area (no assessment status checks)
      if (source === 'login') {
        redirectPath = '/members'
      } else if (source === 'assessment') {
        // If coming from assessment, check status and route accordingly
        const { data: profile } = await supabase
          .from('profiles')
          .select('assessment_status')
          .eq('id', user.id)
          .single()

        if (profile) {
          switch (profile.assessment_status) {
            case 'not_started':
              // New user taking assessment - go to interview
              redirectPath = '/assessment/interview'
              break
            case 'in_progress':
              // Resume assessment
              redirectPath = '/assessment/interview'
              break
            case 'completed':
            case 'pending_review':
            case 'trial':
            case 'approved':
              // Already completed - go to assessment start which will show the retake dialog
              redirectPath = '/assessment/start?completed=true'
              break
            case 'waitlist':
            case 'rejected':
              redirectPath = '/status/not-approved'
              break
            default:
              redirectPath = '/assessment/interview'
          }
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
