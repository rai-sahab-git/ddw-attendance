import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '@/lib/api-auth'
import { hashPin } from '@/lib/pin'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/employees/[id] — never returns PIN hash
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = await requireAdminAuth()
    if (authError) return authError

    try {
        const { id } = await params
        const { data, error } = await supabase
            .from('employees')
            .select('id, name, emp_code, phone, monthly_salary, per_day_rate, joining_date, is_active, login_pin')
            .eq('id', id)
            .single()

        if (error || !data) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
        }

        const { login_pin, ...rest } = data
        return NextResponse.json({ ...rest, has_pin: Boolean(login_pin) })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// PUT /api/admin/employees/[id] — update (PIN only updated if provided)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = await requireAdminAuth()
    if (authError) return authError

    try {
        const { id } = await params
        const body = await request.json()
        const { name, emp_code, phone, monthly_salary, per_day_rate, joining_date, login_pin, is_active } = body

        const update: Record<string, unknown> = {
            name, emp_code, phone, monthly_salary, per_day_rate, joining_date, is_active,
        }

        // Only hash & update PIN when a new non-empty value is sent
        if (login_pin != null && String(login_pin).trim() !== '') {
            update.login_pin = await hashPin(String(login_pin))
        }

        const { error } = await supabase
            .from('employees')
            .update(update)
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE /api/admin/employees/[id] — soft delete (set inactive)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = await requireAdminAuth()
    if (authError) return authError

    try {
        const { id } = await params
        const { error } = await supabase
            .from('employees')
            .update({ is_active: false })
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
