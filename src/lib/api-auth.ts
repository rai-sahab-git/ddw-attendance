import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { can, type Permission } from '@/lib/permissions'

export type AuthContext = {
    userId: string
    email?: string
    role: string
    isSuperAdmin: boolean
    warehouseIds: string[]
    activeWarehouseId: string | null
}

function service() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function getAuthContext(): Promise<AuthContext | null> {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return null

        const sb = service()
        const { data: profile } = await sb
            .from('user_profiles')
            .select('role, is_super_admin')
            .eq('id', user.id)
            .maybeSingle()

        const role = profile?.is_super_admin
            ? 'super_admin'
            : (profile?.role === 'admin' || !profile?.role ? 'admin' : profile.role)

        let warehouseIds: string[] = []
        try {
            const { data: memberships } = await sb
                .from('warehouse_members')
                .select('warehouse_id, role')
                .eq('user_id', user.id)
            warehouseIds = (memberships ?? []).map(m => m.warehouse_id)
        } catch {
            warehouseIds = []
        }

        // Super admin / legacy admin sees all warehouses
        if (role === 'super_admin' || (role === 'admin' && warehouseIds.length === 0)) {
            try {
                const { data: all } = await sb.from('warehouses').select('id').eq('is_active', true)
                warehouseIds = (all ?? []).map(w => w.id)
            } catch {
                /* table may not exist yet */
            }
        }

        return {
            userId: user.id,
            email: user.email,
            role,
            isSuperAdmin: role === 'super_admin' || Boolean(profile?.is_super_admin),
            warehouseIds,
            activeWarehouseId: warehouseIds[0] ?? null,
        }
    } catch (err) {
        console.error('getAuthContext', err)
        return null
    }
}

export async function requireAdminAuth(): Promise<NextResponse | null> {
    const ctx = await getAuthContext()
    if (!ctx) {
        return NextResponse.json({ error: 'Unauthorized — please login' }, { status: 401 })
    }
    if (ctx.role === 'employee') {
        return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 })
    }
    return null
}

export async function requirePermission(
    permission: Permission,
): Promise<{ error: NextResponse } | { ctx: AuthContext }> {
    const ctx = await getAuthContext()
    if (!ctx) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }
    if (!can(ctx.role, permission)) {
        return { error: NextResponse.json({ error: 'Forbidden — insufficient permissions' }, { status: 403 }) }
    }
    return { ctx }
}
