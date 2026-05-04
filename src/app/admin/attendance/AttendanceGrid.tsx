'use client'
import { useState, useEffect, useCallback } from 'react'
import { Save, AlertTriangle } from 'lucide-react'

interface AttendanceRecord { employee_id: string; date: string; status: string }
interface Employee { id: string; name: string; emp_code: string }

interface Props {
    employees: Employee[]
    attendance: AttendanceRecord[]
    month: number
    year: number
    daysInMonth: number
    today: string
}

const DEFAULT_STATUS_CYCLE = ['', 'P', 'A', 'H', 'OT', '2P', '2OT', 'L', 'HD', 'WO']

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    P: { bg: '#00A651', color: '#fff' },
    '2P': { bg: '#3B82F6', color: '#fff' },
    A: { bg: '#EF4444', color: '#fff' },
    H: { bg: '#F59E0B', color: '#fff' },
    OT: { bg: '#F97316', color: '#fff' },
    '2OT': { bg: '#8B5CF6', color: '#fff' },
    L: { bg: '#EC4899', color: '#fff' },
    HD: { bg: '#D1D5DB', color: '#374151' },
    WO: { bg: '#F3F4F6', color: '#9CA3AF' },
    '': { bg: 'transparent', color: '#D1D5DB' },
}

export default function AttendanceGrid({
    employees, attendance, month, year, daysInMonth, today,
}: Props) {
    const [changes, setChanges] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState('')

    const isDirty = Object.keys(changes).length > 0

    // ── Unsaved changes browser warning ──
    useEffect(() => {
        if (!isDirty) return
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault()
            e.returnValue = 'Attendance mein unsaved changes hain!'
        }
        window.addEventListener('beforeunload', handler)
        return () => window.removeEventListener('beforeunload', handler)
    }, [isDirty])

    function getStatus(empId: string, dateStr: string): string {
        const key = `${empId}__${dateStr}`
        if (key in changes) return changes[key]
        return attendance.find(a => a.employee_id === empId && a.date === dateStr)?.status ?? ''
    }

    function cycleStatus(empId: string, dateStr: string) {
        const current = getStatus(empId, dateStr)
        const idx = DEFAULT_STATUS_CYCLE.indexOf(current)
        const next = DEFAULT_STATUS_CYCLE[(idx + 1) % DEFAULT_STATUS_CYCLE.length]
        setChanges(prev => ({ ...prev, [`${empId}__${dateStr}`]: next }))
    }

    async function handleSave() {
        if (!isDirty) return
        setSaving(true)
        setMsg('')

        const records = Object.entries(changes).map(([key, status]) => {
            const [employee_id, date] = key.split('__')
            const d = new Date(date)
            return { employee_id, date, status, month: d.getMonth() + 1, year: d.getFullYear() }
        })

        try {
            const res = await fetch('/api/admin/attendance/bulk-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records }),
            })
            if (res.ok) {
                setMsg('✅ Saved!')
                setChanges({})   // clear dirty state
            } else {
                const d = await res.json()
                setMsg('❌ ' + (d.error ?? 'Failed'))
            }
        } catch {
            setMsg('❌ Network error')
        }

        setSaving(false)
        setTimeout(() => setMsg(''), 3000)
    }

    // Day headers
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    // Sunday check
    function isSunday(day: number) {
        return new Date(year, month - 1, day).getDay() === 0
    }

    const todayDay = today.startsWith(`${year}-${String(month).padStart(2, '0')}`)
        ? parseInt(today.split('-')[2])
        : null

    return (
        <div>
            {/* Save bar — sticky bottom */}
            <div style={{
                position: 'sticky', top: '60px', zIndex: 50,
                background: isDirty ? '#FFF7ED' : 'white',
                borderRadius: '14px', padding: '10px 14px',
                border: isDirty ? '1.5px solid #FED7AA' : '1px solid #E5E7EB',
                marginBottom: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                boxShadow: isDirty ? '0 2px 12px rgba(249,115,22,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isDirty && <AlertTriangle size={16} color="#F97316" />}
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isDirty ? '#92400E' : '#9CA3AF' }}>
                        {isDirty
                            ? `${Object.keys(changes).length} unsaved change${Object.keys(changes).length > 1 ? 's' : ''}`
                            : msg || 'Tap any cell to mark attendance'
                        }
                    </span>
                    {msg && !isDirty && (
                        <span style={{ fontSize: '13px', fontWeight: 700, color: msg.startsWith('✅') ? '#059669' : '#EF4444' }}>
                            {msg}
                        </span>
                    )}
                </div>

                <button
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        background: isDirty
                            ? saving ? '#9CA3AF' : 'linear-gradient(135deg,#00A651,#059669)'
                            : '#E5E7EB',
                        color: isDirty ? 'white' : '#9CA3AF',
                        padding: '9px 16px', borderRadius: '10px', border: 'none',
                        cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
                        fontWeight: 800, fontSize: '13px',
                        boxShadow: isDirty ? '0 2px 8px rgba(0,166,81,0.3)' : 'none',
                        transition: 'all 0.2s',
                    }}
                >
                    {saving
                        ? <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                        : <Save size={14} />
                    }
                    {saving ? 'Saving...' : 'Save All'}
                </button>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Grid scroll wrapper */}
            <div style={{ overflowX: 'auto', borderRadius: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', background: 'white' }}>
                {/* Scroll hint on mobile */}
                <div style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'right', padding: '6px 10px 0', background: 'white' }}>
                    ← scroll →
                </div>

                <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: `${120 + daysInMonth * 36}px` }}>
                    {/* Header row */}
                    <thead>
                        <tr style={{ background: '#F9FAFB' }}>
                            <th style={{
                                position: 'sticky', left: 0, background: '#F9FAFB', zIndex: 10,
                                padding: '10px 10px', textAlign: 'left',
                                fontSize: '11px', fontWeight: 800, color: '#6B7280',
                                borderBottom: '2px solid #E5E7EB', minWidth: '120px',
                                whiteSpace: 'nowrap',
                            }}>
                                Employee
                            </th>
                            {days.map(d => (
                                <th key={d} style={{
                                    padding: '6px 2px',
                                    fontSize: '11px', fontWeight: 700, textAlign: 'center',
                                    color: d === todayDay ? '#00A651' : isSunday(d) ? '#EF4444' : '#6B7280',
                                    background: d === todayDay ? '#F0FDF4' : isSunday(d) ? '#FEF2F2' : '#F9FAFB',
                                    borderBottom: '2px solid #E5E7EB',
                                    minWidth: '36px',
                                }}>
                                    {d}
                                    {isSunday(d) && <div style={{ fontSize: '9px', color: '#EF4444', lineHeight: 1 }}>S</div>}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* Employee rows */}
                    <tbody>
                        {employees.map((emp, ri) => (
                            <tr key={emp.id} style={{ background: ri % 2 === 0 ? 'white' : '#FAFAFA' }}>
                                {/* Name cell — sticky */}
                                <td style={{
                                    position: 'sticky', left: 0, zIndex: 5,
                                    background: ri % 2 === 0 ? 'white' : '#FAFAFA',
                                    padding: '6px 10px',
                                    borderBottom: '1px solid #F3F4F6',
                                    whiteSpace: 'nowrap',
                                }}>
                                    <div style={{ fontWeight: 800, fontSize: '12px', color: '#111827' }}>{emp.name}</div>
                                    <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{emp.emp_code}</div>
                                </td>

                                {/* Day cells */}
                                {days.map(d => {
                                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                                    const status = getStatus(emp.id, dateStr)
                                    const style = STATUS_STYLES[status] ?? STATUS_STYLES['']
                                    const key = `${emp.id}__${dateStr}`
                                    const changed = key in changes

                                    return (
                                        <td key={d} style={{
                                            padding: '4px 2px', textAlign: 'center',
                                            background: d === todayDay ? '#F0FDF4' : isSunday(d) ? '#FEF9F9' : 'transparent',
                                            borderBottom: '1px solid #F3F4F6',
                                        }}>
                                            <button
                                                onClick={() => cycleStatus(emp.id, dateStr)}
                                                title={`${emp.name} — ${dateStr}`}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '8px',
                                                    background: style.bg, color: style.color,
                                                    border: changed ? '2px solid #1a1a2e' : '1.5px solid transparent',
                                                    cursor: 'pointer',
                                                    fontWeight: 900, fontSize: status.length > 2 ? '9px' : '11px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: changed ? '0 0 0 2px rgba(26,26,46,0.2)' : 'none',
                                                    transition: 'all 0.1s',
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {status || '·'}
                                            </button>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px', padding: '0 2px' }}>
                {Object.entries(STATUS_STYLES).filter(([k]) => k !== '').map(([code, style]) => (
                    <div key={code} style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '11px', color: '#6B7280',
                    }}>
                        <span style={{
                            background: style.bg, color: style.color,
                            borderRadius: '5px', padding: '2px 6px',
                            fontWeight: 900, fontSize: '10px',
                        }}>{code}</span>
                    </div>
                ))}
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: '4px' }}>
                    • Changed cells show dark border
                </div>
            </div>
        </div>
    )
}