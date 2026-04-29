import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // ✅ Employee API routes — bypass completely (cookie-based auth, not Supabase auth)
    if (pathname.startsWith('/api/employee-auth')) {
        return NextResponse.next()
    }

    // ✅ All other API routes — bypass
    if (pathname.startsWith('/api/')) {
        return NextResponse.next()
    }

    // ✅ Employee pages — check emp_session cookie instead of Supabase auth
    if (pathname.startsWith('/employee')) {
        const empSession = request.cookies.get('emp_session')
        if (!empSession?.value) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        return NextResponse.next()
    }

    // ✅ Admin + everything else — Supabase auth check
    return await updateSession(request)
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}