import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthName } from '@/lib/utils'
import AttendanceGrid from './AttendanceGrid'
import ExportButton from '@/components/ExportButton'  // ← NEW

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

  const [{ data: employees }, { data: attendance }, { count: totalEmp }] = await Promise.all([
    supabase.from('employees').select('*').eq('is_active', true).order('emp_code'),
    supabase.from('attendance_records').select('*').eq('month', month).eq('year', year),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const todayPresent = attendance?.filter(r =>
    r.date === todayStr && ['P', '2P', 'OT', '2OT'].includes(r.status)
  ).length ?? 0

  const daysInMonth = new Date(year, month, 0).getDate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '22px', color: '#111827', margin: 0 }}>Attendance</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>Monthly grid view</p>
        </div>

        {/* ↓ MARK TODAY + EXPORT — header ke right side mein */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* ↓ EXPORT BUTTON — NEW */}
          <ExportButton month={month} year={year} label="Excel" />

          <Link href="/admin/attendance/mark" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'linear-gradient(135deg,#00A651,#059669)', color: 'white',
            padding: '10px 16px', borderRadius: '12px', textDecoration: 'none',
            fontWeight: 700, fontSize: '13px', boxShadow: '0 2px 8px rgba(0,166,81,0.3)',
          }}>
            <CalendarCheck size={16} /> Mark Today
          </Link>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        {[
          { label: 'Total Employees', value: totalEmp ?? 0, bg: '#F0FDF4', color: '#059669' },
          { label: 'Today Present', value: todayPresent, bg: '#EFF6FF', color: '#2563EB' },
          { label: 'Days in Month', value: daysInMonth, bg: '#FFF7ED', color: '#EA580C' },
        ].map(({ label, value, bg, color }) => (
          <div key={label} style={{ background: bg, borderRadius: '14px', padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '26px', fontWeight: 900, color }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', lineHeight: '1.3' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ─── Month Navigator ─── */}
      <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/admin/attendance?month=${prevDate.getMonth() + 1}&year=${prevDate.getFullYear()}`}
          style={{ color: 'white', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={18} />
        </Link>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '18px', color: 'white' }}>{getMonthName(month)} {year}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{daysInMonth} days</div>
        </div>
        <Link href={`/admin/attendance?month=${nextDate.getMonth() + 1}&year=${nextDate.getFullYear()}`}
          style={{ color: 'white', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ChevronRight size={18} />
        </Link>
      </div>

      {/* ─── Attendance Grid ─── */}
      <AttendanceGrid
        employees={employees ?? []}
        attendance={attendance ?? []}
        month={month}
        year={year}
        daysInMonth={daysInMonth}
        today={todayStr}
      />
    </div>
  )
}