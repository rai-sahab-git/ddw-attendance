import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, CalendarCheck, IndianRupee, ClipboardList, AlertCircle, Settings } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function DashboardPage() {
    const supabase = await createClient()
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const month = today.getMonth() + 1
    const year = today.getFullYear()

    const [
        { count: totalEmp },
        { data: todayAtt },
        { count: pendingReq },
        { data: unpaidSalary },
        { data: recentRequests },
    ] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('attendance_records').select('employee_id, status').eq('date', todayStr),
        supabase.from('attendance_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('monthly_salary').select('balance_amount').eq('month', month).eq('year', year).gt('balance_amount', 0),
        supabase
            .from('attendance_requests')
            .select('id, request_type, status, date_from, created_at, employees(name, emp_code)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(5),
    ])

    const presentToday = todayAtt?.filter(r => ['P', '2P', 'OT', '2OT'].includes(r.status)).length ?? 0
    const markedToday = todayAtt?.length ?? 0
    const notMarked = Math.max(0, (totalEmp ?? 0) - markedToday)
    const totalBalance = unpaidSalary?.reduce((s, r) => s + (r.balance_amount ?? 0), 0) ?? 0

    const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const greeting = today.getHours() < 12 ? 'Morning' : today.getHours() < 17 ? 'Afternoon' : 'Evening'

    const actions = [
        { href: '/admin/attendance/mark', icon: CalendarCheck, label: 'Mark Attendance', sub: "Today's attendance", color: 'var(--green-primary)', tint: 'tint-success' },
        { href: '/admin/salary', icon: IndianRupee, label: 'Salary Sheet', sub: `${MONTH_NAMES[month]} ${year}`, color: 'var(--tint-info-fg)', tint: 'tint-info' },
        { href: '/admin/employees', icon: Users, label: 'Employees', sub: `${totalEmp ?? 0} active`, color: 'var(--tint-purple-fg)', tint: 'tint-purple' },
        { href: '/admin/requests', icon: ClipboardList, label: 'Requests', sub: `${pendingReq ?? 0} pending`, color: 'var(--tint-warn-fg)', tint: 'tint-warn' },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="page-head">
                <div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                        {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h1>Good {greeting}</h1>
                    <p>DDW Attendance — Admin</p>
                </div>
                <div className="page-head__actions">
                    <Link href="/admin/attendance/mark" className="btn btn--primary">
                        <CalendarCheck size={16} /> Mark Today
                    </Link>
                </div>
            </div>

            <div className="kpi-row">
                {[
                    { label: 'Present today', value: presentToday, color: '#059669' },
                    { label: 'Not marked', value: notMarked, color: notMarked > 0 ? '#DC2626' : '#059669' },
                    { label: 'Pending requests', value: pendingReq ?? 0, color: (pendingReq ?? 0) > 0 ? '#D97706' : '#059669' },
                    { label: 'Balance due', value: formatCurrency(totalBalance), color: totalBalance > 0 ? '#DC2626' : '#059669' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="kpi-card">
                        <div className="kpi-card__value" style={{ color }}>{value}</div>
                        <div className="kpi-card__label">{label}</div>
                    </div>
                ))}
            </div>

            {(pendingReq ?? 0) > 0 && (
                <Link href="/admin/requests" style={{ textDecoration: 'none' }}>
                    <div className="tint-warn" style={{
                        borderRadius: 14, padding: '12px 14px',
                        border: '1.5px solid var(--border)',
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <AlertCircle size={18} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: 13 }}>
                                {pendingReq} pending request{(pendingReq ?? 0) > 1 ? 's' : ''} to review
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 1 }}>Open requests →</div>
                        </div>
                    </div>
                </Link>
            )}

            <div className="dash-grid">
                <div>
                    <div style={{ fontWeight: 800, fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Quick Actions
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {actions.map(({ href, icon: Icon, label, sub, color, tint }) => (
                            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                                <div className={tint} style={{
                                    borderRadius: 16, padding: '16px 14px',
                                    border: '1px solid var(--border)', height: '100%',
                                }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 10,
                                        background: 'var(--panel)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: 10,
                                    }}>
                                        <Icon size={20} color={color} />
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: 14 }}>{label}</div>
                                    <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{sub}</div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <Link href="/admin/settings" style={{ textDecoration: 'none', display: 'block', marginTop: 12 }}>
                        <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Settings size={18} color="#64748B" />
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>Attendance Settings</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Custom types, OT rules, salary rules</div>
                                </div>
                            </div>
                            <span style={{ color: '#D1D5DB', fontSize: 18 }}>›</span>
                        </div>
                    </Link>
                </div>

                <div className="panel" style={{ minHeight: 200 }}>
                    <div className="panel__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Pending requests</span>
                        <Link href="/admin/requests" style={{ color: '#00A651', fontSize: 12, fontWeight: 700, textDecoration: 'none', textTransform: 'none', letterSpacing: 0 }}>
                            View all
                        </Link>
                    </div>
                    <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(!recentRequests || recentRequests.length === 0) && (
                            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                                No pending requests
                            </div>
                        )}
                        {recentRequests?.map((req) => {
                            const emp = req.employees as unknown as { name?: string; emp_code?: string } | null
                            return (
                                <Link
                                    key={req.id}
                                    href="/admin/requests"
                                    style={{
                                        textDecoration: 'none',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 12px',
                                        borderRadius: 12,
                                        background: 'var(--gray-50)',
                                        border: '1px solid var(--border)',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                                            {emp?.name ?? 'Employee'}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                            {req.request_type?.replace('_', ' ')} · {req.date_from}
                                        </div>
                                    </div>
                                    <span className="tint-warn" style={{
                                        fontSize: 10, fontWeight: 800,
                                        padding: '3px 8px', borderRadius: 999,
                                        textTransform: 'uppercase',
                                    }}>
                                        Pending
                                    </span>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
