import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getMonthName, formatCurrency } from '@/lib/utils'
import { calculateSalary } from '@/lib/salary-calculator'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ExportButton from '@/components/ExportButton'

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

    const [
        { data: employees },
        { data: attendance },
        { data: advances },
        { data: salaryRecords },
        { data: settings },
        { data: allOverrides },
    ] = await Promise.all([
        supabase.from('employees').select('*').eq('is_active', true).order('emp_code'),
        supabase.from('attendance_records').select('*').eq('month', month).eq('year', year),
        supabase.from('advance_payments').select('*').eq('deduct_month', month).eq('deduct_year', year),
        supabase.from('monthly_salary').select('*').eq('month', month).eq('year', year),
        supabase.from('attendance_settings').select('*').eq('is_active', true),
        supabase.from('employee_type_overrides').select('*'),
    ])

    const settingsList = (settings ?? []).map(s => ({
        code: s.code,
        calc_type: s.calc_type,
        fixed_amount: s.fixed_amount ?? 0,
        multiplier: s.multiplier ?? 1,
    }))

    const summaries = employees?.map(emp => {
        const empAttendance = attendance?.filter(a => a.employee_id === emp.id) ?? []
        const empAdvance = advances?.filter(a => a.employee_id === emp.id).reduce((sum, a) => sum + a.amount, 0) ?? 0
        const savedRecord = salaryRecords?.find(s => s.employee_id === emp.id)
        const empOverrides = (allOverrides ?? [])
            .filter(o => o.employee_id === emp.id)
            .map(o => ({
                type_code: o.type_code,
                override_amount: o.override_amount,
                override_multiplier: o.override_multiplier,
            }))
        return calculateSalary(
            emp,
            empAttendance,
            empAdvance,
            settingsList,
            empOverrides,
            savedRecord?.paid_amount ?? 0,
            month,
            year,
            savedRecord?.other_deductions ?? 0,
        )
    }) ?? []

    const totalPayable = summaries.reduce((s, r) => s + r.payableAmount, 0)
    const totalPaid = summaries.reduce((s, r) => s + r.paidAmount, 0)
    const totalBalance = summaries.reduce((s, r) => s + r.balanceAmount, 0)

    function statusBadge(s: typeof summaries[0]) {
        const isFullyPaid = s.paidAmount > 0 && s.balanceAmount <= 0
        if (isFullyPaid) return { label: 'Paid', bg: '#DCFCE7', color: '#059669' }
        if (s.paidAmount > 0) return { label: `Bal ${formatCurrency(s.balanceAmount)}`, bg: '#FEE2E2', color: '#EF4444' }
        return { label: 'Unpaid', bg: '#FEF3C7', color: '#B45309' }
    }

    return (
        <div>
            <div className="page-head">
                <div>
                    <h1>Salary</h1>
                    <p>Monthly calculation</p>
                </div>
                <div className="page-head__actions">
                    <ExportButton month={month} year={year} label="Excel" />
                </div>
            </div>

            <div className="month-strip">
                <Link href={`/admin/salary?month=${prevDate.getMonth() + 1}&year=${prevDate.getFullYear()}`}>
                    <ChevronLeft size={18} />
                </Link>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{getMonthName(month)} {year}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{summaries.length} employees</div>
                </div>
                <Link href={`/admin/salary?month=${nextDate.getMonth() + 1}&year=${nextDate.getFullYear()}`}>
                    <ChevronRight size={18} />
                </Link>
            </div>

            <div className="kpi-row" style={{ marginBottom: 14, gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {[
                    { label: 'Total Payable', value: formatCurrency(totalPayable), tint: 'tint-success', fg: 'var(--tint-success-fg)' },
                    { label: 'Total Paid', value: formatCurrency(totalPaid), tint: 'tint-info', fg: 'var(--tint-info-fg)' },
                    { label: 'Balance Due', value: formatCurrency(totalBalance), tint: totalBalance > 0 ? 'tint-danger' : 'tint-success', fg: totalBalance > 0 ? 'var(--tint-danger-fg)' : 'var(--tint-success-fg)' },
                ].map(({ label, value, tint, fg }) => (
                    <div key={label} className={`kpi-card ${tint}`} style={{ textAlign: 'center' }}>
                        <div className="kpi-card__value" style={{ color: fg, fontSize: 16 }}>{value}</div>
                        <div className="kpi-card__label">{label}</div>
                    </div>
                ))}
            </div>

            {/* Desktop table */}
            <div className="data-table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Payable</th>
                            <th>Paid</th>
                            <th>Balance</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summaries.map(s => {
                            const badge = statusBadge(s)
                            return (
                                <tr key={s.employee.id}>
                                    <td>
                                        <Link
                                            href={`/admin/salary/${s.employee.id}?month=${month}&year=${year}`}
                                            className="row-link"
                                        >
                                            {s.employee.name}
                                        </Link>
                                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.employee.emp_code}</div>
                                    </td>
                                    <td>{s.presentDays}</td>
                                    <td style={{ color: s.absentDays > 0 ? '#EF4444' : undefined }}>{s.absentDays}</td>
                                    <td style={{ fontWeight: 800, color: '#00A651' }}>{formatCurrency(s.payableAmount)}</td>
                                    <td>{formatCurrency(s.paidAmount)}</td>
                                    <td style={{ fontWeight: 700, color: s.balanceAmount > 0 ? '#EF4444' : '#059669' }}>
                                        {formatCurrency(s.balanceAmount)}
                                    </td>
                                    <td>
                                        <span style={{
                                            fontSize: 11, fontWeight: 800, borderRadius: 999,
                                            padding: '3px 10px', background: badge.bg, color: badge.color,
                                        }}>
                                            {badge.label}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="card-list card-list--desktop-hide" style={{ marginTop: 0 }}>
                {summaries.map(s => {
                    const initials = s.employee.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                    const hasBalance = s.balanceAmount > 0
                    const isFullyPaid = s.paidAmount > 0 && s.balanceAmount <= 0
                    const badge = statusBadge(s)

                    return (
                        <Link key={s.employee.id} href={`/admin/salary/${s.employee.id}?month=${month}&year=${year}`}
                            style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: 'var(--panel)', borderRadius: 14, padding: 14,
                                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                                borderLeft: `4px solid ${isFullyPaid ? '#00A651' : hasBalance ? '#EF4444' : '#E5E7EB'}`,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                                            background: 'linear-gradient(135deg,#00A651,#059669)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 800, fontSize: 13,
                                        }}>{initials}</div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>{s.employee.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                {s.employee.emp_code} · ✓ {s.presentDays}d
                                                {s.absentDays > 0 && <span style={{ color: '#EF4444' }}> · ✗ {s.absentDays}d</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 18, fontWeight: 900, color: '#00A651' }}>{formatCurrency(s.payableAmount)}</div>
                                        <span style={{
                                            background: badge.bg, color: badge.color, borderRadius: 20,
                                            padding: '2px 8px', fontSize: 10, fontWeight: 800,
                                        }}>{badge.label}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
