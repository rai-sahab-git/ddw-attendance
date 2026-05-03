import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        const { records } = await request.json()

        if (!records || !Array.isArray(records) || records.length === 0) {
            return NextResponse.json({ error: 'No records provided' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error } = await supabase
            .from('attendance_records')
            .upsert(records, { onConflict: 'employee_id,date', ignoreDuplicates: false })

        if (error) {
            console.error('Bulk save error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, count: records.length })
    } catch (err) {
        console.error('Bulk save exception:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}