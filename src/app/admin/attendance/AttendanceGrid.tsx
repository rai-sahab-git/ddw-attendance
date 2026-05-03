'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AttendanceStatus, Employee, AttendanceRecord } from '@/types'

const STATUS_CYCLE: AttendanceStatus[] = ['P', '2P', 'A', 'H', 'OT', '2OT', 'L']

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    P: { bg: '#00A651', color: '#fff' },
    '2P': { bg: '#3B82F6', color: '#fff' },
    A: { bg: '#EF4444', color: '#fff' },
    H: { bg: '#F59E0B', color: '#fff' },
    OT: { bg: '#F97316', color: '#fff' },
    '2OT': { bg: '#8B5CF6', color: '#fff' },
    L: { bg: '#EC4899', color: '#fff' },
    HD: { bg: '#D1D5DB', color: '#374151' },
    WO: { bg: '#F3F4F6', color: '#9CA3AF' },
}

type Props = {
    employees: Employee[]
    attendance: AttendanceRecord[]
    month: number
    year: number
    daysInMonth: number
    today: string
}

export default function AttendanceGrid({ employees, attendance, month, year, daysInMonth, today }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // Build initial state map: empId -> { day -> status }
    const buildMap = () => {
        const map: Record<string, Record<number, string>> = {}
        employees.forEach(e => { map[e.id] = {} })
        attendance.forEach(r => {
            const day = new Date(r.date).getDate()
            map[r.employee_id] = { ...(map[r.employee_id] ?? {}), [day]: r.status }
        })
        return map
    }

    const [attMap, setAttMap] = useState<Record<string, Record<number, string>>>(buildMap)
    const [saving, setSaving] = useState(false)
    const [saveMsg, setSaveMsg] = useState('')
    const [selectedCell, setSelectedCell] = useState<{ empId: string; day: number } | null>(null)

    const isSunday = (day: number) => new Date(year, month - 1, day).getDay() === 0

    function cycleStatus(empId: string, day: number) {
        const curr = attMap[empId]?.[day] ?? ''
        const idx = STATUS_CYCLE.indexOf(curr as AttendanceStatus)
        const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
        setAttMap(prev => ({ ...prev, [empId]: { ...prev[empId], [day]: next } }))
    }

    function setStatus(empId: string, day: number, status: string) {
        setAttMap(prev => ({ ...prev, [empId]: { ...prev[empId], [day]: status } }))
        setSelectedCell(null)
    }

    async function handleSave() {
        setSaving(true)
        setSaveMsg('')
        try {
            const records: any[] = []
            employees.forEach(emp => {
                for (let d = 1; d <= daysInMonth; d++) {
                    const status = attMap[emp.id]?.[d]
                    if (!status) continue
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                    records.push({ employee_id: emp.id, date: dateStr, month, year, status })
                }
            })
            const res = await fetch('/api/admin/attendance/bulk-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records }),
            })
            const data = await res.json()
            if (res.ok) {
                setSaveMsg('✅ Saved!')
                startTransition(() => router.refresh())
            } else {
                setSaveMsg('❌ ' + (data.error ?? 'Save failed'))
            }
        } catch {
            setSaveMsg('❌ Network error')
        }
        setSaving(false)
        setTimeout(() => setSaveMsg(''), 3000)
    }

    function markAllDay(day: number, status: AttendanceStatus) {
        setAttMap(prev => {
            const next = { ...prev }
            employees.forEach(e => { next[e.id] = { ...next[e.id], [day]: status } })
            return next
        })
    }

    function markAllEmployee(empId: string, status: AttendanceStatus) {
        const days: Record<number, string> = {}
        for (let d = 1; d <= daysInMonth; d++) days[d] = status
        setAttMap(prev => ({ ...prev, [empId]: days }))
    }

    // Summary counts per employee
    function getStats(empId: string) {
        const days = attMap[empId] ?? {}
        let P = 0, A = 0, H = 0, extra = 0
        Object.values(days).forEach(s => {
            if (['P', 'OT'].includes(s)) P++
            else if (['2P', '2OT'].includes(s)) { P++; extra++ }
            else if (s === 'A' || s === 'L') A++
            else if (s === 'H') H++
        })
        return { P, A, H, extra }
    }

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Status picker popup */}
            {selectedCell && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 50,
                    background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                }} onClick={() => setSelectedCell(null)}>
                    <div style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: '20px', width: '100%', maxWidth: '480px' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginBottom: '14px', textAlign: 'center' }}>
                            {employees.find(e => e.id === selectedCell.empId)?.name} — Day {selectedCell.day}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '12px' }}>
                            {STATUS_CYCLE.map(s => (
                                <button key={s} onClick={() => setStatus(selectedCell.empId, selectedCell.day, s)}
                                    style={{
                                        padding: '12px 4px', borderRadius: '12px', fontWeight: 800, fontSize: '15px',
                                        background: STATUS_STYLE[s]?.bg, color: STATUS_STYLE[s]?.color,
                                        border: attMap[selectedCell.empId]?.[selectedCell.day] === s ? '3px solid #1a1a2e' : '3px solid transparent',
                                        cursor: 'pointer',
                                    }}>
                                    {s}
                                </button>
                            ))}
                            <button onClick={() => setStatus(selectedCell.empId, selectedCell.day, '')}
                                style={{ padding: '12px 4px', borderRadius: '12px', fontWeight: 700, fontSize: '13px', background: '#F3F4F6', color: '#6B7280', border: '3px solid transparent', cursor: 'pointer' }}>
                                Clear
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button onClick={() => markAllEmployee(selectedCell.empId, 'P')}
                                style={{ padding: '10px', borderRadius: '10px', background: '#E8F8EF', color: '#059669', fontWeight: 700, fontSize: '12px', border: 'none', cursor: 'pointer' }}>
                                All P this month
                            </button>
                            <button onClick={() => markAllEmployee(selectedCell.empId, 'A')}
                                style={{ padding: '10px', borderRadius: '10px', background: '#FEF2F2', color: '#EF4444', fontWeight: 700, fontSize: '12px', border: 'none', cursor: 'pointer' }}>
                                All A this month
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Horizontal scrollable grid */}
            <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ borderCollapse: 'collapse', minWidth: `${200 + daysInMonth * 34}px` }}>
                        <thead>
                            <tr style={{ background: '#1a1a2e' }}>
                                <th style={{ padding: '10px 12px', textAlign: 'left', color: 'white', fontSize: '12px', fontWeight: 700, minWidth: '130px', position: 'sticky', left: 0, background: '#1a1a2e', zIndex: 2 }}>
                                    Employee
                                </th>
                                {days.map(d => {
                                    const sun = isSunday(d)
                                    const isToday = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}` === today
                                    return (
                                        <th key={d} style={{
                                            padding: '8px 4px', textAlign: 'center', color: sun ? '#FCA5A5' : 'rgba(255,255,255,0.8)',
                                            fontSize: '11px', fontWeight: 700, minWidth: '34px',
                                            background: isToday ? '#374151' : '#1a1a2e',
                                        }}>
                                            {d}
                                        </th>
                                    )
                                })}
                                <th style={{ padding: '10px 8px', textAlign: 'center', color: '#86EFAC', fontSize: '11px', fontWeight: 700, minWidth: '42px' }}>P</th>
                                <th style={{ padding: '10px 8px', textAlign: 'center', color: '#FCA5A5', fontSize: '11px', fontWeight: 700, minWidth: '42px' }}>A</th>
                                <th style={{ padding: '10px 8px', textAlign: 'center', color: '#FDE68A', fontSize: '11px', fontWeight: 700, minWidth: '42px' }}>H</th>
                                <th style={{ padding: '10px 8px', textAlign: 'center', color: '#93C5FD', fontSize: '11px', fontWeight: 700, minWidth: '42px' }}>EX</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp, ei) => {
                                const stats = getStats(emp.id)
                                return (
                                    <tr key={emp.id} style={{ background: ei % 2 === 0 ? 'white' : '#FAFAFA' }}>
                                        <td style={{
                                            padding: '8px 12px', position: 'sticky', left: 0, zIndex: 1,
                                            background: ei % 2 === 0 ? 'white' : '#FAFAFA',
                                            borderBottom: '1px solid #F3F4F6',
                                        }}>
                                            <div style={{ fontWeight: 700, fontSize: '12px', color: '#111827' }}>{emp.name}</div>
                                            <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{emp.emp_code}</div>
                                        </td>
                                        {days.map(d => {
                                            const status = attMap[emp.id]?.[d] ?? ''
                                            const sStyle = STATUS_STYLE[status]
                                            const sun = isSunday(d)
                                            const isToday = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}` === today
                                            return (
                                                <td key={d} onClick={() => setSelectedCell({ empId: emp.id, day: d })}
                                                    style={{
                                                        padding: '4px 2px', textAlign: 'center', cursor: 'pointer',
                                                        borderBottom: '1px solid #F3F4F6',
                                                        background: isToday ? '#FFFBEB' : sun ? '#FFF9F9' : 'transparent',
                                                    }}>
                                                    {status ? (
                                                        <span style={{
                                                            display: 'inline-block', width: '28px', height: '24px', lineHeight: '24px',
                                                            borderRadius: '6px', background: sStyle?.bg, color: sStyle?.color,
                                                            fontSize: '9px', fontWeight: 800,
                                                        }}>
                                                            {status}
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            display: 'inline-block', width: '28px', height: '24px', lineHeight: '24px',
                                                            borderRadius: '6px', background: sun ? '#FEE2E2' : '#F3F4F6', color: '#D1D5DB',
                                                            fontSize: '9px', fontWeight: 600,
                                                        }}>
                                                            {sun ? 'S' : '·'}
                                                        </span>
                                                    )}
                                                </td>
                                            )
                                        })}
                                        <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '13px', color: '#059669', borderBottom: '1px solid #F3F4F6', padding: '8px 4px' }}>{stats.P}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '13px', color: '#EF4444', borderBottom: '1px solid #F3F4F6', padding: '8px 4px' }}>{stats.A}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '13px', color: '#F59E0B', borderBottom: '1px solid #F3F4F6', padding: '8px 4px' }}>{stats.H}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '13px', color: '#3B82F6', borderBottom: '1px solid #F3F4F6', padding: '8px 4px' }}>{stats.extra}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legend */}
            <div style={{ background: 'white', borderRadius: '14px', padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>Tap cell to change:</span>
                    {STATUS_CYCLE.map(s => (
                        <span key={s} style={{ background: STATUS_STYLE[s].bg, color: STATUS_STYLE[s].color, borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>{s}</span>
                    ))}
                </div>
            </div>

            {/* Save Button */}
            <button onClick={handleSave} disabled={saving}
                style={{
                    width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                    background: saving ? '#9CA3AF' : 'linear-gradient(135deg,#00A651,#059669)',
                    color: 'white', fontWeight: 800, fontSize: '16px', cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(0,166,81,0.3)',
                }}>
                {saving ? '⏳ Saving...' : saveMsg || `💾 Save Attendance`}
            </button>
        </div>
    )
}