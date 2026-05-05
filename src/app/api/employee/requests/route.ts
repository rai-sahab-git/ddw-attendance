import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getEmployeeSession } from '@/lib/employee-auth'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/employee/requests — employee submits new request
export async function POST(request: NextRequest) {
    try {
        const emp = await getEmployeeSession()
        if (!emp) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { request_type, date, requested_status, reason } = await request.json()

        if (!request_type || !date) {
            return NextResponse.json({ error: 'request_type and date required' }, { status: 400 })
        }

        const { error } = await supabase.from('attendance_requests').insert({
            employee_id: emp.id,
            request_type,
            date,
            date_from: date,           // ✅ YEH LINE ADD KARO
            requested_status: requested_status || null,
            reason: reason || null,
            status: 'pending',
        })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}