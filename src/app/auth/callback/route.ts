import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const origin = requestUrl.origin

  // Preserve templateGroup parameter if it exists in the next URL
  const nextUrl = new URL(next, origin)
  const templateGroup = nextUrl.searchParams.get('templateGroup')
  const templateGroupId = nextUrl.searchParams.get('templateGroupId')
  const templateId = nextUrl.searchParams.get('templateId')
  const template = nextUrl.searchParams.get('template')

  // Also check for parameters directly in the callback URL
  const directTemplateGroup = requestUrl.searchParams.get('templateGroup')
  const directTemplateGroupId = requestUrl.searchParams.get('templateGroupId')
  const directTemplateId = requestUrl.searchParams.get('templateId')
  const directTemplate = requestUrl.searchParams.get('template')

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("OAuth exchange failed:", error)
        return NextResponse.redirect(`${origin}/signin?error=auth_failed`)
      }

      // Use direct parameters first, then fall back to next URL parameters
      const finalTemplateGroup = directTemplateGroup || templateGroup
      const finalTemplateGroupId = directTemplateGroupId || templateGroupId
      const finalTemplateId = directTemplateId || templateId
      const finalTemplate = directTemplate || template

      // Build redirect URL with preserved parameters
      let redirectUrl = `${origin}${next}`
      if (finalTemplateGroup) {
        redirectUrl += redirectUrl.includes('?') ? '&' : '?'
        redirectUrl += `templateGroup=${encodeURIComponent(finalTemplateGroup)}`
      }
      if (finalTemplateGroupId) {
        redirectUrl += redirectUrl.includes('?') ? '&' : '?'
        redirectUrl += `templateGroupId=${encodeURIComponent(finalTemplateGroupId)}`
      }
      if (finalTemplateId) {
        redirectUrl += redirectUrl.includes('?') ? '&' : '?'
        redirectUrl += `templateId=${encodeURIComponent(finalTemplateId)}`
      }
      if (finalTemplate) {
        redirectUrl += redirectUrl.includes('?') ? '&' : '?'
        redirectUrl += `template=${encodeURIComponent(finalTemplate)}`
      }
      
      return NextResponse.redirect(redirectUrl)
    } catch (err) {
      console.error("Exception during OAuth exchange:", err)
      return NextResponse.redirect(`${origin}/signin?error=auth_exception`)
    }
  }

  console.error("No code param found, redirecting with error=no_code")
  return NextResponse.redirect(`${origin}/signin?error=no_code`)
}
