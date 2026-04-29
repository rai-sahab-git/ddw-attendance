import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthName, formatCurrency } from '@/lib/utils'
import { calculateSalary } from '@/lib/salary-calculator'
import SalaryDetailClient from './client'

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

    const [{ data: emp }, { data: attendance }, { data: advances }, { data: savedRecord }] =
        await Promise.all([
            supabase.from('employees').select('*').eq('id', empId).single(),
            supabase.from('attendance_records').select('*').eq('employee_id', empId).eq('month', month).eq('year', year),
            supabase.from('advance_payments').select('*').eq('employee_id', empId),
            supabase.from('monthly_salary').select('*').eq('employee_id', empId).eq('month', month).eq('year', year).single(),
        ])

    if (!emp) notFound()

    const monthAdvances = advances?.filter(a => a.deduct_month === month && a.deduct_year === year) ?? []
    const advanceTotal = monthAdvances.reduce((s, a) => s + a.amount, 0)

    const calc = calculateSalary(
        emp,
        attendance as any ?? [],
        advanceTotal,
        savedRecord?.ot_amount ?? 0,
        savedRecord?.extra_work_amount ?? 0,
        savedRecord?.paid_amount ?? 0,
    )

    const prevDate = new Date(year, month - 2, 1)
    const nextDate = new Date(year, month, 1)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link href={`/admin/salary?month=${month}&year=${year}`} style={{
                    width: '38px', height: '38px', background: 'white',
                    borderRadius: '12px', border: '1px solid #E5E7EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                    <ArrowLeft size={18} color="#374151" />
                </Link>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '18px', color: '#111827' }}>{emp.name}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{emp.emp_code} • {getMonthName(month)} {year}</div>
                </div>
                {/* Month nav */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    <Link href={`/admin/salary/${empId}?month=${prevDate.getMonth() + 1}&year=${prevDate.getFullYear()}`}
                        style={{ width: '30px', height: '30px', background: 'white', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        <ChevronLeft size={14} color="#374151" />
                    </Link>
                    <Link href={`/admin/salary/${empId}?month=${nextDate.getMonth() + 1}&year=${nextDate.getFullYear()}`}
                        style={{ width: '30px', height: '30px', background: 'white', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        <ChevronRight size={14} color="#374151" />
                    </Link>
                </div>
            </div>

            {/* Attendance Summary */}
            <div style={{
                background: 'linear-gradient(135deg, #00A651 0%, #007A3D 100%)',
                borderRadius: '20px', padding: '20px', color: 'white',
                boxShadow: '0 8px 24px rgba(0,166,81,0.25)',
            }}>
                <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.8, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Attendance Summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {[
                        { label: 'Present', value: calc.presentDays, bg: 'rgba(255,255,255,0.2)' },
                        { label: 'Absent', value: calc.absentDays, bg: 'rgba(239,68,68,0.3)' },
                        { label: 'Half Day', value: calc.halfDays, bg: 'rgba(245,158,11,0.3)' },
                        { label: 'Extra', value: calc.extraDays, bg: 'rgba(59,130,246,0.3)' },
                    ].map(({ label, value, bg }) => (
                        <div key={label} style={{ background: bg, borderRadius: '12px', padding: '10px 8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '22px', fontWeight: 900 }}>{value}</div>
                            <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Salary Breakdown */}
            <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>Salary Breakdown</div>
                </div>

                {[
                    { label: 'Monthly Salary', value: formatCurrency(emp.monthly_salary), color: '#111827', sign: '' },
                    { label: 'Per Day Rate', value: formatCurrency(emp.per_day_rate) + '/day', color: '#6B7280', sign: '', small: true },
                    { label: 'Absent Deduction', value: formatCurrency(calc.absentDeduction), color: '#EF4444', sign: '-' },
                    { label: 'Half Day Deduction', value: formatCurrency(calc.halfdayDeduction), color: '#F59E0B', sign: '-' },
                    { label: 'OT Amount', value: formatCurrency(calc.otAmount), color: '#F97316', sign: '+' },
                    { label: 'Advance Deduction', value: formatCurrency(calc.advanceTotal), color: '#8B5CF6', sign: '-' },
                ].map(({ label, value, color, sign, small }) => (
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

                {/* Payable Total */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px', background: '#F0FDF4',
                }}>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>Net Payable</div>
                    <div style={{ fontWeight: 900, fontSize: '22px', color: '#00A651' }}>
                        {formatCurrency(calc.payableAmount)}
                    </div>
                </div>
            </div>

            {/* Payment Section — client component for interactivity */}
            <SalaryDetailClient
                empId={empId}
                month={month}
                year={year}
                payableAmount={calc.payableAmount}
                initialPaidAmount={calc.paidAmount}
                initialOtAmount={calc.otAmount}
                savedRecordId={savedRecord?.id}
            />

            {/* Advance History */}
            {advances && advances.length > 0 && (
                <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>Advance History</div>
                        <Link href={`/admin/salary/${empId}/advance?month=${month}&year=${year}`} style={{
                            fontSize: '12px', color: '#00A651', fontWeight: 700, textDecoration: 'none',
                        }}>
                            + Add
                        </Link>
                    </div>
                    {advances.slice(0, 5).map(adv => (
                        <div key={adv.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 16px', borderBottom: '1px solid #F9FAFB',
                        }}>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                                    {adv.description || 'Advance'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                                    {new Date(adv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    {adv.deduct_month === month ? ' • This month' : ''}
                                </div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '15px', color: '#8B5CF6' }}>
                                -{formatCurrency(adv.amount)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Advance button */}
            <Link href={`/admin/salary/${empId}/advance?month=${month}&year=${year}`} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: 'white', border: '2px dashed #D1D5DB',
                borderRadius: '16px', padding: '14px',
                textDecoration: 'none', color: '#6B7280', fontWeight: 600, fontSize: '14px',
            }}>
                <span style={{ fontSize: '18px' }}>💳</span> Add Advance / Deduction
            </Link>

        </div>
    )
}