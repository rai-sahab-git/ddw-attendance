'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AttendanceStatus, Employee } from '@/types'

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string; bg: string }[] = [
    { value: 'P', label: 'P', color: '#fff', bg: '#00A651' },
    { value: '2P', label: '2P', color: '#fff', bg: '#3B82F6' },
    { value: 'A', label: 'A', color: '#fff', bg: '#EF4444' },
    { value: 'H', label: 'H', color: '#fff', bg: '#F59E0B' },
    { value: 'OT', label: 'OT', color: '#fff', bg: '#F97316' },
    { value: '2OT', label: '2OT', color: '#fff', bg: '#8B5CF6' },
    { value: 'L', label: 'L', color: '#fff', bg: '#EC4899' },
]

type EmployeeAttendance = {
    employee: Employee
    status: AttendanceStatus
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
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => { loadData() }, [])

    async function loadData() {
        const [{ data: employees }, { data: existing }] = await Promise.all([
            supabase.from('employees').select('*').eq('is_active', true).order('emp_code'),
            supabase.from('attendance_records').select('*').eq('date', todayStr),
        ])
        if (!employees) return
        setRecords(employees.map(emp => {
            const ex = existing?.find(r => r.employee_id === emp.id)
            return { employee: emp, status: (ex?.status as AttendanceStatus) ?? 'P', ot_hours: ex?.ot_hours ?? 0, existingId: ex?.id }
        }))
        setLoading(false)
    }

    function setStatus(empId: string, status: AttendanceStatus) {
        setRecords(prev => prev.map(r => r.employee.id === empId ? { ...r, status } : r))
    }

    function setOtHours(empId: string, hours: number) {
        setRecords(prev => prev.map(r => r.employee.id === empId ? { ...r, ot_hours: hours } : r))
    }

    function markAll(status: AttendanceStatus) {
        setRecords(prev => prev.map(r => ({ ...r, status })))
    }

    async function handleSave() {
        setSaving(true)
        const month = today.getMonth() + 1
        const year = today.getFullYear()
        const { error } = await supabase.from('attendance_records').upsert(
            records.map(r => ({
                ...(r.existingId ? { id: r.existingId } : {}),
                employee_id: r.employee.id, date: todayStr,
                month, year, status: r.status, ot_hours: r.ot_hours,
            })),
            { onConflict: 'employee_id,date', ignoreDuplicates: false }
        )
        if (!error) {
            setSaved(true)
            setTimeout(() => { router.push('/admin/attendance'); router.refresh() }, 1200)
        }
        setSaving(false)
    }

    const presentCount = records.filter(r => ['P', '2P', 'OT', '2OT'].includes(r.status)).length

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: '88px', background: '#E5E7EB', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
            ))}
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '8px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => router.back()} style={{
                    width: '38px', height: '38px', background: 'white',
                    borderRadius: '12px', border: '1px solid #E5E7EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '18px', color: '#111827' }}>Mark Attendance</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '1px' }}>{displayDate}</div>
                </div>
            </div>

            {/* Stats + Bulk Actions */}
            <div style={{
                background: 'white', borderRadius: '16px',
                padding: '12px 16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div>
                    <span style={{ fontWeight: 800, fontSize: '20px', color: '#00A651' }}>{presentCount}</span>
                    <span style={{ fontSize: '14px', color: '#6B7280' }}> / {records.length} present</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => markAll('P')} style={{
                        background: '#E8F8EF', color: '#00A651',
                        fontWeight: 700, fontSize: '12px',
                        padding: '7px 14px', borderRadius: '10px',
                        border: 'none', cursor: 'pointer',
                    }}>
                        All Present
                    </button>
                    <button onClick={() => markAll('A')} style={{
                        background: '#FEF2F2', color: '#EF4444',
                        fontWeight: 700, fontSize: '12px',
                        padding: '7px 14px', borderRadius: '10px',
                        border: 'none', cursor: 'pointer',
                    }}>
                        All Absent
                    </button>
                </div>
            </div>

            {/* Employee Cards */}
            {records.map(({ employee, status, ot_hours }) => {
                const opt = STATUS_OPTIONS.find(o => o.value === status)!
                const initials = employee.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                    <div key={employee.id} style={{
                        background: 'white', borderRadius: '16px',
                        padding: '14px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        border: `2px solid ${opt.bg}22`,
                    }}>
                        {/* Top row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '40px', height: '40px',
                                    background: `${opt.bg}18`,
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: '13px', color: opt.bg,
                                }}>
                                    {initials}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{employee.name}</div>
                                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>{employee.emp_code}</div>
                                </div>
                            </div>
                            {/* Status badge */}
                            <div style={{
                                background: opt.bg, color: opt.color,
                                fontWeight: 800, fontSize: '13px',
                                padding: '5px 12px', borderRadius: '999px',
                                minWidth: '40px', textAlign: 'center',
                            }}>
                                {status}
                            </div>
                        </div>

                        {/* Status buttons */}
                        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                            {STATUS_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setStatus(employee.id, opt.value)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '10px',
                                        fontWeight: 700,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        border: '2px solid',
                                        borderColor: status === opt.value ? opt.bg : '#E5E7EB',
                                        background: status === opt.value ? opt.bg : 'transparent',
                                        color: status === opt.value ? 'white' : '#6B7280',
                                        transform: status === opt.value ? 'scale(1.05)' : 'scale(1)',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* OT Hours */}
                        {(status === 'OT' || status === '2OT') && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                                <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>OT Hours:</span>
                                <input
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
                                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>hrs</span>
                            </div>
                        )}
                    </div>
                )
            })}

            {/* Save Button */}
            <div style={{ position: 'sticky', bottom: '80px', paddingTop: '4px' }}>
                <button
                    onClick={handleSave}
                    disabled={saving || saved}
                    style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '16px',
                        background: saved
                            ? 'linear-gradient(135deg, #00A651, #007A3D)'
                            : 'linear-gradient(135deg, #00A651, #007A3D)',
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
                    {saved ? (
                        <>✅ Saved Successfully!</>
                    ) : saving ? (
                        <>Saving...</>
                    ) : (
                        <>💾 Save Attendance ({records.length} employees)</>
                    )}
                </button>
            </div>
        </div>
    )
}