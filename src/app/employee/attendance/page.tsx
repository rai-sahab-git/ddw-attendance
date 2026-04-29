import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthName } from '@/lib/utils'

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

    const { data: attendance } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', emp.id)
        .eq('month', month)
        .eq('year', year)

    // Build calendar
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDay = new Date(year, month - 1, 1).getDay() // 0=Sun
    const attMap: Record<string, string> = {}
    attendance?.forEach(r => {
        const day = new Date(r.date).getDate()
        attMap[day] = r.status
    })

    const presentDays = attendance?.filter(r => ['P', '2P', 'OT', '2OT'].includes(r.status)).length ?? 0
    const absentDays = attendance?.filter(r => r.status === 'A').length ?? 0
    const halfDays = attendance?.filter(r => r.status === 'H').length ?? 0
    const extraDays = attendance?.filter(r => ['2P', '2OT'].includes(r.status)).length ?? 0

    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827' }}>My Attendance</div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>{emp.name} • {emp.emp_code}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <Link href={`/employee/attendance?month=${prevDate.getMonth() + 1}&year=${prevDate.getFullYear()}`}
                        style={{ width: '32px', height: '32px', background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        <ChevronLeft size={16} color="#374151" />
                    </Link>
                    <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', padding: '6px 12px', fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                        {getMonthName(month).slice(0, 3)} {year}
                    </div>
                    <Link href={`/employee/attendance?month=${nextDate.getMonth() + 1}&year=${nextDate.getFullYear()}`}
                        style={{ width: '32px', height: '32px', background: 'white', borderRadius: '10px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        <ChevronRight size={16} color="#374151" />
                    </Link>
                </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                {[
                    { label: 'Present', value: presentDays, bg: '#D1FAE5', color: '#059669' },
                    { label: 'Absent', value: absentDays, bg: '#FEE2E2', color: '#DC2626' },
                    { label: 'Half Day', value: halfDays, bg: '#FEF3C7', color: '#D97706' },
                    { label: 'Extra', value: extraDays, bg: '#DBEAFE', color: '#2563EB' },
                ].map(({ label, value, bg, color }) => (
                    <div key={label} style={{
                        background: bg, borderRadius: '14px',
                        padding: '12px 8px', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '22px', fontWeight: 900, color }}>{value}</div>
                        <div style={{ fontSize: '10px', color, opacity: 0.8, marginTop: '2px', fontWeight: 600 }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Calendar */}
            <div style={{
                background: 'white', borderRadius: '20px',
                padding: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
                {/* Day headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '8px' }}>
                    {dayLabels.map((d, i) => (
                        <div key={i} style={{
                            textAlign: 'center', fontSize: '11px', fontWeight: 700,
                            color: i === 0 || i === 6 ? '#EF4444' : '#9CA3AF',
                            padding: '4px 0',
                        }}>
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px' }}>
                    {/* Empty cells for first week offset */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`e-${i}`} />
                    ))}

                    {/* Day cells */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1
                        const status = attMap[day]
                        const style = status ? STATUS_STYLE[status] : null
                        const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear()
                        const isWeekend = new Date(year, month - 1, day).getDay() === 0 || new Date(year, month - 1, day).getDay() === 6

                        return (
                            <div key={day} style={{
                                aspectRatio: '1',
                                borderRadius: '10px',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                background: style ? style.bg : isWeekend ? '#F9FAFB' : 'transparent',
                                border: isToday ? '2px solid #00A651' : '2px solid transparent',
                                position: 'relative',
                            }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: isToday ? 800 : status ? 700 : 400,
                                    color: style ? style.color : isWeekend ? '#D1D5DB' : '#374151',
                                }}>
                                    {day}
                                </div>
                                {status && (
                                    <div style={{
                                        fontSize: '8px', fontWeight: 800,
                                        color: style?.color,
                                        lineHeight: 1,
                                    }}>
                                        {style?.label}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Legend */}
            <div style={{
                background: 'white', borderRadius: '16px', padding: '14px 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Legend
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {Object.entries(STATUS_STYLE).filter(([k]) => !['HD', 'WO'].includes(k)).map(([key, val]) => (
                        <div key={key} style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            background: val.bg, borderRadius: '8px', padding: '4px 10px',
                        }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: val.color }}>{key}</span>
                            <span style={{ fontSize: '10px', color: val.color, opacity: 0.8 }}>{val.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Request correction CTA */}
            <Link href="/employee/requests/new" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: 'white', border: '2px dashed #D1D5DB',
                borderRadius: '16px', padding: '14px',
                textDecoration: 'none', color: '#6B7280',
                fontWeight: 600, fontSize: '14px',
            }}>
                <span style={{ fontSize: '18px' }}>📝</span> Request Attendance Correction
            </Link>

        </div>
    )
}