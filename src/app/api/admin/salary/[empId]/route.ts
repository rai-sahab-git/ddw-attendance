import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateSalaryV2 } from '@/lib/salary-calculator'

const supa = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ empId: string }> }
) {
    try {
        const { empId } = await params
        const body = await request.json()
        const { month, year, other_deductions, paid_amount } = body

        if (!month || !year) {
            return NextResponse.json({ error: 'month and year required' }, { status: 400 })
        }

        // Fetch everything in parallel
        const [
            { data: employee },
            { data: attendance },
            { data: advances },
            { data: settings },
            { data: overrides },
        ] = await Promise.all([
            supa().from('employees').select('*').eq('id', empId).single(),
            supa().from('attendance_records').select('*').eq('employee_id', empId).eq('month', month).eq('year', year),
            supa().from('advance_payments').select('*').eq('employee_id', empId).eq('deduct_month', month).eq('deduct_year', year),
            supa().from('attendance_settings').select('*').eq('is_active', true),
            supa().from('employee_type_overrides').select('*').eq('employee_id', empId),
        ])

        if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

        const advanceTotal = advances?.reduce((s: number, a: any) => s + a.amount, 0) ?? 0

        const salary = calculateSalaryV2(
            employee,
            (attendance ?? []) as any,
            (settings ?? []) as any,
            (overrides ?? []) as any,
            advanceTotal,
            other_deductions ?? 0,
            paid_amount ?? 0,
            month,
            year,
        )

        // Build bonus_breakdown JSON for storage
        const bonusBreakdown = salary.typeBreakdown
            .filter(t => t.amount > 0)
            .map(t => ({ code: t.code, count: t.count, amount: t.amount }))

        const record = {
            employee_id: empId,
            month, year,
            total_working_days: 26,
            present_days: salary.presentDays,
            absent_days: salary.absentDays,
            half_days: salary.halfDays,
            extra_days: 0,
            base_salary: employee.monthly_salary,
            per_day_rate: salary.perDay,
            absent_deduction: salary.absentDeduction,
            halfday_deduction: salary.halfdayDeduction,
            ot_amount: salary.bonusTotal,
            extra_work_amount: 0,
            advance_total: salary.advanceTotal,
            other_deductions: salary.otherDeductions,
            gross_earning: salary.grossEarning,
            payable_amount: salary.payableAmount,
            paid_amount: salary.paidAmount,
            balance_amount: salary.balanceAmount,
        }

        const { error } = await supa()
            .from('monthly_salary')
            .upsert(record, { onConflict: 'employee_id,month,year' })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ success: true, salary })
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}