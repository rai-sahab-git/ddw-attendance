'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock, Filter } from 'lucide-react'

type Request = {
    id: string
    employee_id: string
    date: string
    requested_status: string
    reason: string
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
    employees: { id: string; name: string; emp_code: string }
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
    P: { bg: '#D1FAE5', color: '#059669', label: 'Present' },
    '2P': { bg: '#DBEAFE', color: '#2563EB', label: 'Double P' },
    A: { bg: '#FEE2E2', color: '#DC2626', label: 'Absent' },
    H: { bg: '#FEF3C7', color: '#D97706', label: 'Half Day' },
    OT: { bg: '#FFEDD5', color: '#EA580C', label: 'OT' },
    L: { bg: '#FCE7F3', color: '#DB2777', label: 'Leave' },
}

export default function RequestsClient({ initialRequests }: { initialRequests: Request[] }) {
    const supabase = createClient()
    const [requests, setRequests] = useState(initialRequests)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
    const [actioningId, setActioning] = useState<string | null>(null)

    const filtered = requests.filter(r => filter === 'all' ? true : r.status === filter)
    const pendingCount = requests.filter(r => r.status === 'pending').length

    async function handleAction(req: Request, action: 'approved' | 'rejected') {
        setActioning(req.id)
        const supabaseClient = createClient()

        await supabaseClient
            .from('attendance_requests')
            .update({ status: action })
            .eq('id', req.id)

        // If approved → update attendance record
        if (action === 'approved') {
            await supabaseClient.from('attendance_records').upsert({
                employee_id: req.employee_id,
                date: req.date,
                month: new Date(req.date).getMonth() + 1,
                year: new Date(req.date).getFullYear(),
                status: req.requested_status,
            }, { onConflict: 'employee_id,date' })
        }

        setRequests(prev => prev.map(r =>
            r.id === req.id ? { ...r, status: action } : r
        ))
        setActioning(null)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827' }}>
                        Requests
                        {pendingCount > 0 && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '22px', height: '22px',
                                background: '#EF4444', color: 'white',
                                fontSize: '11px', fontWeight: 800,
                                borderRadius: '999px', marginLeft: '8px', verticalAlign: 'middle',
                            }}>{pendingCount}</span>
                        )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>Attendance correction requests</div>
                </div>
                <div style={{
                    width: '36px', height: '36px', background: 'white',
                    borderRadius: '10px', border: '1px solid #E5E7EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Filter size={16} color="#6B7280" />
                </div>
            </div>

            {/* Filter tabs */}
            <div style={{
                display: 'flex', gap: '6px',
                background: 'white', borderRadius: '14px',
                padding: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
                {(['pending', 'approved', 'rejected', 'all'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        style={{
                            flex: 1, padding: '8px 4px',
                            borderRadius: '10px',
                            border: 'none', cursor: 'pointer',
                            fontWeight: 700, fontSize: '12px',
                            textTransform: 'capitalize',
                            background: filter === tab
                                ? tab === 'pending' ? '#FEF3C7'
                                    : tab === 'approved' ? '#D1FAE5'
                                        : tab === 'rejected' ? '#FEE2E2'
                                            : '#F3F4F6'
                                : 'transparent',
                            color: filter === tab
                                ? tab === 'pending' ? '#D97706'
                                    : tab === 'approved' ? '#059669'
                                        : tab === 'rejected' ? '#DC2626'
                                            : '#374151'
                                : '#9CA3AF',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {tab}
                        {tab === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
                    </button>
                ))}
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div style={{
                    background: 'white', borderRadius: '20px',
                    padding: '48px 24px', textAlign: 'center',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                        {filter === 'pending' ? '🎉' : '📭'}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#111827', marginBottom: '6px' }}>
                        {filter === 'pending' ? 'All caught up!' : `No ${filter} requests`}
                    </div>
                    <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                        {filter === 'pending' ? 'No pending requests right now' : `No requests with ${filter} status`}
                    </div>
                </div>
            )}

            {/* Request cards */}
            {filtered.map(req => {
                const statusOpt = STATUS_COLORS[req.requested_status] ?? { bg: '#F3F4F6', color: '#374151', label: req.requested_status }
                const initials = req.employees.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                const dateStr = new Date(req.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                const timeAgo = new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

                return (
                    <div key={req.id} style={{
                        background: 'white', borderRadius: '18px',
                        padding: '16px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        border: req.status === 'pending'
                            ? '2px solid #FEF3C7'
                            : req.status === 'approved'
                                ? '2px solid #D1FAE5'
                                : '2px solid #FEE2E2',
                    }}>
                        {/* Top row */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                            <div style={{
                                width: '42px', height: '42px', flexShrink: 0,
                                background: '#F0FDF4', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: '13px', color: '#00A651',
                            }}>
                                {initials}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>
                                    {req.employees.name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                                    {req.employees.emp_code} • Requested on {timeAgo}
                                </div>
                            </div>
                            {/* Status pill */}
                            <div style={{
                                alignSelf: 'flex-start',
                                padding: '4px 10px', borderRadius: '999px',
                                fontSize: '11px', fontWeight: 700,
                                background: req.status === 'pending' ? '#FEF3C7'
                                    : req.status === 'approved' ? '#D1FAE5'
                                        : '#FEE2E2',
                                color: req.status === 'pending' ? '#D97706'
                                    : req.status === 'approved' ? '#059669'
                                        : '#DC2626',
                                display: 'flex', alignItems: 'center', gap: '4px',
                            }}>
                                {req.status === 'pending' && <Clock size={10} />}
                                {req.status === 'approved' && <CheckCircle size={10} />}
                                {req.status === 'rejected' && <XCircle size={10} />}
                                {req.status}
                            </div>
                        </div>

                        {/* Request details */}
                        <div style={{
                            background: '#F9FAFB', borderRadius: '12px',
                            padding: '12px', marginBottom: '12px',
                            display: 'flex', gap: '12px', alignItems: 'center',
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '2px' }}>For Date</div>
                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{dateStr}</div>
                            </div>
                            <div style={{ width: '1px', background: '#E5E7EB', alignSelf: 'stretch' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '2px' }}>Requested Status</div>
                                <span style={{
                                    background: statusOpt.bg, color: statusOpt.color,
                                    fontWeight: 800, fontSize: '13px',
                                    padding: '2px 10px', borderRadius: '999px',
                                }}>
                                    {statusOpt.label}
                                </span>
                            </div>
                        </div>

                        {/* Reason */}
                        {req.reason && (
                            <div style={{
                                fontSize: '13px', color: '#6B7280',
                                background: '#F9FAFB', borderRadius: '10px',
                                padding: '10px 12px', marginBottom: '12px',
                                borderLeft: '3px solid #E5E7EB',
                            }}>
                                "{req.reason}"
                            </div>
                        )}

                        {/* Action buttons — only for pending */}
                        {req.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => handleAction(req, 'rejected')}
                                    disabled={actioningId === req.id}
                                    style={{
                                        flex: 1, padding: '11px',
                                        background: '#FEE2E2', color: '#DC2626',
                                        fontWeight: 700, fontSize: '13px',
                                        border: 'none', borderRadius: '12px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    }}
                                >
                                    <XCircle size={16} /> Reject
                                </button>
                                <button
                                    onClick={() => handleAction(req, 'approved')}
                                    disabled={actioningId === req.id}
                                    style={{
                                        flex: 2, padding: '11px',
                                        background: 'linear-gradient(135deg, #00A651, #007A3D)',
                                        color: 'white',
                                        fontWeight: 700, fontSize: '13px',
                                        border: 'none', borderRadius: '12px', cursor: 'pointer',
                                        boxShadow: '0 4px 14px rgba(0,166,81,0.3)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    }}
                                >
                                    <CheckCircle size={16} /> Approve
                                </button>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}