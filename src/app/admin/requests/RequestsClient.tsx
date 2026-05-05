'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Filter } from 'lucide-react'

type Employee = { id: string; name: string; emp_code: string }
type Request = {
    id: string
    employee_id: string
    request_type: string
    date: string
    date_from?: string
    date_to?: string
    requested_status?: string
    ot_hours?: number
    reason?: string
    status: 'pending' | 'approved' | 'rejected'
    review_note?: string
    reviewed_at?: string
    created_at: string
    employees: Employee
}
type Counts = { pending: number; approved: number; rejected: number }

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    P: { bg: '#D1FAE5', color: '#059669' },
    '2P': { bg: '#DBEAFE', color: '#2563EB' },
    A: { bg: '#FEE2E2', color: '#DC2626' },
    H: { bg: '#FEF3C7', color: '#D97706' },
    OT: { bg: '#FFEDD5', color: '#EA580C' },
    '2OT': { bg: '#EDE9FE', color: '#7C3AED' },
    L: { bg: '#FCE7F3', color: '#DB2777' },
}

const TYPE_LABEL: Record<string, string> = {
    correction: '📝 Correction',
    leave: '🏖️ Leave',
    half_day: '⏰ Half Day',
    ot_claim: '💪 OT Claim',
}

export default function RequestsClient({ requests, counts }: { requests: Request[]; counts: Counts }) {
    const router = useRouter()
    const [, startTransition] = useTransition()
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
    const [actionItem, setActionItem] = useState<Request | null>(null)
    const [reviewNote, setReviewNote] = useState('')
    const [loading, setLoading] = useState<string | null>(null)
    const [msg, setMsg] = useState('')

    const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

    async function handleAction(requestId: string, action: 'approved' | 'rejected') {
        setLoading(requestId + action)
        setMsg('')
        try {
            const res = await fetch(`/api/admin/requests/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action, review_note: reviewNote }),
            })
            const data = await res.json()
            if (res.ok) {
                setMsg(action === 'approved' ? '✅ Approved!' : '❌ Rejected')
                setActionItem(null)
                setReviewNote('')
                startTransition(() => router.refresh())
            } else {
                setMsg('❌ ' + (data.error ?? 'Failed'))
            }
        } catch {
            setMsg('❌ Network error')
        }
        setLoading(null)
        setTimeout(() => setMsg(''), 3000)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Action Bottom Sheet */}
            {actionItem && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 50,
                    background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                }} onClick={() => setActionItem(null)}>
                    <div style={{
                        background: 'white', borderRadius: '20px 20px 0 0', padding: '20px',
                        width: '100%', maxWidth: '480px',
                        paddingBottom: '90px',
                        maxHeight: '85vh',        // ✅ screen ka 85% se zyada nahi jaayega
                        overflowY: 'auto',        // ✅ scroll enable
                    }}
                        onClick={e => e.stopPropagation()}>

                        {/* Request Summary */}
                        <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '12px', marginBottom: '14px' }}>
                            <div style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>
                                {actionItem.employees?.name}
                                <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '12px' }}> • {actionItem.employees?.emp_code}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                                {TYPE_LABEL[actionItem.request_type] ?? actionItem.request_type} &nbsp;•&nbsp;
                                {new Date(actionItem.date ?? actionItem.date_from ?? '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            {actionItem.requested_status && (
                                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Requested:</span>
                                    <span style={{
                                        ...STATUS_STYLE[actionItem.requested_status],
                                        borderRadius: '6px', padding: '2px 8px', fontSize: '12px', fontWeight: 800,
                                    }}>
                                        {actionItem.requested_status}
                                    </span>
                                </div>
                            )}
                            {actionItem.reason && (
                                <div style={{ marginTop: '6px', fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>
                                    "{actionItem.reason}"
                                </div>
                            )}
                        </div>

                        {/* Review Note */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                Review Note (optional)
                            </label>
                            <input
                                value={reviewNote}
                                onChange={e => setReviewNote(e.target.value)}
                                placeholder="e.g. Verified with manager"
                                style={{
                                    width: '100%', padding: '11px 14px', borderRadius: '10px',
                                    border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button
                                onClick={() => handleAction(actionItem.id, 'rejected')}
                                disabled={!!loading}
                                style={{
                                    padding: '13px', borderRadius: '12px', fontWeight: 800, fontSize: '14px',
                                    background: loading === actionItem.id + 'rejected' ? '#9CA3AF' : '#FEE2E2',
                                    color: '#DC2626', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                }}>
                                <XCircle size={16} />
                                {loading === actionItem.id + 'rejected' ? 'Rejecting...' : 'Reject'}
                            </button>
                            <button
                                onClick={() => handleAction(actionItem.id, 'approved')}
                                disabled={!!loading}
                                style={{
                                    padding: '13px', borderRadius: '12px', fontWeight: 800, fontSize: '14px',
                                    background: loading === actionItem.id + 'approved' ? '#9CA3AF' : '#00A651',
                                    color: 'white', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                }}>
                                <CheckCircle size={16} />
                                {loading === actionItem.id + 'approved' ? 'Approving...' : 'Approve'}
                            </button>
                        </div>

                        {msg && (
                            <div style={{ marginTop: '10px', textAlign: 'center', fontWeight: 700, fontSize: '13px', color: msg.startsWith('✅') ? '#059669' : '#EF4444' }}>
                                {msg}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontWeight: 800, fontSize: '22px', color: '#111827', margin: 0 }}>Requests</h1>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>Attendance correction requests</p>
                </div>
                {counts.pending > 0 && (
                    <div style={{
                        background: '#FEF3C7', color: '#B45309',
                        borderRadius: '20px', padding: '6px 14px',
                        fontWeight: 800, fontSize: '13px',
                    }}>
                        {counts.pending} pending
                    </div>
                )}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {[
                    { label: 'Pending', value: counts.pending, bg: '#FEF3C7', color: '#D97706' },
                    { label: 'Approved', value: counts.approved, bg: '#F0FDF4', color: '#059669' },
                    { label: 'Rejected', value: counts.rejected, bg: '#FEF2F2', color: '#EF4444' },
                ].map(({ label, value, bg, color }) => (
                    <div key={label} style={{ background: bg, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 900, color }}>{value}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', background: '#F3F4F6', borderRadius: '12px', padding: '4px' }}>
                {(['pending', 'all', 'approved', 'rejected'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{
                            flex: 1, padding: '8px 4px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                            fontWeight: 700, fontSize: '12px', textTransform: 'capitalize',
                            background: filter === f ? 'white' : 'transparent',
                            color: filter === f ? '#111827' : '#6B7280',
                            boxShadow: filter === f ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        }}>
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Request List */}
            {filtered.length === 0 ? (
                <div style={{
                    background: 'white', borderRadius: '16px', padding: '40px 20px',
                    textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginBottom: '6px' }}>
                        No {filter === 'all' ? '' : filter} requests
                    </div>
                    <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                        {filter === 'pending' ? 'All caught up!' : 'Nothing here yet'}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filtered.map(req => {
                        const isPending = req.status === 'pending'
                        const isApproved = req.status === 'approved'
                        const dateStr = new Date(req.date ?? req.date_from ?? '').toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                        })
                        const createdStr = new Date(req.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short',
                        })

                        return (
                            <div key={req.id} style={{
                                background: 'white', borderRadius: '14px', padding: '14px',
                                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                                borderLeft: `4px solid ${isPending ? '#F59E0B' : isApproved ? '#00A651' : '#EF4444'}`,
                            }}>
                                {/* Top row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>
                                            {req.employees?.name}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>
                                            {req.employees?.emp_code} • {TYPE_LABEL[req.request_type] ?? req.request_type}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {isPending && <Clock size={14} color="#F59E0B" />}
                                        {isApproved && <CheckCircle size={14} color="#00A651" />}
                                        {!isPending && !isApproved && <XCircle size={14} color="#EF4444" />}
                                        <span style={{
                                            fontWeight: 700, fontSize: '11px', textTransform: 'capitalize',
                                            color: isPending ? '#D97706' : isApproved ? '#059669' : '#EF4444',
                                        }}>
                                            {req.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Date + Requested status */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: req.reason ? '8px' : '0' }}>
                                    <span style={{ fontSize: '12px', color: '#6B7280' }}>{dateStr}</span>
                                    {req.requested_status && (
                                        <>
                                            <span style={{ color: '#D1D5DB', fontSize: '12px' }}>→</span>
                                            <span style={{
                                                ...STATUS_STYLE[req.requested_status] ?? { bg: '#F3F4F6', color: '#374151' },
                                                borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 800,
                                            }}>
                                                {req.requested_status}
                                            </span>
                                        </>
                                    )}
                                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#D1D5DB' }}>
                                        {createdStr}
                                    </span>
                                </div>

                                {/* Reason */}
                                {req.reason && (
                                    <div style={{
                                        fontSize: '12px', color: '#6B7280', fontStyle: 'italic',
                                        background: '#F9FAFB', borderRadius: '8px', padding: '6px 10px',
                                        marginBottom: isPending ? '10px' : '0',
                                    }}>
                                        "{req.reason}"
                                    </div>
                                )}

                                {/* Review note (approved/rejected) */}
                                {req.review_note && !isPending && (
                                    <div style={{
                                        fontSize: '11px', color: isApproved ? '#059669' : '#EF4444',
                                        marginTop: '6px',
                                    }}>
                                        📝 {req.review_note}
                                    </div>
                                )}

                                {/* Action buttons (pending only) */}
                                {isPending && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                                        <button
                                            onClick={() => { setActionItem(req); setReviewNote('') }}
                                            style={{
                                                padding: '10px', borderRadius: '10px', fontWeight: 700, fontSize: '13px',
                                                background: '#FEF9C3', color: '#854D0E', border: 'none', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                            }}>
                                            Review
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.id, 'approved')}
                                            disabled={!!loading}
                                            style={{
                                                padding: '10px', borderRadius: '10px', fontWeight: 700, fontSize: '13px',
                                                background: loading === req.id + 'approved' ? '#D1FAE5' : '#00A651',
                                                color: 'white', border: 'none', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                            }}>
                                            <CheckCircle size={14} />
                                            {loading === req.id + 'approved' ? '...' : 'Approve'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Global msg (for quick approve from card) */}
            {msg && !actionItem && (
                <div style={{
                    position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
                    background: '#1a1a2e', color: 'white', borderRadius: '20px', padding: '10px 20px',
                    fontWeight: 700, fontSize: '13px', zIndex: 40, whiteSpace: 'nowrap',
                }}>
                    {msg}
                </div>
            )}
        </div>
    )
}