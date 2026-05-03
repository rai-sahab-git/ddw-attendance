import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PATCH /api/admin/requests/[id] — approve or reject
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { status, review_note } = await request.json()

        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 })
        }

        // 1. Update the request status
        const { data: req, error: updateError } = await supabase
            .from('attendance_requests')
            .update({
                status,
                review_note: review_note || null,
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single()

        if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

        // 2. If approved + has requested_status → auto-update attendance record
        if (status === 'approved' && req.requested_status) {
            const dateStr = req.date ?? req.date_from
            if (dateStr) {
                const dateObj = new Date(dateStr)
                const month = dateObj.getMonth() + 1
                const year = dateObj.getFullYear()

                // Upsert attendance record
                const { error: attError } = await supabase
                    .from('attendance_records')
                    .upsert({
                        employee_id: req.employee_id,
                        date: dateStr,
                        month,
                        year,
                        status: req.requested_status,
                    }, { onConflict: 'employee_id,date' })

                if (attError) {
                    console.error('Attendance update error after approval:', attError.message)
                    // Still return success — request was approved, attendance update failed silently
                }
            }
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Request action error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}