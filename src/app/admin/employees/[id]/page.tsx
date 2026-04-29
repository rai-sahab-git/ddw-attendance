import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EmployeeDetailClient from './client'

export default async function EmployeeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const { data: emp } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single()

    if (!emp) notFound()

    // Get this month's quick stats
    const today = new Date()
    const month = today.getMonth() + 1
    const year = today.getFullYear()

    const { data: attendance } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', id)
        .eq('month', month)
        .eq('year', year)

    const { data: advances } = await supabase
        .from('advance_payments')
        .select('*')
        .eq('employee_id', id)
        .order('date', { ascending: false })
        .limit(5)

    const { data: salaryRecord } = await supabase
        .from('monthly_salary')
        .select('*')
        .eq('employee_id', id)
        .eq('month', month)
        .eq('year', year)
        .single()

    const presentDays = attendance?.filter(r => ['P', '2P', 'OT', '2OT'].includes(r.status)).length ?? 0
    const absentDays = attendance?.filter(r => r.status === 'A').length ?? 0
    const halfDays = attendance?.filter(r => r.status === 'H').length ?? 0
    const totalAdvance = advances?.reduce((s, a) => s + a.amount, 0) ?? 0

    return (
        <EmployeeDetailClient
            emp={emp}
            presentDays={presentDays}
            absentDays={absentDays}
            halfDays={halfDays}
            totalAdvance={totalAdvance}
            salaryRecord={salaryRecord ?? null}
            recentAdvances={advances ?? []}
            currentMonth={month}
            currentYear={year}
        />
    )
}