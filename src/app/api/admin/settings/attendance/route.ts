// src/app/api/admin/settings/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission } from '@/lib/api-auth'

const supa = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    const result = await requirePermission('settings:view')
    if ('error' in result) return result.error

    try {
        const { data, error } = await supa()
            .from('attendance_settings')
            .select('*')
            .order('sort_order')
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const result = await requirePermission('settings:edit')
    if ('error' in result) return result.error

    try {
        const body = await request.json()
        const { code, label, color, text_color, calc_type, fixed_amount, sort_order } = body

        if (!code || !label || !calc_type) {
            return NextResponse.json({ error: 'code, label, calc_type required' }, { status: 400 })
        }

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
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    const result = await requirePermission('settings:edit')
    if ('error' in result) return result.error

    try {
        const body = await request.json()
        const { id, label, color, text_color, calc_type, fixed_amount, sort_order, is_active } = body

        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

        const { error } = await supa()
            .from('attendance_settings')
            .update({ label, color, text_color, calc_type, fixed_amount, sort_order, is_active })
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    const result = await requirePermission('settings:edit')
    if ('error' in result) return result.error

    try {
        const { id } = await request.json()
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

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
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
