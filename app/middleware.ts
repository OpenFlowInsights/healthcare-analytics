import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Skip middleware for static files, API routes that handle auth, and the login page
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/verify-password') ||
    pathname.startsWith('/site-access') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/)
  ) {
    return NextResponse.next()
  }

  // Check if user has valid access token
  const accessToken = request.cookies.get('site-access-token')

  if (!accessToken || accessToken.value !== process.env.SITE_ACCESS_TOKEN) {
    // Redirect to login page
    const url = request.nextUrl.clone()
    url.pathname = '/site-access'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
