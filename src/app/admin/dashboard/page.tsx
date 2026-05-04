import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, CalendarCheck, IndianRupee, ClipboardList, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const month = today.getMonth() + 1
    const year = today.getFullYear()

    // ── PARALLEL queries (was sequential before) ──
    const [
        { count: totalEmp },
        { data: todayAtt },
        { count: pendingReq },
        { data: unpaidSalary },
    ] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('attendance_records').select('employee_id, status').eq('date', todayStr),
        supabase.from('attendance_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('monthly_salary').select('balance_amount').eq('month', month).eq('year', year).gt('balance_amount', 0),
    ])

    const presentToday = todayAtt?.filter(r => ['P', '2P', 'OT', '2OT'].includes(r.status)).length ?? 0
    const markedToday = todayAtt?.length ?? 0
    const notMarked = Math.max(0, (totalEmp ?? 0) - markedToday)
    const totalBalance = unpaidSalary?.reduce((s, r) => s + (r.balance_amount ?? 0), 0) ?? 0

    const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Greeting */}
            <div style={{
                background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
                borderRadius: '20px', padding: '20px 18px',
            }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '4px' }}>
                    {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div style={{ color: 'white', fontWeight: 900, fontSize: '22px' }}>
                    Good {today.getHours() < 12 ? 'Morning' : today.getHours() < 17 ? 'Afternoon' : 'Evening'} 👋
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '4px' }}>
                    DDW Attendance — Admin
                </div>

                {/* Today's quick stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '16px' }}>
                    {[
                        { label: 'Present', value: presentToday, color: '#34D399' },
                        { label: 'Not Marked', value: notMarked, color: notMarked > 0 ? '#FCA5A5' : '#34D399' },
                        { label: 'Pending Req', value: pendingReq ?? 0, color: (pendingReq ?? 0) > 0 ? '#FCD34D' : '#34D399' },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '22px', fontWeight: 900, color }}>{value}</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px', lineHeight: 1.2 }}>{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pending requests alert */}
            {(pendingReq ?? 0) > 0 && (
                <Link href="/admin/requests" style={{ textDecoration: 'none' }}>
                    <div style={{
                        background: '#FFFBEB', borderRadius: '14px', padding: '12px 14px',
                        border: '1.5px solid #FDE68A',
                        display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                        <AlertCircle size={18} color="#D97706" />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '13px', color: '#92400E' }}>
                                {pendingReq} pending request{(pendingReq ?? 0) > 1 ? 's' : ''} to review
                            </div>
                            <div style={{ fontSize: '11px', color: '#B45309', marginTop: '1px' }}>Tap to review →</div>
                        </div>
                    </div>
                </Link>
            )}

            {/* Quick actions */}
            <div>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Quick Actions
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                        { href: '/admin/attendance/mark', icon: CalendarCheck, label: 'Mark Attendance', sub: 'Today\'s attendance', color: '#00A651', bg: '#F0FDF4' },
                        { href: '/admin/salary', icon: IndianRupee, label: 'Salary Sheet', sub: `${MONTH_NAMES[month]} ${year}`, color: '#2563EB', bg: '#EFF6FF' },
                        { href: '/admin/employees', icon: Users, label: 'Employees', sub: `${totalEmp ?? 0} active`, color: '#7C3AED', bg: '#F5F3FF' },
                        { href: '/admin/requests', icon: ClipboardList, label: 'Requests', sub: `${pendingReq ?? 0} pending`, color: '#D97706', bg: '#FFFBEB' },
                    ].map(({ href, icon: Icon, label, sub, color, bg }) => (
                        <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: bg, borderRadius: '16px', padding: '16px 14px',
                                border: `1px solid ${color}22`,
                                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                            }}>
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: '10px',
                                    background: `${color}18`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '10px',
                                }}>
                                    <Icon size={20} color={color} />
                                </div>
                                <div style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>{label}</div>
                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{sub}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Salary balance alert */}
            {totalBalance > 0 && (
                <Link href="/admin/salary" style={{ textDecoration: 'none' }}>
                    <div style={{
                        background: '#FEF2F2', borderRadius: '14px', padding: '12px 14px',
                        border: '1.5px solid #FECACA',
                        display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                        <IndianRupee size={18} color="#EF4444" />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '13px', color: '#991B1B' }}>
                                ₹{totalBalance.toLocaleString('en-IN')} salary balance due
                            </div>
                            <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '1px' }}>{MONTH_NAMES[month]} {year} — Tap to view →</div>
                        </div>
                    </div>
                </Link>
            )}

            {/* Settings shortcut */}
            <Link href="/admin/settings" style={{ textDecoration: 'none' }}>
                <div style={{
                    background: 'white', borderRadius: '14px', padding: '14px',
                    border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>⚙️ Attendance Settings</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                            Custom types, OT rules, salary rules
                        </div>
                    </div>
                    <div style={{ fontSize: '18px', color: '#D1D5DB' }}>›</div>
                </div>
            </Link>
        </div>
    )
}