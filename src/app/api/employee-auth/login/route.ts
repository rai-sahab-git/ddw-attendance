import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
    const { emp_code, pin } = await req.json()

    if (!emp_code || !pin) {
        return NextResponse.json({ error: 'Employee ID and PIN required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Find employee by emp_code + login_pin
    const { data: emp, error } = await supabase
        .from('employees')
        .select('id, name, emp_code, is_active, login_pin')
        .eq('emp_code', emp_code.toUpperCase().trim())
        .eq('login_pin', pin.trim())
        .single()

    if (error || !emp) {
        return NextResponse.json({ error: 'Invalid Employee ID or PIN' }, { status: 401 })
    }

    if (!emp.is_active) {
        return NextResponse.json({ error: 'Your account is inactive. Contact admin.' }, { status: 403 })
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex')

    // Save session in DB
    await supabase.from('employee_sessions').insert({
        employee_id: emp.id,
        token,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('emp_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
    })

    return NextResponse.json({ success: true, name: emp.name })
}