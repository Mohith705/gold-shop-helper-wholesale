import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Protect root, add-entry, and transaction routes
  if (path === '/' || path.startsWith('/add-entry') || path.startsWith('/transaction')) {
    const authCookie = request.cookies.get('admin_auth')
    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/add-entry/:path*', '/transaction/:path*'],
}
