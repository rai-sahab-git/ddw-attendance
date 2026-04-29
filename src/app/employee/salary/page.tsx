import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { calculateSalary } from '@/lib/salary-calculator'
import { getEmployeeSession } from '@/lib/employee-auth'

export default async function EmployeeSalaryPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string; year?: string }>
}) {
    const emp = await getEmployeeSession()
    if (!emp) redirect('/login')

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const sp = await searchParams
    const today = new Date()
    const month = parseInt(sp.month ?? String(today.getMonth() + 1))
    const year = parseInt(sp.year ?? String(today.getFullYear()))

    const prevDate = new Date(year, month - 2, 1)
    const nextDate = new Date(year, month, 1)

    const [{ data: attendance }, { data: advances }, { data: savedRecord }] = await Promise.all([
        supabase.from('attendance_records').select('*').eq('employee_id', emp.id).eq('month', month).eq('year', year),
        supabase.from('advance_payments').select('*').eq('employee_id', emp.id).order('date', { ascending: false }),
        supabase.from('monthly_salary').select('*').eq('employee_id', emp.id).eq('month', month).eq('year', year).single(),
    ])

    const monthAdvances = advances?.filter(a => a.deduct_month === month && a.deduct_year === year) ?? []
    const allAdvanceTotal = advances?.reduce((s, a) => s + a.amount, 0) ?? 0
    const advanceTotal = monthAdvances.reduce((s, a) => s + a.amount, 0)

    const calc = calculateSalary(
        emp as any,   // ← bas yeh change karo
        attendance as any ?? [],
        advanceTotal,
        savedRecord?.ot_amount ?? 0,
        savedRecord?.extra_work_amount ?? 0,
        savedRecord?.paid_amount ?? 0,
    )
    const isPaid = calc.paidAmount > 0 && calc.balanceAmount <= 0
    const hasBalance = calc.balanceAmount > 0 && calc.paidAmount > 0

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: '20px', padding: '18px', color: 'white' }}>
                <div style={{ fontWeight: 800, fontSize: '18px' }}>My Salary</div>
                <div style={{ opacity: 0.6, fontSize: '12px' }}>Detailed breakdown</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
                    <Link href={`/employee/salary?month=${prevDate.getMonth() + 1}&year=${prevDate.getFullYear()}`}
                        style={{ color: 'white', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 10px', textDecoration: 'none' }}>
                        <ChevronLeft size={16} />
                    </Link>
                    <span style={{ fontWeight: 700 }}>{getMonthName(month)} {year}</span>
                    <Link href={`/employee/salary?month=${nextDate.getMonth() + 1}&year=${nextDate.getFullYear()}`}
                        style={{ color: 'white', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 10px', textDecoration: 'none' }}>
                        <ChevronRight size={16} />
                    </Link>
                </div>
            </div>

            {/* Payable hero */}
            <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>{getMonthName(month)} {year} — Net Payable</div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: '#111827' }}>{formatCurrency(calc.payableAmount)}</div>
                <div style={{ marginTop: '8px' }}>
                    {isPaid
                        ? <span style={{ background: '#D1FAE5', color: '#059669', padding: '4px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>✅ Salary Received</span>
                        : hasBalance
                            ? <span style={{ background: '#FEF3C7', color: '#D97706', padding: '4px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>⏳ Balance: {formatCurrency(calc.balanceAmount)} pending</span>
                            : <span style={{ background: '#F3F4F6', color: '#6B7280', padding: '4px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>📊 Not paid yet</span>
                    }
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                {[
                    { label: 'Present', value: calc.presentDays, bg: '#D1FAE5', color: '#059669' },
                    { label: 'Absent', value: calc.absentDays, bg: '#FEE2E2', color: '#DC2626' },
                    { label: 'Half Day', value: calc.halfDays, bg: '#FEF3C7', color: '#D97706' },
                    { label: 'Extra', value: calc.extraDays, bg: '#DBEAFE', color: '#2563EB' },
                ].map(({ label, value, bg, color }) => (
                    <div key={label} style={{ background: 'white', borderRadius: '14px', padding: '12px 8px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <div style={{ fontSize: '22px', fontWeight: 800, color }}>{value}</div>
                        <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Breakdown */}
            <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', fontWeight: 700, fontSize: '14px' }}>Calculation Breakdown</div>
                {[
                    { label: 'Monthly Salary', value: formatCurrency(emp.monthly_salary), color: '#111827', sign: '' },
                    { label: `Per Day (÷ 26)`, value: formatCurrency(emp.per_day_rate) + '/day', color: '#6B7280', sign: '', small: true },
                    { label: `Absent (${calc.absentDays})`, value: formatCurrency(calc.absentDeduction), color: '#EF4444', sign: '-' },
                    { label: `Half Day (${calc.halfDays})`, value: formatCurrency(calc.halfdayDeduction), color: '#F59E0B', sign: '-' },
                    ...(calc.otAmount > 0 ? [{ label: 'OT / Extra Pay', value: formatCurrency(calc.otAmount), color: '#F97316', sign: '+' }] : []),
                    ...(calc.advanceTotal > 0 ? [{ label: 'Advance (this month)', value: formatCurrency(calc.advanceTotal), color: '#8B5CF6', sign: '-' }] : []),
                ].map(({ label, value, color, sign, small }: any) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F9FAFB' }}>
                        <span style={{ fontSize: small ? '12px' : '14px', color: '#374151' }}>{label}</span>
                        <span style={{ fontWeight: 700, color, fontSize: small ? '12px' : '14px' }}>{sign}{value}</span>
                    </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#F0FDF4' }}>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#111827' }}>Net Payable</span>
                    <span style={{ fontWeight: 900, fontSize: '18px', color: '#059669' }}>{formatCurrency(calc.payableAmount)}</span>
                </div>
            </div>

            {/* Advance history */}
            {advances && advances.length > 0 && (
                <div style={{ background: 'white', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px' }}>💳 Advance History</span>
                        <span style={{ fontWeight: 700, color: '#8B5CF6', fontSize: '14px' }}>Total: {formatCurrency(allAdvanceTotal)}</span>
                    </div>
                    {advances.map((adv: any) => (
                        <div key={adv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #F9FAFB' }}>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{adv.description || 'Advance'}</div>
                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                                    {new Date(adv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {adv.deduct_month === month && adv.deduct_year === year && (
                                        <span style={{ marginLeft: '6px', color: '#8B5CF6', fontWeight: 600 }}>• Deducted this month</span>
                                    )}
                                </div>
                            </div>
                            <span style={{ fontWeight: 800, color: '#8B5CF6' }}>-{formatCurrency(adv.amount)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}