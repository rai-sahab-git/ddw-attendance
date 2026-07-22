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

            <div className="page-head">
                <div>
                    <h1>Requests</h1>
                    <p>{counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected</p>
                </div>
            </div>

            {/* ── BOTTOM SHEET / CENTER MODAL ── */}
            {actionItem && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 16,
                    }}
                    onClick={() => setActionItem(null)}
                >
                    <div
                        style={{
                            background: 'var(--panel)',
                            borderRadius: 20,
                            width: '100%', maxWidth: 480,
                            maxHeight: '85vh',
                            overflowY: 'auto',
                            padding: '8px 20px 24px',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Handle bar */}
                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '16px' }}>
                            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#E5E7EB' }} />
                        </div>

                        {/* Title */}
                        <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text)', marginBottom: '14px' }}>
                            Review Request
                        </div>

                        {/* Request info card */}
                        <div className="tint-success" style={{
                            border: '1px solid var(--border)',
                            borderRadius: '14px', padding: '14px', marginBottom: '16px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text)' }}>
                                        {actionItem.employees?.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
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
                                <div style={{ background: 'var(--panel)', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: 'var(--text)' }}>
                                    📋 {TYPE_LABEL[actionItem.request_type] ?? actionItem.request_type}
                                </div>
                                <div style={{ background: 'var(--panel)', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: 'var(--text)' }}>
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
                                    marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)',
                                    fontStyle: 'italic', background: 'var(--panel)',
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
                                color: 'var(--text-muted)', textTransform: 'uppercase',
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
                                    border: '1.5px solid var(--border)', fontSize: '14px', outline: 'none',
                                    boxSizing: 'border-box', background: 'var(--input-bg)', color: 'var(--input-text)',
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

            {/* ── STATS ── */}
            <div className="kpi-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                {[
                    { label: 'Pending', value: counts.pending, tint: 'tint-warn', fg: 'var(--tint-warn-fg)' },
                    { label: 'Approved', value: counts.approved, tint: 'tint-success', fg: 'var(--tint-success-fg)' },
                    { label: 'Rejected', value: counts.rejected, tint: 'tint-danger', fg: 'var(--tint-danger-fg)' },
                ].map(({ label, value, tint, fg }) => (
                    <div key={label} className={`kpi-card ${tint}`} style={{ textAlign: 'center' }}>
                        <div className="kpi-card__value" style={{ color: fg }}>{value}</div>
                        <div className="kpi-card__label">{label}</div>
                    </div>
                ))}
            </div>

            {/* ── FILTER TABS ── */}
            <div className="seg-tabs">
                {(['pending', 'all', 'approved', 'rejected'] as const).map(f => (
                    <button
                        key={f}
                        type="button"
                        onClick={() => setFilter(f)}
                        className={`seg-tabs__btn${filter === f ? ' is-active' : ''}`}
                    >
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* ── REQUEST LIST ── */}
            {filtered.length === 0 ? (
                <div style={{
                    background: 'var(--panel)', borderRadius: '16px', padding: '40px 20px',
                    textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '6px' }}>
                        No {filter === 'all' ? '' : filter} requests
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
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
                                background: 'var(--panel)', borderRadius: '16px', padding: '14px 16px',
                                boxShadow: 'var(--shadow-sm)',
                                border: '1.5px solid var(--border)',
                            }}>
                                {/* Top row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text)' }}>
                                            {req.employees?.name}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {req.employees?.emp_code} &nbsp;•&nbsp; {TYPE_LABEL[req.request_type] ?? req.request_type}
                                        </div>
                                    </div>
                                    <div className={isPending ? 'tint-warn' : isApproved ? 'tint-success' : 'tint-danger'} style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        borderRadius: '20px', padding: '4px 10px',
                                    }}>
                                        {isPending && <Clock size={12} />}
                                        {isApproved && <CheckCircle size={12} />}
                                        {!isPending && !isApproved && <XCircle size={12} />}
                                        <span style={{
                                            fontWeight: 700, fontSize: '11px', textTransform: 'capitalize',
                                        }}>
                                            {req.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Meta row */}
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                                    <span style={{
                                        background: 'var(--gray-50)', borderRadius: '8px',
                                        padding: '4px 10px', fontSize: '12px', color: 'var(--text)',
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
                                        fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic',
                                        background: 'var(--gray-50)', borderRadius: '10px', padding: '8px 12px',
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
                                        type="button"
                                        onClick={() => { setActionItem(req); setReviewNote('') }}
                                        className="tint-warn"
                                        style={{
                                            width: '100%', padding: '11px', borderRadius: '12px',
                                            fontWeight: 700, fontSize: '13px',
                                            border: '1.5px solid var(--border)',
                                            cursor: 'pointer', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        }}>
                                        Review Request
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