import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { calculateSalary } from '@/lib/salary-calculator'

export default async function EmployeeSalaryPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string; year?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: emp } = await supabase
        .from('employees').select('*').eq('user_id', user.id).single()
    if (!emp) redirect('/login')

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
        emp, attendance as any ?? [],
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827' }}>My Salary</div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>Detailed breakdown</div>
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <Link href={`/employee/salary?month=${prevDate.getMonth() + 1}&year=${prevDate.getFullYear()}`}
                        style={{ width: '32px', height: '32px', background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        <ChevronLeft size={16} color="#374151" />
                    </Link>
                    <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', padding: '6px 12px', fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                        {getMonthName(month).slice(0, 3)} {year}
                    </div>
                    <Link href={`/employee/salary?month=${nextDate.getMonth() + 1}&year=${nextDate.getFullYear()}`}
                        style={{ width: '32px', height: '32px', background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        <ChevronRight size={16} color="#374151" />
                    </Link>
                </div>
            </div>

            {/* Payable hero card */}
            <div style={{
                background: isPaid
                    ? 'linear-gradient(135deg, #059669, #047857)'
                    : hasBalance
                        ? 'linear-gradient(135deg, #D97706, #B45309)'
                        : 'linear-gradient(135deg, #1a1a2e, #16213e)',
                borderRadius: '20px', padding: '24px', color: 'white',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                textAlign: 'center',
            }}>
                <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    {getMonthName(month)} {year} — Net Payable
                </div>
                <div style={{ fontSize: '48px', fontWeight: 900, letterSpacing: '-1px' }}>
                    {formatCurrency(calc.payableAmount)}
                </div>
                <div style={{ marginTop: '12px' }}>
                    {isPaid ? (
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 18px', borderRadius: '999px', fontSize: '13px', fontWeight: 700 }}>
                            ✅ Salary Received
                        </span>
                    ) : hasBalance ? (
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 18px', borderRadius: '999px', fontSize: '13px', fontWeight: 700 }}>
                            ⏳ Balance: {formatCurrency(calc.balanceAmount)} pending
                        </span>
                    ) : (
                        <span style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 18px', borderRadius: '999px', fontSize: '13px', fontWeight: 700 }}>
                            📊 Not paid yet
                        </span>
                    )}
                </div>
            </div>

            {/* Attendance summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                {[
                    { label: 'Present', value: calc.presentDays, bg: '#D1FAE5', color: '#059669' },
                    { label: 'Absent', value: calc.absentDays, bg: '#FEE2E2', color: '#DC2626' },
                    { label: 'Half Day', value: calc.halfDays, bg: '#FEF3C7', color: '#D97706' },
                    { label: 'Extra', value: calc.extraDays, bg: '#DBEAFE', color: '#2563EB' },
                ].map(({ label, value, bg, color }) => (
                    <div key={label} style={{ background: bg, borderRadius: '14px', padding: '12px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 900, color }}>{value}</div>
                        <div style={{ fontSize: '10px', color, opacity: 0.8, marginTop: '2px', fontWeight: 600 }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Salary breakdown */}
            <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', fontWeight: 700, fontSize: '14px', color: '#111827' }}>
                    Calculation Breakdown
                </div>

                {[
                    { label: 'Monthly Salary', value: formatCurrency(emp.monthly_salary), color: '#111827', sign: '' },
                    { label: `Per Day (÷ 26)`, value: formatCurrency(emp.per_day_rate) + '/day', color: '#6B7280', sign: '', small: true },
                    { label: `Absent (${calc.absentDays} days)`, value: formatCurrency(calc.absentDeduction), color: '#EF4444', sign: '-' },
                    { label: `Half Day (${calc.halfDays})`, value: formatCurrency(calc.halfdayDeduction), color: '#F59E0B', sign: '-' },
                    ...(calc.otAmount > 0 ? [{ label: 'OT / Extra Pay', value: formatCurrency(calc.otAmount), color: '#F97316', sign: '+' }] : []),
                    ...(calc.advanceTotal > 0 ? [{ label: `Advance (this month)`, value: formatCurrency(calc.advanceTotal), color: '#8B5CF6', sign: '-' }] : []),
                ].map(({ label, value, color, sign, small }: any) => (
                    <div key={label} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 16px', borderBottom: '1px solid #F9FAFB',
                    }}>
                        <div style={{ fontSize: small ? '12px' : '14px', color: '#6B7280' }}>{label}</div>
                        <div style={{ fontSize: small ? '12px' : '14px', fontWeight: 600, color }}>
                            {sign}{value}
                        </div>
                    </div>
                ))}

                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px', background: '#F0FDF4',
                }}>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>Net Payable</div>
                    <div style={{ fontWeight: 900, fontSize: '22px', color: '#059669' }}>
                        {formatCurrency(calc.payableAmount)}
                    </div>
                </div>
            </div>

            {/* Advance history */}
            {advances && advances.length > 0 && (
                <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div style={{
                        padding: '14px 16px', borderBottom: '1px solid #F3F4F6',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
                            💳 Advance History
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#8B5CF6' }}>
                            Total: {formatCurrency(allAdvanceTotal)}
                        </div>
                    </div>
                    {advances.map(adv => (
                        <div key={adv.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 16px', borderBottom: '1px solid #F9FAFB',
                        }}>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                                    {adv.description || 'Advance'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', display: 'flex', gap: '8px' }}>
                                    <span>{new Date(adv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    {adv.deduct_month === month && adv.deduct_year === year && (
                                        <span style={{ color: '#8B5CF6', fontWeight: 600 }}>• Deducted this month</span>
                                    )}
                                </div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '15px', color: '#8B5CF6' }}>
                                -{formatCurrency(adv.amount)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    )
}