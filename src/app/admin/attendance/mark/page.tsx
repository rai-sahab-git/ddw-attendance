'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Employee } from '@/types'
import {
    type AttendanceStatusOption,
    normalizeSettings,
} from '@/lib/attendance-status'

type EmployeeAttendance = {
    employee: Employee
    status: string
    ot_hours: number
    existingId?: string
}

export default function MarkAttendancePage() {
    const router = useRouter()
    const supabase = createClient()

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const displayDate = today.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    const [records, setRecords] = useState<EmployeeAttendance[]>([])
    const [settings, setSettings] = useState<AttendanceStatusOption[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')

    const statusOptions = useMemo(() => normalizeSettings(settings), [settings])
    const defaultStatus = statusOptions.find(s => s.code === 'P')?.code ?? statusOptions[0]?.code ?? 'P'

    useEffect(() => { loadData() }, [])

    async function loadData() {
        const [{ data: employees }, { data: existing }, settingsRes] = await Promise.all([
            supabase.from('employees').select('*').eq('is_active', true).order('emp_code'),
            supabase.from('attendance_records').select('*').eq('date', todayStr),
            fetch('/api/admin/settings/attendance').then(r => r.ok ? r.json() : []),
        ])
        const normalized = normalizeSettings(Array.isArray(settingsRes) ? settingsRes.filter((s: { is_active?: boolean }) => s.is_active !== false) : [])
        setSettings(normalized)
        const fallback = normalized.find(s => s.code === 'P')?.code ?? normalized[0]?.code ?? 'P'
        if (!employees) { setLoading(false); return }
        setRecords(employees.map(emp => {
            const ex = existing?.find(r => r.employee_id === emp.id)
            return {
                employee: emp,
                status: ex?.status ?? fallback,
                ot_hours: ex?.ot_hours ?? 0,
                existingId: ex?.id,
            }
        }))
        setLoading(false)
    }

    function setStatus(empId: string, status: string) {
        setRecords(prev => prev.map(r => r.employee.id === empId ? { ...r, status } : r))
    }

    function setOtHours(empId: string, hours: number) {
        setRecords(prev => prev.map(r => r.employee.id === empId ? { ...r, ot_hours: hours } : r))
    }

    function markAll(status: string) {
        setRecords(prev => prev.map(r => ({ ...r, status })))
    }

    async function handleSave() {
        setSaving(true)
        setError('')
        const month = today.getMonth() + 1
        const year = today.getFullYear()
        try {
            const res = await fetch('/api/admin/attendance/bulk-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    records: records.map(r => ({
                        ...(r.existingId ? { id: r.existingId } : {}),
                        employee_id: r.employee.id,
                        date: todayStr,
                        month,
                        year,
                        status: r.status,
                        ot_hours: r.ot_hours,
                    })),
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error ?? 'Save failed')
                setSaving(false)
                return
            }
            setSaved(true)
            setTimeout(() => { router.push('/admin/attendance'); router.refresh() }, 1200)
        } catch {
            setError('Network error')
        }
        setSaving(false)
    }

    const presentCodes = new Set(
        statusOptions.filter(s => ['present', 'ot_fixed', 'per_day_multiply'].includes(s.calc_type ?? '')).map(s => s.code)
    )
    const presentCount = records.filter(r => presentCodes.has(r.status) || ['P', '2P', 'OT', '2OT'].includes(r.status)).length

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: '88px', background: '#E5E7EB', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
            ))}
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                    onClick={() => router.back()}
                    aria-label="Go back"
                    style={{
                        width: '38px', height: '38px', background: 'var(--panel)',
                        borderRadius: '12px', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text)' }}>Mark Attendance</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>{displayDate}</div>
                </div>
            </div>

            <div style={{
                background: 'var(--panel)', borderRadius: '16px',
                padding: '12px 16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div>
                    <span style={{ fontWeight: 800, fontSize: '20px', color: '#00A651' }}>{presentCount}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}> / {records.length} present</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => markAll(defaultStatus)} style={{
                        background: '#E8F8EF', color: '#00A651',
                        fontWeight: 700, fontSize: '12px',
                        padding: '7px 14px', borderRadius: '10px',
                        border: 'none', cursor: 'pointer',
                    }}>
                        All Present
                    </button>
                    <button onClick={() => markAll(statusOptions.find(s => s.code === 'A')?.code ?? 'A')} style={{
                        background: '#FEF2F2', color: '#EF4444',
                        fontWeight: 700, fontSize: '12px',
                        padding: '7px 14px', borderRadius: '10px',
                        border: 'none', cursor: 'pointer',
                    }}>
                        All Absent
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
                    {error}
                </div>
            )}

            {records.map(({ employee, status, ot_hours }) => {
                const opt = statusOptions.find(o => o.code === status) ?? {
                    code: status, label: status, color: 'var(--text-muted)', text_color: '#FFFFFF',
                }
                const initials = employee.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                const isOt = (opt.calc_type === 'ot_fixed') || status === 'OT' || status === '2OT'
                return (
                    <div key={employee.id} style={{
                        background: 'var(--panel)', borderRadius: '16px',
                        padding: '14px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        border: `2px solid ${opt.color}22`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '40px', height: '40px',
                                    background: `${opt.color}18`,
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: '13px', color: opt.color,
                                }}>
                                    {initials}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{employee.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{employee.emp_code}</div>
                                </div>
                            </div>
                            <div style={{
                                background: opt.color, color: opt.text_color,
                                fontWeight: 800, fontSize: '13px',
                                padding: '5px 12px', borderRadius: '999px',
                                minWidth: '40px', textAlign: 'center',
                            }}>
                                {status}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }} role="group" aria-label={`Status for ${employee.name}`}>
                            {statusOptions.map(option => (
                                <button
                                    key={option.code}
                                    type="button"
                                    onClick={() => setStatus(employee.id, option.code)}
                                    aria-pressed={status === option.code}
                                    title={option.label}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '10px',
                                        fontWeight: 700,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        border: '2px solid',
                                        borderColor: status === option.code ? option.color : '#E5E7EB',
                                        background: status === option.code ? option.color : 'transparent',
                                        color: status === option.code ? option.text_color : '#6B7280',
                                        transform: status === option.code ? 'scale(1.05)' : 'scale(1)',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    {option.code}
                                </button>
                            ))}
                        </div>

                        {isOt && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                                <label htmlFor={`ot-${employee.id}`} style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>OT Hours:</label>
                                <input
                                    id={`ot-${employee.id}`}
                                    type="number"
                                    value={ot_hours || ''}
                                    onChange={e => setOtHours(employee.id, parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    min="0" max="24" step="0.5"
                                    style={{
                                        width: '72px', padding: '6px 10px',
                                        border: '2px solid #F97316', borderRadius: '10px',
                                        fontSize: '13px', fontWeight: 600,
                                        outline: 'none', textAlign: 'center',
                                    }}
                                />
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>hrs</span>
                            </div>
                        )}
                    </div>
                )
            })}

            <div style={{ position: 'sticky', bottom: '80px', paddingTop: '4px' }}>
                <button
                    onClick={handleSave}
                    disabled={saving || saved}
                    style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #00A651, #007A3D)',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '15px',
                        border: 'none',
                        cursor: saving || saved ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.8 : 1,
                        boxShadow: '0 8px 24px rgba(0,166,81,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                >
                    {saved ? 'Saved successfully!' : saving ? 'Saving...' : `Save Attendance (${records.length} employees)`}
                </button>
            </div>
        </div>
    )
}
