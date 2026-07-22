import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Usage in any admin API route:
 *
 *   const authError = await requireAdminAuth()
 *   if (authError) return authError
 */
export async function requireAdminAuth(): Promise<NextResponse | null> {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            return NextResponse.json(
                { error: 'Unauthorized — please login' },
                { status: 401 }
            )
        }

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        // If no profile row, treat authenticated session as admin (legacy installs)
        if (profile && profile.role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden — admin access required' },
                { status: 403 }
            )
        }

        return null
    } catch (err) {
        console.error('requireAdminAuth error:', err)
        return NextResponse.json(
            { error: 'Auth check failed' },
            { status: 500 }
        )
    }
}
