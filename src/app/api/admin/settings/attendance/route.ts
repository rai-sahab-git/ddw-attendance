// src/app/api/admin/settings/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supa = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Auth guard helper
async function requireAdmin() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

// GET — fetch all settings
export async function GET() {
    try {
        const { data, error } = await supa()
            .from('attendance_settings')
            .select('*')
            .order('sort_order')
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST — create new custom type
export async function POST(request: NextRequest) {
    try {
        const user = await requireAdmin()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { code, label, color, text_color, calc_type, fixed_amount, sort_order } = body

        if (!code || !label || !calc_type) {
            return NextResponse.json({ error: 'code, label, calc_type required' }, { status: 400 })
        }

        // Code must be uppercase alphanumeric, max 6 chars
        const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
        if (!cleanCode) return NextResponse.json({ error: 'Invalid code' }, { status: 400 })

        const { data, error } = await supa()
            .from('attendance_settings')
            .insert({
                code: cleanCode, label, color: color || '#6B7280',
                text_color: text_color || '#FFFFFF',
                calc_type, fixed_amount: fixed_amount || 0,
                sort_order: sort_order || 99,
                is_system: false,
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// PUT — update existing type
export async function PUT(request: NextRequest) {
    try {
        const user = await requireAdmin()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { id, label, color, text_color, calc_type, fixed_amount, sort_order, is_active } = body

        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

        const { error } = await supa()
            .from('attendance_settings')
            .update({ label, color, text_color, calc_type, fixed_amount, sort_order, is_active })
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE — only non-system types
export async function DELETE(request: NextRequest) {
    try {
        const user = await requireAdmin()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await request.json()
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

        // Check if system type
        const { data: existing } = await supa()
            .from('attendance_settings')
            .select('is_system')
            .eq('id', id)
            .single()

        if (existing?.is_system) {
            return NextResponse.json({ error: 'System types cannot be deleted' }, { status: 400 })
        }

        const { error } = await supa().from('attendance_settings').delete().eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}