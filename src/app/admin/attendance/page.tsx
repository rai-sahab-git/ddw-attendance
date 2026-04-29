import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarCheck, ChevronRight } from 'lucide-react'
import { getMonthName } from '@/lib/utils'

export default async function AttendancePage() {
  const supabase = await createClient()

  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()
  const todayStr = today.toISOString().split('T')[0]

  // Today's attendance count
  const { count: markedToday } = await supabase
    .from('attendance_records')
    .select('*', { count: 'exact', head: true })
    .eq('date', todayStr)

  const { count: totalEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Last 6 months for quick access
  const months = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1)
    months.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: getMonthName(d.getMonth() + 1),
    })
  }

  return (
    <div className="space-y-4">

      <div>
        <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
        <p className="text-sm text-gray-500">Mark and view attendance records</p>
      </div>

      {/* Mark Today */}
      <Link
        href="/admin/attendance/mark"
        className="flex items-center justify-between bg-green-600 hover:bg-green-700 text-white rounded-2xl p-4 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <CalendarCheck size={20} />
          </div>
          <div>
            <p className="font-semibold">Mark Today's Attendance</p>
            <p className="text-xs text-green-100">
              {markedToday
                ? `${markedToday}/${totalEmployees} marked`
                : 'Not started yet'}
            </p>
          </div>
        </div>
        <ChevronRight size={20} />
      </Link>

      {/* Monthly Sheets */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Monthly Sheets
        </h2>
        <div className="space-y-2">
          {months.map(({ month, year, label }) => (
            <Link
              key={`${month}-${year}`}
              href={`/admin/attendance/monthly?month=${month}&year=${year}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between hover:border-green-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">
                    {label.slice(0, 3).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{label} {year}</p>
                  <p className="text-xs text-gray-500">
                    {month === currentMonth && year === currentYear
                      ? 'Current month'
                      : 'View records'}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}