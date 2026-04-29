import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthName } from '@/lib/utils'
import { getEmployeeSession } from '@/lib/employee-auth'

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    P: { bg: '#D1FAE5', color: '#059669', label: 'P' },
    '2P': { bg: '#DBEAFE', color: '#2563EB', label: '2P' },
    A: { bg: '#FEE2E2', color: '#DC2626', label: 'A' },
    H: { bg: '#FEF3C7', color: '#D97706', label: 'H' },
    OT: { bg: '#FFEDD5', color: '#EA580C', label: 'OT' },
    '2OT': { bg: '#EDE9FE', color: '#7C3AED', label: '2OT' },
    L: { bg: '#FCE7F3', color: '#DB2777', label: 'L' },
    HD: { bg: '#F3F4F6', color: '#6B7280', label: 'H' },
    WO: { bg: '#F9FAFB', color: '#9CA3AF', label: 'WO' },
}

export default async function EmployeeAttendancePage({
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

    const { data: attendance } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', emp.id)
        .eq('month', month)
        .eq('year', year)

    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDay = new Date(year, month - 1, 1).getDay()
    const attMap: Record<number, string> = {}
    attendance?.forEach(r => { attMap[new Date(r.date).getDate()] = r.status })

    const presentDays = attendance?.filter(r => ['P', '2P', 'OT', '2OT'].includes(r.status)).length ?? 0
    const absentDays = attendance?.filter(r => r.status === 'A').length ?? 0
    const halfDays = attendance?.filter(r => r.status === 'H').length ?? 0
    const extraDays = attendance?.filter(r => ['2P', '2OT'].includes(r.status)).length ?? 0
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: '20px', padding: '18px', color: 'white' }}>
                <div style={{ fontWeight: 800, fontSize: '18px' }}>My Attendance</div>
                <div style={{ opacity: 0.6, fontSize: '12px' }}>{emp.name} • {emp.emp_code}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
                    <Link href={`/employee/attendance?month=${prevDate.getMonth() + 1}&year=${prevDate.getFullYear()}`}
                        style={{ color: 'white', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 10px', textDecoration: 'none' }}>
                        <ChevronLeft size={16} />
                    </Link>
                    <span style={{ fontWeight: 700 }}>{getMonthName(month)} {year}</span>
                    <Link href={`/employee/attendance?month=${nextDate.getMonth() + 1}&year=${nextDate.getFullYear()}`}
                        style={{ color: 'white', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 10px', textDecoration: 'none' }}>
                        <ChevronRight size={16} />
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                {[
                    { label: 'Present', value: presentDays, bg: '#D1FAE5', color: '#059669' },
                    { label: 'Absent', value: absentDays, bg: '#FEE2E2', color: '#DC2626' },
                    { label: 'Half Day', value: halfDays, bg: '#FEF3C7', color: '#D97706' },
                    { label: 'Extra', value: extraDays, bg: '#DBEAFE', color: '#2563EB' },
                ].map(({ label, value, bg, color }) => (
                    <div key={label} style={{ background: 'white', borderRadius: '14px', padding: '12px 8px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <div style={{ fontSize: '22px', fontWeight: 800, color }}>{value}</div>
                        <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Calendar */}
            <div style={{ background: 'white', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '8px' }}>
                    {dayLabels.map((d, i) => (
                        <div key={i} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: i === 0 || i === 6 ? '#EF4444' : '#9CA3AF', padding: '4px 0' }}>{d}</div>
                    ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px' }}>
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1
                        const status = attMap[day]
                        const style = status ? STATUS_STYLE[status] : null
                        const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear()
                        const isWeekend = new Date(year, month - 1, day).getDay() === 0 || new Date(year, month - 1, day).getDay() === 6
                        return (
                            <div key={day} style={{
                                borderRadius: '10px', padding: '4px 2px', textAlign: 'center', minHeight: '48px',
                                background: style ? style.bg : isWeekend ? '#F9FAFB' : '#F3F4F6',
                                border: isToday ? '2px solid #1a1a2e' : '2px solid transparent',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                            }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: isWeekend ? '#EF4444' : '#374151' }}>{day}</span>
                                {status && <span style={{ fontSize: '9px', fontWeight: 800, color: style?.color }}>{style?.label}</span>}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Legend */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827', marginBottom: '10px' }}>Legend</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {Object.entries(STATUS_STYLE).filter(([k]) => !['HD', 'WO'].includes(k)).map(([key, val]) => (
                        <div key={key} style={{ background: val.bg, color: val.color, borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: 700 }}>{key}</div>
                    ))}
                </div>
            </div>

            <Link href="/employee/requests/new" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: 'linear-gradient(135deg,#1a1a2e,#16213e)', color: 'white',
                padding: '14px', borderRadius: '14px', textDecoration: 'none', fontWeight: 700,
            }}>
                📝 Request Attendance Correction
            </Link>
        </div>
    )
}