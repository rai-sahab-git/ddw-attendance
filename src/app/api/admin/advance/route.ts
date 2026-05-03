import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/admin/advance — add new advance record
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { employee_id, amount, date, description, deduct_month, deduct_year } = body

        if (!employee_id || !amount || !date) {
            return NextResponse.json({ error: 'employee_id, amount, date required' }, { status: 400 })
        }

        const { error } = await supabase.from('advance_payments').insert({
            employee_id,
            amount,
            date,
            description: description || null,
            deduct_month: deduct_month || null,
            deduct_year: deduct_year || null,
            is_deducted: false,
        })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE /api/admin/advance?id=xxx — delete advance record
export async function DELETE(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

        const { error } = await supabase.from('advance_payments').delete().eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}