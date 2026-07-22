import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthName } from '@/lib/utils'
import AttendanceGrid from './AttendanceGrid'
import ExportButton from '@/components/ExportButton'

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const supabase = await createClient()
  const sp = await searchParams
  const today = new Date()
  const month = parseInt(sp.month ?? String(today.getMonth() + 1))
  const year = parseInt(sp.year ?? String(today.getFullYear()))

  const prevDate = new Date(year, month - 2, 1)
  const nextDate = new Date(year, month, 1)
  const todayStr = today.toISOString().split('T')[0]

  const [{ data: employees }, { data: attendance }, { count: totalEmp }, { data: settings }] = await Promise.all([
    supabase.from('employees').select('*').eq('is_active', true).order('emp_code'),
    supabase.from('attendance_records').select('*').eq('month', month).eq('year', year),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('attendance_settings').select('*').eq('is_active', true).order('sort_order'),
  ])

  const todayPresent = attendance?.filter(r =>
    r.date === todayStr && ['P', '2P', 'OT', '2OT'].includes(r.status)
  ).length ?? 0

  const daysInMonth = new Date(year, month, 0).getDate()

  return (
    <div className="att-layout">
      <div className="page-head">
        <div>
          <h1>Attendance</h1>
          <p>Monthly grid view</p>
        </div>
        <div className="page-head__actions">
          <ExportButton month={month} year={year} label="Excel" />
          <Link href="/admin/attendance/mark" className="btn btn--primary">
            <CalendarCheck size={16} /> Mark Today
          </Link>
        </div>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Total Employees', value: totalEmp ?? 0, bg: '#F0FDF4', color: '#059669' },
          { label: 'Today Present', value: todayPresent, bg: '#EFF6FF', color: '#2563EB' },
          { label: 'Days in Month', value: daysInMonth, bg: '#FFF7ED', color: '#EA580C' },
        ].map(({ label, value, bg, color }) => (
          <div key={label} className="kpi-card" style={{ background: bg, textAlign: 'center' }}>
            <div className="kpi-card__value" style={{ color }}>{value}</div>
            <div className="kpi-card__label">{label}</div>
          </div>
        ))}
      </div>

      <div className="month-strip">
        <Link href={`/admin/attendance?month=${prevDate.getMonth() + 1}&year=${prevDate.getFullYear()}`}>
          <ChevronLeft size={18} />
        </Link>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{getMonthName(month)} {year}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{daysInMonth} days</div>
        </div>
        <Link href={`/admin/attendance?month=${nextDate.getMonth() + 1}&year=${nextDate.getFullYear()}`}>
          <ChevronRight size={18} />
        </Link>
      </div>

      <div className="att-grid-shell" style={{ minWidth: 0 }}>
        <AttendanceGrid
          employees={employees ?? []}
          attendance={attendance ?? []}
          month={month}
          year={year}
          daysInMonth={daysInMonth}
          today={todayStr}
          settings={settings ?? undefined}
        />
      </div>
    </div>
  )
}
