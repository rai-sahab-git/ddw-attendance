import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { getEmployeeSession } from '@/lib/employee-auth'

export default async function EmployeeDashboard() {
    const emp = await getEmployeeSession()
    if (!emp) redirect('/login')

    const supabase = await createClient()
    const today = new Date()
    const month = today.getMonth() + 1
    const year = today.getFullYear()
    const todayStr = today.toISOString().split('T')[0]

    const [{ data: todayAtt }, { data: monthAtt }, { data: salaryRecord }, { data: advances }] =
        await Promise.all([
            supabase.from('attendance_records').select('*').eq('employee_id', emp.id).eq('date', todayStr).single(),
            supabase.from('attendance_records').select('*').eq('employee_id', emp.id).eq('month', month).eq('year', year),
            supabase.from('monthly_salary').select('*').eq('employee_id', emp.id).eq('month', month).eq('year', year).single(),
            supabase.from('advance_payments').select('*').eq('employee_id', emp.id).order('date', { ascending: false }).limit(3),
        ])

    const presentDays = monthAtt?.filter(r => ['P', '2P', 'OT', '2OT'].includes(r.status)).length ?? 0
    const absentDays = monthAtt?.filter(r => r.status === 'A').length ?? 0
    const initials = emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    const todayStatus = todayAtt?.status

    const statusColors: Record<string, { bg: string; color: string }> = {
        P: { bg: '#D1FAE5', color: '#059669' },
        '2P': { bg: '#DBEAFE', color: '#2563EB' },
        A: { bg: '#FEE2E2', color: '#DC2626' },
        H: { bg: '#FEF3C7', color: '#D97706' },
        OT: { bg: '#FFEDD5', color: '#EA580C' },
        '2OT': { bg: '#EDE9FE', color: '#7C3AED' },
        L: { bg: '#FCE7F3', color: '#DB2777' },
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Profile hero */}
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: '20px', padding: '20px', color: 'white',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <div style={{
                        width: '56px', height: '56px',
                        background: 'rgba(255,255,255,0.15)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: '20px',
                    }}>
                        {initials}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '18px' }}>{emp.name}</div>
                        <div style={{ opacity: 0.6, fontSize: '12px', marginTop: '2px' }}>{emp.emp_code}</div>
                    </div>
                    {todayStatus && (
                        <div style={{
                            background: statusColors[todayStatus]?.bg ?? '#F3F4F6',
                            color: statusColors[todayStatus]?.color ?? '#374151',
                            fontWeight: 800, fontSize: '14px',
                            padding: '6px 14px', borderRadius: '999px',
                        }}>
                            {todayStatus}
                        </div>
                    )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    {[
                        { label: 'Present', value: presentDays, color: '#34D399' },
                        { label: 'Absent', value: absentDays, color: '#F87171' },
                        { label: 'Salary', value: formatCurrency(emp.monthly_salary), color: '#FCD34D' },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 800, color }}>{value}</div>
                            <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '2px' }}>{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Salary card */}
            <Link href="/employee/salary" style={{ textDecoration: 'none' }}>
                <div style={{
                    background: 'white', borderRadius: '18px', padding: '16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    border: '1px solid #F0FDF4',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', background: '#FFFBEB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>💰</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>{getMonthName(month)} Salary</div>
                            <div style={{ fontSize: '12px', color: (salaryRecord?.balance_amount ?? 0) > 0 ? '#D97706' : '#059669', fontWeight: 600, marginTop: '2px' }}>
                                {salaryRecord ? salaryRecord.balance_amount > 0 ? `Balance: ${formatCurrency(salaryRecord.balance_amount)}` : '✓ Salary Received' : 'Tap to view breakdown'}
                            </div>
                        </div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '18px', color: '#111827' }}>
                        {formatCurrency(salaryRecord?.payable_amount ?? emp.monthly_salary)}
                    </div>
                </div>
            </Link>

            {/* Quick links */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                    { href: '/employee/attendance', emoji: '📅', label: 'My Attendance', sub: `${getMonthName(month)}`, bg: '#EFF6FF', accent: '#3B82F6' },
                    { href: '/employee/requests/new', emoji: '📝', label: 'Raise Request', sub: 'Correction / Leave', bg: '#F5F3FF', accent: '#8B5CF6' },
                ].map(({ href, emoji, label, sub, bg, accent }) => (
                    <Link key={href} href={href} style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textDecoration: 'none', display: 'block', border: `1px solid ${bg}` }}>
                        <div style={{ width: '40px', height: '40px', background: bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '10px' }}>{emoji}</div>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '14px' }}>{label}</div>
                        <div style={{ fontSize: '11px', color: accent, marginTop: '3px', fontWeight: 600 }}>{sub}</div>
                    </Link>
                ))}
            </div>

            {/* Advances */}
            {advances && advances.length > 0 && (
                <div style={{ background: 'white', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', fontWeight: 700, fontSize: '14px', color: '#111827' }}>Recent Advances 💳</div>
                    {advances.map((adv: any) => (
                        <div key={adv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #F9FAFB' }}>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{adv.description || 'Advance'}</div>
                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>{new Date(adv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '15px', color: '#8B5CF6' }}>₹{adv.amount.toLocaleString('en-IN')}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}