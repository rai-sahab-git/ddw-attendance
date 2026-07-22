import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { hashPin, isPinHashed, verifyPin } from '@/lib/pin'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

const LOGIN_LIMIT = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export async function POST(request: NextRequest) {
    try {
        const { emp_code, pin } = await request.json()

        if (!emp_code || !pin) {
            return NextResponse.json({ error: 'Employee ID and PIN are required' }, { status: 400 })
        }

        const code = emp_code.trim().toUpperCase()
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown'
        const rateKey = `emp-login:${ip}:${code}`

        const limited = checkRateLimit(rateKey, LOGIN_LIMIT, LOGIN_WINDOW_MS)
        if (!limited.allowed) {
            return NextResponse.json(
                { error: `Too many attempts. Try again in ${limited.retryAfterSec}s.` },
                { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } },
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: employee, error } = await supabase
            .from('employees')
            .select('id, name, emp_code, is_active, login_pin')
            .eq('emp_code', code)
            .single()

        if (error || !employee) {
            return NextResponse.json({ error: 'Invalid Employee ID or PIN' }, { status: 401 })
        }

        if (!employee.is_active) {
            return NextResponse.json({ error: 'Your account is inactive. Contact admin.' }, { status: 401 })
        }

        const ok = await verifyPin(pin, employee.login_pin)
        if (!ok) {
            return NextResponse.json({ error: 'Invalid Employee ID or PIN' }, { status: 401 })
        }

        // Migrate legacy plaintext PIN to bcrypt on successful login
        if (employee.login_pin && !isPinHashed(employee.login_pin)) {
            const hashed = await hashPin(pin)
            await supabase.from('employees').update({ login_pin: hashed }).eq('id', employee.id)
        }

        resetRateLimit(rateKey)

        const token = randomUUID()
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

        await supabase.from('employee_sessions').insert({
            employee_id: employee.id,
            token,
            expires_at: expiresAt.toISOString(),
        })

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
