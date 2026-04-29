import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
        const { emp_code, pin } = await request.json()

        if (!emp_code || !pin) {
            return NextResponse.json({ error: 'Employee ID and PIN are required' }, { status: 400 })
        }

        // ✅ Service role client — bypasses RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: employee, error } = await supabase
            .from('employees')
            .select('id, name, emp_code, is_active, login_pin')
            .eq('emp_code', emp_code.trim().toUpperCase())
            .single()

        if (error || !employee) {
            return NextResponse.json({ error: 'Invalid Employee ID or PIN' }, { status: 401 })
        }

        if (!employee.is_active) {
            return NextResponse.json({ error: 'Your account is inactive. Contact admin.' }, { status: 401 })
        }

        if (String(employee.login_pin).trim() !== String(pin).trim()) {
            return NextResponse.json({ error: 'Invalid Employee ID or PIN' }, { status: 401 })
        }

        // ✅ Create session token
        const token = randomUUID()
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

        await supabase.from('employee_sessions').insert({
            employee_id: employee.id,
            token,
            expires_at: expiresAt.toISOString(),
        })

        // ✅ Set cookie
        const cookieStore = await cookies()
        cookieStore.set('emp_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expiresAt,
            path: '/',
        })

        return NextResponse.json({
            success: true,
            employee: { id: employee.id, name: employee.name, emp_code: employee.emp_code },
        })
    } catch (err) {
        console.error('Employee login error:', err)
        return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
    }
}