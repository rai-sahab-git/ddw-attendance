import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // ✅ Employee auth API — bypass (cookie-based, not Supabase)
    if (pathname.startsWith('/api/employee-auth')) {
        return NextResponse.next()
    }

    // ✅ All other API routes — bypass
    if (pathname.startsWith('/api/')) {
        return NextResponse.next()
    }

    // ✅ Public routes — allow without auth
    if (pathname === '/login' || pathname === '/') {
        return NextResponse.next()
    }

    // ✅ Employee pages — check emp_session cookie
    if (pathname.startsWith('/employee')) {
        const empSession = request.cookies.get('emp_session')
        if (!empSession?.value) {
            return NextResponse.redirect(new URL('/login?tab=employee', request.url))
        }
        return NextResponse.next()
    }

    // ✅ Admin pages — Supabase auth check (redirects to /login if not logged in)
    if (pathname.startsWith('/admin')) {
        const response = await updateSession(request)
        // updateSession returns redirect to /login if no session
        return response
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}