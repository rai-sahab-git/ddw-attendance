import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
    const supabase = await createClient()

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']
    const dayName = today.toLocaleDateString('en-IN', { weekday: 'long' })
    const dateDisplay = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

    const { count: totalEmployees } = await supabase
        .from('employees').select('*', { count: 'exact', head: true }).eq('is_active', true)

    const { data: todayAtt } = await supabase
        .from('attendance_records').select('status').eq('date', todayStr)

    const presentToday = todayAtt?.filter(r => ['P', '2P', 'OT', '2OT'].includes(r.status)).length ?? 0
    const absentToday = todayAtt?.filter(r => r.status === 'A').length ?? 0
    const total = totalEmployees ?? 0

    const { count: pendingRequests } = await supabase
        .from('attendance_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')

    const hour = today.getHours()
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
    const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙'

    const presentPct = total > 0 ? Math.round((presentToday / total) * 100) : 0

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Greeting */}
            <div style={{ paddingTop: '4px' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827' }}>
                    {greeting}! {greetEmoji}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                    {dayName}, {dateDisplay}
                </div>
            </div>

            {/* Today Stats Card */}
            <div style={{
                background: 'linear-gradient(135deg, #00A651 0%, #007A3D 100%)',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 8px 24px rgba(0,166,81,0.3)',
                color: 'white',
            }}>
                <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Today's Attendance
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', margin: '8px 0' }}>
                    <div style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1 }}>{presentToday}</div>
                    <div style={{ fontSize: '20px', fontWeight: 600, opacity: 0.7, paddingBottom: '6px' }}>/ {total}</div>
                </div>

                {/* Progress bar */}
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '999px', height: '6px', marginBottom: '12px' }}>
                    <div style={{
                        width: `${presentPct}%`, height: '100%',
                        background: 'white', borderRadius: '999px',
                        transition: 'width 0.5s ease',
                    }} />
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.15)', borderRadius: '12px',
                        padding: '10px 16px', flex: 1, textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '22px', fontWeight: 800 }}>{presentToday}</div>
                        <div style={{ fontSize: '11px', opacity: 0.8 }}>Present</div>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.15)', borderRadius: '12px',
                        padding: '10px 16px', flex: 1, textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '22px', fontWeight: 800 }}>{absentToday}</div>
                        <div style={{ fontSize: '11px', opacity: 0.8 }}>Absent</div>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.15)', borderRadius: '12px',
                        padding: '10px 16px', flex: 1, textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '22px', fontWeight: 800 }}>{total - (todayAtt?.length ?? 0)}</div>
                        <div style={{ fontSize: '11px', opacity: 0.8 }}>Unmarked</div>
                    </div>
                </div>
            </div>

            {/* Mark Attendance CTA */}
            <Link href="/admin/attendance/mark" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'white', borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                textDecoration: 'none',
                border: '2px solid #E8F8EF',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '44px', height: '44px',
                        background: '#E8F8EF', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{ fontSize: '22px' }}>✅</span>
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '15px' }}>Mark Today's Attendance</div>
                        <div style={{ fontSize: '12px', color: '#00A651', marginTop: '2px' }}>
                            {todayAtt?.length ? `${todayAtt.length}/${total} marked` : 'Tap to start marking'}
                        </div>
                    </div>
                </div>
                <div style={{
                    width: '32px', height: '32px',
                    background: '#00A651', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>
            </Link>

            {/* Quick Actions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

                {[
                    { href: '/admin/attendance', emoji: '📅', label: 'Monthly Sheet', sub: `${monthNames[currentMonth]} ${currentYear}`, bg: '#EFF6FF', accent: '#3B82F6' },
                    { href: '/admin/employees', emoji: '👥', label: 'Employees', sub: `${total} active`, bg: '#F5F3FF', accent: '#8B5CF6' },
                    { href: '/admin/salary', emoji: '💰', label: 'Salary', sub: `${monthNames[currentMonth]} calculation`, bg: '#FFFBEB', accent: '#F59E0B' },
                    { href: '/admin/requests', emoji: '🔔', label: 'Requests', sub: pendingRequests ? `${pendingRequests} pending` : 'All clear', bg: pendingRequests ? '#FFF7ED' : '#F0FDF4', accent: pendingRequests ? '#F97316' : '#00A651' },
                ].map(({ href, emoji, label, sub, bg, accent }) => (
                    <Link key={href} href={href} style={{
                        background: 'white', borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        textDecoration: 'none',
                        border: `1px solid ${bg}`,
                        display: 'block',
                    }}>
                        <div style={{
                            width: '40px', height: '40px',
                            background: bg, borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px', marginBottom: '10px',
                        }}>
                            {emoji}
                        </div>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '14px' }}>{label}</div>
                        <div style={{ fontSize: '11px', color: accent, marginTop: '3px', fontWeight: 600 }}>{sub}</div>
                    </Link>
                ))}
            </div>

            {/* Month banner */}
            <div style={{
                background: 'white', borderRadius: '16px',
                padding: '14px 16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div>
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: '14px' }}>
                        {monthNames[currentMonth]} {currentYear}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>Current billing month</div>
                </div>
                <Link href="/admin/salary" style={{
                    background: '#E8F8EF', color: '#00A651',
                    fontWeight: 700, fontSize: '12px',
                    padding: '8px 14px', borderRadius: '10px',
                    textDecoration: 'none',
                }}>
                    View Salary →
                </Link>
            </div>

        </div>
    )
}