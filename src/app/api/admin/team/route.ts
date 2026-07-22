import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission } from '@/lib/api-auth'

const sb = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    const result = await requirePermission('users:manage')
    if ('error' in result) return result.error

    try {
        const { data: profiles, error } = await sb()
            .from('user_profiles')
            .select('id, role, display_name, email, is_super_admin, is_active')
            .neq('role', 'employee')
            .order('display_name')
        if (error) {
            return NextResponse.json({ members: [], setupRequired: true, message: error.message })
        }

        const { data: memberships } = await sb()
            .from('warehouse_members')
            .select('user_id, warehouse_id, role, warehouses(id, name, code)')

        const members = (profiles ?? []).map(p => ({
            ...p,
            warehouses: (memberships ?? [])
                .filter(m => m.user_id === p.id)
                .map(m => ({
                    warehouse_id: m.warehouse_id,
                    role: m.role,
                    warehouse: m.warehouses,
                })),
        }))

        return NextResponse.json({ members, setupRequired: false })
    } catch (err) {
        return NextResponse.json({ members: [], setupRequired: true, message: String(err) })
    }
}

export async function POST(request: NextRequest) {
    const result = await requirePermission('users:manage')
    if ('error' in result) return result.error

    try {
        const body = await request.json()
        const { user_id, warehouse_id, role } = body
        if (!user_id || !warehouse_id || !role) {
            return NextResponse.json({ error: 'user_id, warehouse_id, role required' }, { status: 400 })
        }
        const { error } = await sb()
            .from('warehouse_members')
            .upsert({ user_id, warehouse_id, role }, { onConflict: 'warehouse_id,user_id' })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    const result = await requirePermission('users:manage')
    if ('error' in result) return result.error

    try {
        const { user_id, role } = await request.json()
        if (!user_id || !role) {
            return NextResponse.json({ error: 'user_id and role required' }, { status: 400 })
        }
        const allowed = ['super_admin', 'admin', 'manager', 'viewer']
        if (!allowed.includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }
        const update: Record<string, unknown> = {
            role: role === 'super_admin' ? 'admin' : role,
            is_super_admin: role === 'super_admin',
        }
        const { error } = await sb()
            .from('user_profiles')
            .update(update)
            .eq('id', user_id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    const result = await requirePermission('users:manage')
    if ('error' in result) return result.error

    try {
        const { user_id, warehouse_id } = await request.json()
        const { error } = await sb()
            .from('warehouse_members')
            .delete()
            .eq('user_id', user_id)
            .eq('warehouse_id', warehouse_id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
