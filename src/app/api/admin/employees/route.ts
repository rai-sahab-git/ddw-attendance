import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '@/lib/api-auth'
import { hashPin } from '@/lib/pin'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/admin/employees — create new employee
export async function POST(request: NextRequest) {
    const authError = await requireAdminAuth()
    if (authError) return authError

    try {
        const body = await request.json()
        const { name, emp_code, phone, monthly_salary, per_day_rate, joining_date, login_pin } = body

        if (!name || !emp_code || !monthly_salary || !joining_date) {
            return NextResponse.json({ error: 'Name, emp_code, salary, joining_date are required' }, { status: 400 })
        }

        if (!login_pin || String(login_pin).trim().length < 4) {
            return NextResponse.json({ error: 'A 4-digit login PIN is required' }, { status: 400 })
        }

        const hashedPin = await hashPin(String(login_pin))

        const { data, error } = await supabase
            .from('employees')
            .insert({
                name,
                emp_code,
                phone,
                monthly_salary,
                per_day_rate,
                joining_date,
                login_pin: hashedPin,
                is_active: true,
            })
            .select('id, name, emp_code, phone, monthly_salary, per_day_rate, joining_date, is_active')
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, employee: data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
