'use client'
import { useState, useEffect, useMemo } from 'react'
import { Save, AlertTriangle } from 'lucide-react'
import {
    type AttendanceStatusOption,
    buildStatusCycle,
    buildStatusStyles,
    normalizeSettings,
} from '@/lib/attendance-status'

interface AttendanceRecord { employee_id: string; date: string; status: string }
interface Employee { id: string; name: string; emp_code: string }

interface Props {
    employees: Employee[]
    attendance: AttendanceRecord[]
    month: number
    year: number
    daysInMonth: number
    today: string
    settings?: AttendanceStatusOption[]
}

export default function AttendanceGrid({
    employees, attendance, month, year, daysInMonth, today, settings: settingsProp,
}: Props) {
    const settings = useMemo(() => normalizeSettings(settingsProp), [settingsProp])
    const statusCycle = useMemo(() => buildStatusCycle(settings), [settings])
    const statusStyles = useMemo(() => buildStatusStyles(settings), [settings])

    const [changes, setChanges] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState('')

    const isDirty = Object.keys(changes).length > 0

    useEffect(() => {
        if (!isDirty) return
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault()
            e.returnValue = 'You have unsaved attendance changes.'
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
        const idx = statusCycle.indexOf(current)
        const next = statusCycle[(idx === -1 ? 0 : idx + 1) % statusCycle.length]
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
                setMsg('Saved!')
                setChanges({})
            } else {
                const d = await res.json()
                setMsg(d.error ?? 'Failed')
            }
        } catch {
            setMsg('Network error')
        }

        setSaving(false)
        setTimeout(() => setMsg(''), 3000)
    }

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    function isSunday(day: number) {
        return new Date(year, month - 1, day).getDay() === 0
    }

    const todayDay = today.startsWith(`${year}-${String(month).padStart(2, '0')}`)
        ? parseInt(today.split('-')[2])
        : null

    return (
        <div>
            <div style={{
                position: 'sticky', top: 0, zIndex: 50,
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
                </div>

                <button
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    aria-label="Save attendance changes"
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

            <div style={{ overflowX: 'auto', borderRadius: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', background: 'var(--panel)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', padding: '6px 10px 0', background: 'var(--panel)' }}>
                    ← scroll →
                </div>

                <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: `${120 + daysInMonth * 36}px` }} aria-label={`Attendance for ${month}/${year}`}>
                    <thead>
                        <tr style={{ background: 'var(--gray-50)' }}>
                            <th scope="col" style={{
                                position: 'sticky', left: 0, background: 'var(--gray-50)', zIndex: 10,
                                padding: '10px 10px', textAlign: 'left',
                                fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)',
                                borderBottom: '2px solid var(--border)', minWidth: '120px',
                                whiteSpace: 'nowrap',
                            }}>
                                Employee
                            </th>
                            {days.map(d => (
                                <th scope="col" key={d} style={{
                                    padding: '6px 2px',
                                    fontSize: '11px', fontWeight: 700, textAlign: 'center',
                                    color: d === todayDay ? 'var(--green-primary)' : isSunday(d) ? '#EF4444' : 'var(--text-muted)',
                                    background: d === todayDay ? 'var(--tint-success)' : isSunday(d) ? 'var(--tint-danger)' : 'var(--gray-50)',
                                    borderBottom: '2px solid var(--border)',
                                    minWidth: '36px',
                                }}>
                                    {d}
                                    {isSunday(d) && <div style={{ fontSize: '9px', color: '#EF4444', lineHeight: 1 }}>S</div>}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {employees.map((emp, ri) => (
                            <tr key={emp.id} style={{ background: ri % 2 === 0 ? 'var(--panel)' : 'var(--gray-50)' }}>
                                <th scope="row" style={{
                                    position: 'sticky', left: 0, zIndex: 5,
                                    background: ri % 2 === 0 ? 'var(--panel)' : 'var(--gray-50)',
                                    padding: '6px 10px',
                                    borderBottom: '1px solid var(--border)',
                                    whiteSpace: 'nowrap',
                                    textAlign: 'left',
                                    fontWeight: 'normal',
                                }}>
                                    <div style={{ fontWeight: 800, fontSize: '12px', color: 'var(--text)' }}>{emp.name}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{emp.emp_code}</div>
                                </th>

                                {days.map(d => {
                                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                                    const status = getStatus(emp.id, dateStr)
                                    const style = statusStyles[status] ?? statusStyles['']
                                    const key = `${emp.id}__${dateStr}`
                                    const changed = key in changes

                                    return (
                                        <td key={d} style={{
                                            padding: '4px 2px', textAlign: 'center',
                                            background: d === todayDay
                                                ? 'var(--tint-success)'
                                                : isSunday(d) ? 'var(--tint-danger)' : 'transparent',
                                            borderBottom: '1px solid var(--border)',
                                        }}>
                                            <button
                                                onClick={() => cycleStatus(emp.id, dateStr)}
                                                aria-label={`${emp.name} ${dateStr}: ${status || 'empty'}. Tap to change.`}
                                                title={`${emp.name} — ${dateStr}${style.label ? ` (${style.label})` : ''}`}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '8px',
                                                    background: style.bg, color: style.color,
                                                    border: changed ? '2px solid var(--green-primary)' : '1.5px solid var(--border)',
                                                    cursor: 'pointer',
                                                    fontWeight: 900, fontSize: status.length > 2 ? '9px' : '11px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: changed ? '0 0 0 2px rgba(34,197,94,0.25)' : 'none',
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

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px', padding: '0 2px' }}>
                {settings.map(s => (
                    <div key={s.code} style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '11px', color: 'var(--text-muted)',
                    }}>
                        <span style={{
                            background: s.color, color: s.text_color,
                            borderRadius: '5px', padding: '2px 6px',
                            fontWeight: 900, fontSize: '10px',
                        }}>{s.code}</span>
                        <span>{s.label}</span>
                    </div>
                ))}
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                    • Changed cells show dark border
                </div>
            </div>
        </div>
    )
}
