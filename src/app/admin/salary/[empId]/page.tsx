import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getMonthName, formatCurrency } from '@/lib/utils'
import { calculateSalary } from '@/lib/salary-calculator'
import SalaryEditForm from './SalaryEditForm'

export default async function SalaryDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ empId: string }>
    searchParams: Promise<{ month?: string; year?: string }>
}) {
    const { empId } = await params
    const sp = await searchParams
    const supabase = await createClient()

    const today = new Date()
    const month = parseInt(sp.month ?? String(today.getMonth() + 1))
    const year = parseInt(sp.year ?? String(today.getFullYear()))

    const [
        { data: employee },
        { data: attendance },
        { data: advances },
        { data: savedRecord },
    ] = await Promise.all([
        supabase.from('employees').select('*').eq('id', empId).single(),
        supabase.from('attendance_records').select('*').eq('employee_id', empId).eq('month', month).eq('year', year),
        supabase.from('advance_payments').select('*').eq('employee_id', empId).order('date', { ascending: false }),
        supabase.from('monthly_salary').select('*').eq('employee_id', empId).eq('month', month).eq('year', year).single(),
    ])

    if (!employee) notFound()

    const monthlyAdvance = advances
        ?.filter(a => a.deduct_month === month && a.deduct_year === year)
        .reduce((s: number, a: any) => s + a.amount, 0) ?? 0

    const salary = calculateSalary(
        employee,
        (attendance ?? []) as any,
        monthlyAdvance,
        savedRecord?.ot_amount ?? 0,
        savedRecord?.extra_work_amount ?? 0,
        savedRecord?.paid_amount ?? 0,
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link href={`/admin/salary?month=${month}&year=${year}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', color: '#374151',
                }}>
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 style={{ fontWeight: 800, fontSize: '20px', color: '#111827', margin: 0 }}>{employee.name}</h1>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '1px' }}>
                        {getMonthName(month)} {year} — {employee.emp_code}
                    </p>
                </div>
            </div>

            {/* Salary Breakdown Card */}
            <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: '20px', padding: '20px' }}>
                <div style={{ fontWeight: 700, fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                    Salary Breakdown
                </div>

                {/* Big payable */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Net Payable</div>
                    <div style={{ fontSize: '36px', fontWeight: 900, color: '#34D399' }}>
                        {formatCurrency(salary.payableAmount)}
                    </div>
                    {salary.balanceAmount > 0 && (
                        <div style={{ fontSize: '13px', color: '#FCA5A5', marginTop: '4px' }}>
                            Balance due: {formatCurrency(salary.balanceAmount)}
                        </div>
                    )}
                    {salary.paidAmount > 0 && salary.balanceAmount <= 0 && (
                        <div style={{ fontSize: '13px', color: '#34D399', marginTop: '4px' }}>✓ Fully Paid</div>
                    )}
                </div>

                {/* Grid breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                        { label: 'Present Days', value: `${salary.presentDays}d`, color: '#86EFAC' },
                        { label: 'Absent Days', value: `${salary.absentDays}d`, color: '#FCA5A5' },
                        { label: 'Half Days', value: `${salary.halfDays}d`, color: '#FDE68A' },
                        { label: 'Double Present', value: `${salary.extraDays}d`, color: '#93C5FD' },
                        { label: 'Base Salary', value: formatCurrency(employee.monthly_salary), color: '#E5E7EB' },
                        { label: 'Per Day', value: formatCurrency(employee.per_day_rate), color: '#E5E7EB' },
                        { label: 'Absent Deduction', value: `-${formatCurrency(salary.absentDeduction)}`, color: '#FCA5A5' },
                        { label: 'Halfday Deduction', value: `-${formatCurrency(salary.halfdayDeduction)}`, color: '#FDE68A' },
                        { label: 'OT Amount', value: `+${formatCurrency(salary.otAmount)}`, color: '#FD8A5E' },
                        { label: 'Advance', value: `-${formatCurrency(salary.advanceTotal)}`, color: '#C4B5FD' },
                        { label: 'Gross Earning', value: formatCurrency(salary.grossEarning), color: '#34D399' },
                        { label: 'Paid Amount', value: formatCurrency(salary.paidAmount), color: '#60A5FA' },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '10px 12px' }}>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '3px' }}>{label}</div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color }}>{value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edit Form */}
            <SalaryEditForm
                employee={employee}
                month={month}
                year={year}
                savedRecord={savedRecord}
                currentSalary={salary}
                monthlyAdvance={monthlyAdvance}
            />

            {/* Advance History */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Advance History
                    </div>
                    <Link href={`/admin/salary/${empId}/advance?month=${month}&year=${year}`} style={{
                        background: '#FEF3C7', color: '#B45309', borderRadius: '8px',
                        padding: '6px 12px', fontWeight: 700, fontSize: '12px', textDecoration: 'none',
                    }}>
                        + Add
                    </Link>
                </div>

                {!advances?.length ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF', fontSize: '13px' }}>
                        No advance records
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {advances.map((adv: any) => (
                            <div key={adv.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 12px', background: '#FAFAFA', borderRadius: '10px',
                            }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>
                                        {formatCurrency(adv.amount)}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                                        {adv.date} • {adv.description || 'Advance'}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                                    background: adv.is_deducted ? '#F0FDF4' : '#FEF3C7',
                                    color: adv.is_deducted ? '#059669' : '#B45309',
                                }}>
                                    {adv.is_deducted
                                        ? `Deducted ${adv.deduct_month ? `(${getMonthName(adv.deduct_month).slice(0, 3)})` : ''}`
                                        : 'Pending'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}