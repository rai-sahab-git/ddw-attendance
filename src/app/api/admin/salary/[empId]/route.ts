import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/admin/salary/[empId] — upsert monthly salary record
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ empId: string }> }
) {
    try {
        const { empId } = await params
        const body = await request.json()
        const { month, year, ot_amount, extra_work_amount, other_deductions, paid_amount } = body

        if (!month || !year) {
            return NextResponse.json({ error: 'month and year required' }, { status: 400 })
        }

        // Get current attendance + employee to compute all fields
        const [{ data: employee }, { data: attendance }, { data: advances }] = await Promise.all([
            supabase.from('employees').select('*').eq('id', empId).single(),
            supabase.from('attendance_records').select('*').eq('employee_id', empId).eq('month', month).eq('year', year),
            supabase.from('advance_payments').select('*').eq('employee_id', empId).eq('deduct_month', month).eq('deduct_year', year),
        ])

        if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

        const advanceTotal = advances?.reduce((s: number, a: any) => s + a.amount, 0) ?? 0

        // Compute attendance stats
        let presentDays = 0, absentDays = 0, halfDays = 0, extraDays = 0
        attendance?.forEach((r: any) => {
            switch (r.status) {
                case 'P': presentDays += 1; break
                case '2P': presentDays += 1; extraDays += 1; break
                case 'OT': presentDays += 1; break
                case '2OT': presentDays += 1; extraDays += 1; break
                case 'A': absentDays += 1; break
                case 'H': halfDays += 1; break
                case 'L': absentDays += 1; break
            }
        })

        const perDay = employee.per_day_rate
        const absentDeduction = absentDays * perDay
        const halfdayDeduction = halfDays * (perDay / 2)
        const extraDayPay = extraDays * perDay
        const grossEarning = (presentDays * perDay) + (ot_amount || 0) + (extra_work_amount || 0) + extraDayPay
        const payableAmount = Math.max(0, grossEarning - absentDeduction - halfdayDeduction - advanceTotal - (other_deductions || 0))
        const balanceAmount = payableAmount - (paid_amount || 0)

        const record = {
            employee_id: empId,
            month,
            year,
            total_working_days: 26,
            present_days: presentDays,
            absent_days: absentDays,
            half_days: halfDays,
            extra_days: extraDays,
            base_salary: employee.monthly_salary,
            per_day_rate: perDay,
            absent_deduction: absentDeduction,
            halfday_deduction: halfdayDeduction,
            ot_amount: ot_amount || 0,
            extra_work_amount: extra_work_amount || 0,
            advance_total: advanceTotal,
            other_deductions: other_deductions || 0,
            gross_earning: grossEarning,
            payable_amount: payableAmount,
            paid_amount: paid_amount || 0,
            balance_amount: balanceAmount,
        }

        const { error } = await supabase
            .from('monthly_salary')
            .upsert(record, { onConflict: 'employee_id,month,year' })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}