import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission } from '@/lib/api-auth'

const sb = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    const result = await requirePermission('dashboard:view')
    if ('error' in result) return result.error

    try {
        const { data, error } = await sb()
            .from('warehouses')
            .select('*')
            .order('name')
        if (error) {
            return NextResponse.json({ warehouses: [], setupRequired: true, message: error.message })
        }
        let filtered = data ?? []
        if (!result.ctx.isSuperAdmin && result.ctx.warehouseIds.length > 0) {
            filtered = filtered.filter(w => result.ctx.warehouseIds.includes(w.id))
        }
        return NextResponse.json({ warehouses: filtered, setupRequired: false })
    } catch (err) {
        return NextResponse.json({ warehouses: [], setupRequired: true, message: String(err) })
    }
}

export async function POST(request: NextRequest) {
    const result = await requirePermission('org:manage')
    if ('error' in result) return result.error

    try {
        const body = await request.json()
        const { code, name, address } = body
        if (!code || !name) {
            return NextResponse.json({ error: 'code and name required' }, { status: 400 })
        }
        const clean = String(code).toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 12)
        const { data, error } = await sb()
            .from('warehouses')
            .insert({ code: clean, name, address: address || null, is_active: true })
            .select()
            .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Add creator as owner
        await sb().from('warehouse_members').upsert({
            warehouse_id: data.id,
            user_id: result.ctx.userId,
            role: 'owner',
        })

        return NextResponse.json({ success: true, warehouse: data })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    const result = await requirePermission('org:manage')
    if ('error' in result) return result.error

    try {
        const body = await request.json()
        const { id, name, address, is_active } = body
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
        const { error } = await sb()
            .from('warehouses')
            .update({ name, address, is_active })
            .eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
