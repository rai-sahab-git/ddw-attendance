import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getMonthName, formatCurrency } from '@/lib/utils'
import { calculateSalary } from '@/lib/salary-calculator'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ExportButton from '@/components/ExportButton'  // ← NEW

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

    const [{ data: employees }, { data: attendance }, { data: advances }, { data: salaryRecords }] = await Promise.all([
        supabase.from('employees').select('*').eq('is_active', true).order('emp_code'),
        supabase.from('attendance_records').select('*').eq('month', month).eq('year', year),
        supabase.from('advance_payments').select('*').eq('deduct_month', month).eq('deduct_year', year),
        supabase.from('monthly_salary').select('*').eq('month', month).eq('year', year),
    ])

    const summaries = employees?.map(emp => {
        const empAttendance = attendance?.filter(a => a.employee_id === emp.id) ?? []
        const empAdvance = advances?.filter(a => a.employee_id === emp.id).reduce((sum, a) => sum + a.amount, 0) ?? 0
        const savedRecord = salaryRecords?.find(s => s.employee_id === emp.id)
        return calculateSalary(emp, empAttendance as any, empAdvance, savedRecord?.ot_amount ?? 0, savedRecord?.extra_work_amount ?? 0, savedRecord?.paid_amount ?? 0)
    }) ?? []

    const totalPayable = summaries.reduce((s, r) => s + r.payableAmount, 0)
    const totalPaid = summaries.reduce((s, r) => s + r.paidAmount, 0)
    const totalBalance = summaries.reduce((s, r) => s + r.balanceAmount, 0)

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                    <h1 style={{ fontWeight: 800, fontSize: '22px', color: '#111827', margin: 0 }}>Salary</h1>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>Monthly calculation</p>
                </div>
                {/* ↓ EXPORT BUTTON — header ke right side mein */}
                <ExportButton month={month} year={year} label="Excel" />
            </div>

            {/* Month nav */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
                borderRadius: '16px', padding: '14px 16px', marginBottom: '14px',
            }}>
                <Link href={`/admin/salary?month=${prevDate.getMonth() + 1}&year=${prevDate.getFullYear()}`}
                    style={{ color: 'white', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    <ChevronLeft size={18} />
                </Link>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '18px', color: 'white' }}>{getMonthName(month)} {year}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{summaries.length} employees</div>
                </div>
                <Link href={`/admin/salary?month=${nextDate.getMonth() + 1}&year=${nextDate.getFullYear()}`}
                    style={{ color: 'white', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    <ChevronRight size={18} />
                </Link>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                {[
                    { label: 'Total Payable', value: formatCurrency(totalPayable), color: '#34D399', bg: '#F0FDF4' },
                    { label: 'Total Paid', value: formatCurrency(totalPaid), color: '#60A5FA', bg: '#EFF6FF' },
                    { label: 'Balance Due', value: formatCurrency(totalBalance), color: totalBalance > 0 ? '#EF4444' : '#34D399', bg: totalBalance > 0 ? '#FEF2F2' : '#F0FDF4' },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} style={{ background: bg, borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 900, color }}>{value}</div>
                        <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '3px' }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Employee salary cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {summaries.map(s => {
                    const initials = s.employee.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                    const hasBalance = s.balanceAmount > 0
                    const isFullyPaid = s.paidAmount > 0 && s.balanceAmount <= 0

                    return (
                        <Link key={s.employee.id} href={`/admin/salary/${s.employee.id}?month=${month}&year=${year}`}
                            style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: 'white', borderRadius: '14px', padding: '14px',
                                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                                borderLeft: `4px solid ${isFullyPaid ? '#00A651' : hasBalance ? '#EF4444' : '#E5E7EB'}`,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                                            background: 'linear-gradient(135deg,#00A651,#059669)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 800, fontSize: '13px',
                                        }}>{initials}</div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>{s.employee.name}</div>
                                            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                                {s.employee.emp_code}
                                                &nbsp;•&nbsp;✓ {s.presentDays}d
                                                {s.absentDays > 0 && <span style={{ color: '#EF4444' }}>&nbsp;✗ {s.absentDays}d</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#00A651' }}>{formatCurrency(s.payableAmount)}</div>
                                        {isFullyPaid
                                            ? <span style={{ background: '#DCFCE7', color: '#059669', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: 800 }}>Paid ✓</span>
                                            : s.paidAmount > 0
                                                ? <span style={{ background: '#FEE2E2', color: '#EF4444', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>Bal: {formatCurrency(s.balanceAmount)}</span>
                                                : <span style={{ background: '#FEF3C7', color: '#B45309', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>Unpaid</span>
                                        }
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '8px', borderTop: '1px solid #F3F4F6' }}>
                                    {[
                                        { label: 'Base', value: formatCurrency(s.employee.monthly_salary), color: '#6B7280' },
                                        { label: 'Deduction', value: `-${formatCurrency(s.absentDeduction + s.halfdayDeduction)}`, color: '#EF4444' },
                                        s.otAmount > 0 && { label: 'OT', value: `+${formatCurrency(s.otAmount)}`, color: '#F97316' },
                                        s.advanceTotal > 0 && { label: 'Advance', value: `-${formatCurrency(s.advanceTotal)}`, color: '#8B5CF6' },
                                    ].filter(Boolean).map((item: any) => (
                                        <span key={item.label} style={{ fontSize: '11px', color: item.color, background: '#F9FAFB', borderRadius: '6px', padding: '2px 8px' }}>
                                            {item.label}: {item.value}
                                        </span>
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