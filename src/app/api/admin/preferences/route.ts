import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth, getAuthContext } from '@/lib/api-auth'

const sb = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    const authError = await requireAdminAuth()
    if (authError) return authError
    const ctx = await getAuthContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { data } = await sb()
            .from('user_preferences')
            .select('theme')
            .eq('user_id', ctx.userId)
            .maybeSingle()
        return NextResponse.json({ theme: data?.theme ?? 'system' })
    } catch {
        return NextResponse.json({ theme: 'system' })
    }
}

export async function PUT(request: NextRequest) {
    const authError = await requireAdminAuth()
    if (authError) return authError
    const ctx = await getAuthContext()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { theme } = await request.json()
        if (!['light', 'dark', 'system'].includes(theme)) {
            return NextResponse.json({ error: 'Invalid theme' }, { status: 400 })
        }
        const { error } = await sb()
            .from('user_preferences')
            .upsert({ user_id: ctx.userId, theme, updated_at: new Date().toISOString() })
        if (error) {
            // Table may not exist yet — still OK client-side
            return NextResponse.json({ success: true, persisted: false })
        }
        return NextResponse.json({ success: true, persisted: true })
    } catch {
        return NextResponse.json({ success: true, persisted: false })
    }
}
