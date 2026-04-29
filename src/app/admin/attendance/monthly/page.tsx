import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { ATTENDANCE_COLORS, cn, getMonthName } from '@/lib/utils'
import type { AttendanceStatus } from '@/types'

export default async function MonthlyAttendancePage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string; year?: string }>
}) {
    const params = await searchParams
    const supabase = await createClient()

    const today = new Date()
    const month = parseInt(params.month ?? String(today.getMonth() + 1))
    const year = parseInt(params.year ?? String(today.getFullYear()))

    // Calculate prev/next month
    const prevDate = new Date(year, month - 2, 1)
    const nextDate = new Date(year, month, 1)

    // Days in month
    const daysInMonth = new Date(year, month, 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    const [{ data: employees }, { data: attendance }] = await Promise.all([
        supabase.from('employees').select('id, name, emp_code').eq('is_active', true).order('emp_code'),
        supabase.from('attendance_records')
            .select('employee_id, date, status')
            .eq('month', month)
            .eq('year', year),
    ])

    // Build lookup: employeeId -> day -> status
    const lookup: Record<string, Record<number, AttendanceStatus>> = {}
    attendance?.forEach(r => {
        const day = new Date(r.date).getDate()
        if (!lookup[r.employee_id]) lookup[r.employee_id] = {}
        lookup[r.employee_id][day] = r.status as AttendanceStatus
    })

    return (
        <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/admin/attendance" className="p-2 rounded-xl hover:bg-gray-100">
                    <ArrowLeft size={20} className="text-gray-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-gray-900">
                        {getMonthName(month)} {year}
                    </h1>
                    <p className="text-xs text-gray-500">{employees?.length ?? 0} employees</p>
                </div>
                {/* Month navigation */}
                <div className="flex gap-1">
                    <Link
                        href={`/admin/attendance/monthly?month=${prevDate.getMonth() + 1}&year=${prevDate.getFullYear()}`}
                        className="p-2 rounded-xl hover:bg-gray-100"
                    >
                        <ChevronLeft size={18} className="text-gray-600" />
                    </Link>
                    <Link
                        href={`/admin/attendance/monthly?month=${nextDate.getMonth() + 1}&year=${nextDate.getFullYear()}`}
                        className="p-2 rounded-xl hover:bg-gray-100"
                    >
                        <ChevronRight size={18} className="text-gray-600" />
                    </Link>
                </div>
            </div>

            {/* Color Legend */}
            <div className="flex gap-2 flex-wrap">
                {(['P', '2P', 'A', 'H', 'OT', 'L'] as AttendanceStatus[]).map(s => (
                    <span key={s} className={cn('text-xs font-bold px-2 py-0.5 rounded-md', ATTENDANCE_COLORS[s])}>
                        {s}
                    </span>
                ))}
            </div>

            {/* Grid - horizontal scroll */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="text-xs border-collapse" style={{ minWidth: `${daysInMonth * 32 + 120}px` }}>
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="sticky left-0 bg-gray-50 text-left px-3 py-2.5 text-gray-600 font-semibold w-28 border-b border-gray-200">
                                    Employee
                                </th>
                                {days.map(d => {
                                    const date = new Date(year, month - 1, d)
                                    const isSun = date.getDay() === 0
                                    const isSat = date.getDay() === 6
                                    const isToday =
                                        d === today.getDate() &&
                                        month === today.getMonth() + 1 &&
                                        year === today.getFullYear()
                                    return (
                                        <th
                                            key={d}
                                            className={cn(
                                                'text-center py-2 w-8 border-b border-gray-200 font-semibold',
                                                isSun || isSat ? 'text-red-400' : 'text-gray-600',
                                                isToday ? 'bg-green-50 text-green-700' : ''
                                            )}
                                        >
                                            {d}
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {employees?.map((emp, idx) => (
                                <tr
                                    key={emp.id}
                                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                                >
                                    <td className={cn(
                                        'sticky left-0 px-3 py-2 border-b border-gray-100 font-medium text-gray-800',
                                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                    )}>
                                        <p className="truncate w-24">{emp.name.split(' ')[0]}</p>
                                        <p className="text-gray-400 text-xs">{emp.emp_code}</p>
                                    </td>
                                    {days.map(d => {
                                        const status = lookup[emp.id]?.[d]
                                        return (
                                            <td key={d} className="text-center py-1.5 border-b border-gray-100">
                                                {status ? (
                                                    <span className={cn(
                                                        'inline-block text-xs font-bold px-1 py-0.5 rounded',
                                                        ATTENDANCE_COLORS[status]
                                                    )}>
                                                        {status}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit note */}
            <p className="text-xs text-center text-gray-400">
                To edit attendance, use Mark Attendance for today or contact records
            </p>

        </div>
    )
}