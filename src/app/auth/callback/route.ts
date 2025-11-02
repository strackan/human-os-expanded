import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const startTime = performance.now()
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const origin = requestUrl.origin

  console.log('🔐 [AUTH CALLBACK] Route hit', {
    timestamp: new Date().toISOString(),
    hasCode: !!code,
    origin,
    next,
    url: requestUrl.toString()
  })

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
      console.log('🔐 [AUTH CALLBACK] Starting code exchange', {
        codeLength: code.length,
        elapsedMs: (performance.now() - startTime).toFixed(2)
      })

      const supabase = await createClient()
      const exchangeStart = performance.now()

      // Add timeout to exchangeCodeForSession
      const exchangePromise = supabase.auth.exchangeCodeForSession(code)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('exchangeCodeForSession timeout after 30 seconds')), 30000)
      )

      const { error } = await Promise.race([exchangePromise, timeoutPromise]) as any

      const exchangeDuration = performance.now() - exchangeStart
      console.log('🔐 [AUTH CALLBACK] Code exchange completed', {
        success: !error,
        durationMs: exchangeDuration.toFixed(2),
        totalElapsedMs: (performance.now() - startTime).toFixed(2)
      })

      if (error) {
        console.error("🔐 [AUTH CALLBACK] OAuth exchange failed:", {
          error: error.message,
          code: error.code,
          status: error.status,
          durationMs: exchangeDuration.toFixed(2)
        })
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

      console.log('🔐 [AUTH CALLBACK] Redirecting to:', {
        redirectUrl,
        totalDurationMs: (performance.now() - startTime).toFixed(2)
      })

      return NextResponse.redirect(redirectUrl)
    } catch (err: any) {
      const errorDuration = performance.now() - startTime
      console.error("🔐 [AUTH CALLBACK] Exception during OAuth exchange:", {
        error: err?.message || String(err),
        stack: err?.stack,
        durationMs: errorDuration.toFixed(2),
        isTimeout: err?.message?.includes('timeout')
      })
      return NextResponse.redirect(`${origin}/signin?error=auth_exception`)
    }
  }

  console.error("🔐 [AUTH CALLBACK] No code param found, redirecting with error=no_code")
  return NextResponse.redirect(`${origin}/signin?error=no_code`)
}
