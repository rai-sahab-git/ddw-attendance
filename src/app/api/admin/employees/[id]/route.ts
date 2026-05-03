import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PUT /api/admin/employees/[id] — update
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, emp_code, phone, monthly_salary, per_day_rate, joining_date, login_pin, is_active } = body

        const { error } = await supabase
            .from('employees')
            .update({ name, emp_code, phone, monthly_salary, per_day_rate, joining_date, login_pin, is_active })
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE /api/admin/employees/[id] — soft delete (set inactive) or hard delete
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        // Soft delete — mark inactive instead of hard delete to preserve history
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