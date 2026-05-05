'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

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

const STATUS_STYLE: Record<string, { background: string; color: string }> = {
    P: { background: '#D1FAE5', color: '#059669' },
    '2P': { background: '#DBEAFE', color: '#2563EB' },
    A: { background: '#FEE2E2', color: '#DC2626' },
    H: { background: '#FEF3C7', color: '#D97706' },
    OT: { background: '#FFEDD5', color: '#EA580C' },
    '2OT': { background: '#EDE9FE', color: '#7C3AED' },
    L: { background: '#FCE7F3', color: '#DB2777' },
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
                setMsg(action === 'approved' ? '✅ Approved!' : '🚫 Rejected')
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

            {/* ── BOTTOM SHEET MODAL ── */}
            {actionItem && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    }}
                    onClick={() => setActionItem(null)}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '24px 24px 0 0',
                            width: '100%', maxWidth: '480px',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            padding: '8px 20px 100px',   /* top handle gap + bottom nav clearance */
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Handle bar */}
                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '16px' }}>
                            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#E5E7EB' }} />
                        </div>

                        {/* Title */}
                        <div style={{ fontWeight: 800, fontSize: '16px', color: '#111827', marginBottom: '14px' }}>
                            Review Request
                        </div>

                        {/* Request info card */}
                        <div style={{
                            background: 'linear-gradient(135deg,#F0FDF4,#ECFDF5)',
                            border: '1px solid #D1FAE5',
                            borderRadius: '14px', padding: '14px', marginBottom: '16px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#111827' }}>
                                        {actionItem.employees?.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                                        {actionItem.employees?.emp_code}
                                    </div>
                                </div>
                                <div style={{
                                    background: '#FEF3C7', color: '#92400E',
                                    borderRadius: '20px', padding: '4px 12px',
                                    fontSize: '11px', fontWeight: 700,
                                }}>
                                    ⏳ Pending
                                </div>
                            </div>

                            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ background: 'white', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: '#374151' }}>
                                    📋 {TYPE_LABEL[actionItem.request_type] ?? actionItem.request_type}
                                </div>
                                <div style={{ background: 'white', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: '#374151' }}>
                                    📅 {new Date(actionItem.date ?? actionItem.date_from ?? '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                {actionItem.requested_status && (
                                    <div style={{
                                        ...STATUS_STYLE[actionItem.requested_status],
                                        borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: 800,
                                    }}>
                                        → {actionItem.requested_status}
                                    </div>
                                )}
                            </div>

                            {actionItem.reason && (
                                <div style={{
                                    marginTop: '10px', fontSize: '12px', color: '#6B7280',
                                    fontStyle: 'italic', background: 'white',
                                    borderRadius: '8px', padding: '8px 10px',
                                }}>
                                    💬 "{actionItem.reason}"
                                </div>
                            )}
                        </div>

                        {/* Review Note input */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block', fontWeight: 700, fontSize: '11px',
                                color: '#6B7280', textTransform: 'uppercase',
                                letterSpacing: '0.06em', marginBottom: '7px',
                            }}>
                                Review Note (optional)
                            </label>
                            <input
                                value={reviewNote}
                                onChange={e => setReviewNote(e.target.value)}
                                placeholder="e.g. Verified with manager"
                                style={{
                                    width: '100%', padding: '12px 14px', borderRadius: '12px',
                                    border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none',
                                    boxSizing: 'border-box', background: '#FAFAFA',
                                }}
                            />
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <button
                                onClick={() => handleAction(actionItem.id, 'rejected')}
                                disabled={!!loading}
                                style={{
                                    padding: '15px', borderRadius: '14px',
                                    fontWeight: 800, fontSize: '15px',
                                    background: loading === actionItem.id + 'rejected' ? '#9CA3AF' : '#FEE2E2',
                                    color: '#DC2626', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    boxShadow: '0 2px 8px rgba(220,38,38,0.15)',
                                }}>
                                <XCircle size={18} />
                                {loading === actionItem.id + 'rejected' ? 'Rejecting...' : 'Reject'}
                            </button>
                            <button
                                onClick={() => handleAction(actionItem.id, 'approved')}
                                disabled={!!loading}
                                style={{
                                    padding: '15px', borderRadius: '14px',
                                    fontWeight: 800, fontSize: '15px',
                                    background: loading === actionItem.id + 'approved' ? '#9CA3AF' : '#00A651',
                                    color: 'white', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    boxShadow: '0 2px 8px rgba(0,166,81,0.35)',
                                }}>
                                <CheckCircle size={18} />
                                {loading === actionItem.id + 'approved' ? 'Approving...' : 'Approve'}
                            </button>
                        </div>

                        {msg && (
                            <div style={{
                                marginTop: '12px', textAlign: 'center',
                                fontWeight: 700, fontSize: '14px',
                                color: msg.startsWith('✅') ? '#059669' : '#EF4444',
                            }}>
                                {msg}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── HEADER ── */}
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

            {/* ── STATS ── */}
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

            {/* ── FILTER TABS ── */}
            <div style={{ display: 'flex', gap: '8px', background: '#F3F4F6', borderRadius: '12px', padding: '4px' }}>
                {(['pending', 'all', 'approved', 'rejected'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{
                            flex: 1, padding: '8px 4px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                            fontWeight: 700, fontSize: '12px', textTransform: 'capitalize',
                            background: filter === f ? 'white' : 'transparent',
                            color: filter === f ? '#111827' : '#6B7280',
                            boxShadow: filter === f ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 150ms ease',
                        }}>
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* ── REQUEST LIST ── */}
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
                                background: 'white', borderRadius: '16px', padding: '14px 16px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                                border: `1.5px solid ${isPending ? '#FEF3C7' : isApproved ? '#D1FAE5' : '#FEE2E2'}`,
                            }}>
                                {/* Top row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '15px', color: '#111827' }}>
                                            {req.employees?.name}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                                            {req.employees?.emp_code} &nbsp;•&nbsp; {TYPE_LABEL[req.request_type] ?? req.request_type}
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        background: isPending ? '#FEF9C3' : isApproved ? '#D1FAE5' : '#FEE2E2',
                                        borderRadius: '20px', padding: '4px 10px',
                                    }}>
                                        {isPending && <Clock size={12} color="#D97706" />}
                                        {isApproved && <CheckCircle size={12} color="#059669" />}
                                        {!isPending && !isApproved && <XCircle size={12} color="#DC2626" />}
                                        <span style={{
                                            fontWeight: 700, fontSize: '11px', textTransform: 'capitalize',
                                            color: isPending ? '#D97706' : isApproved ? '#059669' : '#DC2626',
                                        }}>
                                            {req.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Meta row */}
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                                    <span style={{
                                        background: '#F3F4F6', borderRadius: '8px',
                                        padding: '4px 10px', fontSize: '12px', color: '#374151',
                                    }}>
                                        📅 {dateStr}
                                    </span>
                                    {req.requested_status && STATUS_STYLE[req.requested_status] && (
                                        <span style={{
                                            ...STATUS_STYLE[req.requested_status],
                                            borderRadius: '8px', padding: '4px 10px',
                                            fontSize: '12px', fontWeight: 800,
                                        }}>
                                            → {req.requested_status}
                                        </span>
                                    )}
                                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#D1D5DB' }}>
                                        {createdStr}
                                    </span>
                                </div>

                                {/* Reason */}
                                {req.reason && (
                                    <div style={{
                                        fontSize: '12px', color: '#6B7280', fontStyle: 'italic',
                                        background: '#F9FAFB', borderRadius: '10px', padding: '8px 12px',
                                        marginBottom: '10px',
                                    }}>
                                        💬 "{req.reason}"
                                    </div>
                                )}

                                {/* Review note */}
                                {req.review_note && !isPending && (
                                    <div style={{
                                        fontSize: '11px', color: isApproved ? '#059669' : '#EF4444',
                                        marginBottom: '10px',
                                    }}>
                                        📝 {req.review_note}
                                    </div>
                                )}

                                {/* Review button (pending only) */}
                                {isPending && (
                                    <button
                                        onClick={() => { setActionItem(req); setReviewNote('') }}
                                        style={{
                                            width: '100%', padding: '11px', borderRadius: '12px',
                                            fontWeight: 700, fontSize: '13px',
                                            background: 'linear-gradient(135deg,#FFF7ED,#FEF3C7)',
                                            color: '#92400E', border: '1.5px solid #FDE68A',
                                            cursor: 'pointer', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        }}>
                                        ✍️ Review Request
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}