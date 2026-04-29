import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getMonthName, formatCurrency } from '@/lib/utils'
import { calculateSalary } from '@/lib/salary-calculator'
import { ChevronLeft, ChevronRight, IndianRupee } from 'lucide-react'

export default async function SalaryPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string; year?: string }>
}) {
    const params = await searchParams
    const supabase = await createClient()

    const today = new Date()
    const month = parseInt(params.month ?? String(today.getMonth() + 1))
    const year = parseInt(params.year ?? String(today.getFullYear()))

    const prevDate = new Date(year, month - 2, 1)
    const nextDate = new Date(year, month, 1)

    const [{ data: employees }, { data: attendance }, { data: advances }, { data: salaryRecords }] =
        await Promise.all([
            supabase.from('employees').select('*').eq('is_active', true).order('emp_code'),
            supabase.from('attendance_records').select('*').eq('month', month).eq('year', year),
            supabase.from('advance_payments').select('*').eq('deduct_month', month).eq('deduct_year', year),
            supabase.from('monthly_salary').select('*').eq('month', month).eq('year', year),
        ])

    const summaries = employees?.map(emp => {
        const empAttendance = attendance?.filter(a => a.employee_id === emp.id) ?? []
        const empAdvance = advances?.filter(a => a.employee_id === emp.id)
            .reduce((sum, a) => sum + a.amount, 0) ?? 0
        const savedRecord = salaryRecords?.find(s => s.employee_id === emp.id)

        return calculateSalary(
            emp,
            empAttendance as any,
            empAdvance,
            savedRecord?.ot_amount ?? 0,
            savedRecord?.extra_work_amount ?? 0,
            savedRecord?.paid_amount ?? 0,
        )
    }) ?? []

    const totalPayable = summaries.reduce((s, r) => s + r.payableAmount, 0)
    const totalPaid = summaries.reduce((s, r) => s + r.paidAmount, 0)
    const totalBalance = summaries.reduce((s, r) => s + r.balanceAmount, 0)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827' }}>Salary</div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>Monthly calculation</div>
                </div>
                {/* Month nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Link href={`/admin/salary?month=${prevDate.getMonth() + 1}&year=${prevDate.getFullYear()}`}
                        style={{ width: '32px', height: '32px', background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        <ChevronLeft size={16} color="#374151" />
                    </Link>
                    <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', padding: '6px 12px', fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                        {getMonthName(month).slice(0, 3)} {year}
                    </div>
                    <Link href={`/admin/salary?month=${nextDate.getMonth() + 1}&year=${nextDate.getFullYear()}`}
                        style={{ width: '32px', height: '32px', background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        <ChevronRight size={16} color="#374151" />
                    </Link>
                </div>
            </div>

            {/* Summary card */}
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: '20px', padding: '20px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                color: 'white',
            }}>
                <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
                    {getMonthName(month)} {year} — Summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    {[
                        { label: 'Total Payable', value: formatCurrency(totalPayable), color: '#34D399' },
                        { label: 'Total Paid', value: formatCurrency(totalPaid), color: '#60A5FA' },
                        { label: 'Balance Due', value: formatCurrency(totalBalance), color: totalBalance > 0 ? '#FCA5A5' : '#34D399' },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: 800, color }}>{value}</div>
                            <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px' }}>{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Employee salary cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {summaries.map(s => {
                    const initials = s.employee.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                    const hasBalance = s.balanceAmount > 0
                    const isFullyPaid = s.paidAmount > 0 && s.balanceAmount <= 0

                    return (
                        <Link
                            key={s.employee.id}
                            href={`/admin/salary/${s.employee.id}?month=${month}&year=${year}`}
                            style={{ textDecoration: 'none' }}
                        >
                            <div style={{
                                background: 'white', borderRadius: '16px',
                                padding: '16px',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                border: `1px solid ${hasBalance && s.paidAmount > 0 ? '#FEF3C7' : '#F3F4F6'}`,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    {/* Left */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '44px', height: '44px',
                                            background: '#F0FDF4', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 800, fontSize: '14px', color: '#00A651',
                                        }}>
                                            {initials}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>{s.employee.name}</div>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
                                                <span style={{ fontSize: '11px', color: '#6B7280' }}>{s.employee.emp_code}</span>
                                                <span style={{ fontSize: '11px', color: '#00A651', fontWeight: 600 }}>✓ {s.presentDays}d</span>
                                                {s.absentDays > 0 && <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>✗ {s.absentDays}d</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right */}
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>
                                            {formatCurrency(s.payableAmount)}
                                        </div>
                                        <div style={{ marginTop: '4px' }}>
                                            {isFullyPaid ? (
                                                <span style={{ fontSize: '11px', background: '#D1FAE5', color: '#059669', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                                                    Paid ✓
                                                </span>
                                            ) : s.paidAmount > 0 ? (
                                                <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#D97706', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                                                    Bal: {formatCurrency(s.balanceAmount)}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '11px', background: '#FEE2E2', color: '#DC2626', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                                                    Unpaid
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Breakdown row */}
                                <div style={{
                                    display: 'flex', gap: '6px', marginTop: '12px',
                                    paddingTop: '12px', borderTop: '1px solid #F3F4F6',
                                    flexWrap: 'wrap',
                                }}>
                                    {[
                                        { label: 'Base', value: formatCurrency(s.employee.monthly_salary), color: '#6B7280' },
                                        { label: 'Deduction', value: `-${formatCurrency(s.absentDeduction + s.halfdayDeduction)}`, color: '#EF4444' },
                                        s.otAmount > 0 && { label: 'OT', value: `+${formatCurrency(s.otAmount)}`, color: '#F97316' },
                                        s.advanceTotal > 0 && { label: 'Advance', value: `-${formatCurrency(s.advanceTotal)}`, color: '#8B5CF6' },
                                    ].filter(Boolean).map((item: any) => (
                                        <div key={item.label} style={{
                                            background: '#F9FAFB', borderRadius: '8px',
                                            padding: '4px 10px', display: 'flex', gap: '4px', alignItems: 'center',
                                        }}>
                                            <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{item.label}:</span>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: item.color }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}