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
        return null  // null means auth passed
    } catch {
        return NextResponse.json(
            { error: 'Auth check failed' },
            { status: 500 }
        )
    }
}