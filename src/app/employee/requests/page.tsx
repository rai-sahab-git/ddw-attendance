import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock, Plus } from 'lucide-react'

export default async function EmployeeRequestsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: emp } = await supabase
        .from('employees').select('id, name').eq('user_id', user.id).single()
    if (!emp) redirect('/login')

    const { data: requests } = await supabase
        .from('attendance_requests')
        .select('*')
        .eq('employee_id', emp.id)
        .order('created_at', { ascending: false })

    const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
        P: { bg: '#D1FAE5', color: '#059669' },
        '2P': { bg: '#DBEAFE', color: '#2563EB' },
        A: { bg: '#FEE2E2', color: '#DC2626' },
        H: { bg: '#FEF3C7', color: '#D97706' },
        OT: { bg: '#FFEDD5', color: '#EA580C' },
        L: { bg: '#FCE7F3', color: '#DB2777' },
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827' }}>My Requests</div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>Attendance corrections</div>
                </div>
                <Link href="/employee/requests/new" style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                    color: 'white', fontWeight: 700, fontSize: '13px',
                    padding: '9px 16px', borderRadius: '12px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                }}>
                    <Plus size={16} /> New
                </Link>
            </div>

            {/* Empty state */}
            {(!requests || requests.length === 0) && (
                <div style={{
                    background: 'white', borderRadius: '20px',
                    padding: '48px 24px', textAlign: 'center',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#111827', marginBottom: '6px' }}>
                        No requests yet
                    </div>
                    <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '20px' }}>
                        Raise a request if your attendance needs correction
                    </div>
                    <Link href="/employee/requests/new" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: '#1a1a2e', color: 'white',
                        padding: '10px 20px', borderRadius: '12px',
                        textDecoration: 'none', fontWeight: 700, fontSize: '14px',
                    }}>
                        <Plus size={16} /> Raise Request
                    </Link>
                </div>
            )}

            {/* Request list */}
            {requests?.map(req => {
                const statusStyle = STATUS_STYLE[req.requested_status] ?? { bg: '#F3F4F6', color: '#374151' }
                const dateStr = new Date(req.date).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                })
                const createdStr = new Date(req.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short',
                })

                return (
                    <div key={req.id} style={{
                        background: 'white', borderRadius: '18px', padding: '16px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        border: req.status === 'pending' ? '2px solid #FEF3C7'
                            : req.status === 'approved' ? '2px solid #D1FAE5'
                                : '2px solid #FEE2E2',
                    }}>

                        {/* Top row */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'flex-start', marginBottom: '12px',
                        }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>{dateStr}</div>
                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                                    Submitted on {createdStr}
                                </div>
                            </div>

                            {/* Status badge */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                padding: '5px 12px', borderRadius: '999px',
                                fontSize: '12px', fontWeight: 700,
                                background: req.status === 'pending' ? '#FEF3C7'
                                    : req.status === 'approved' ? '#D1FAE5'
                                        : '#FEE2E2',
                                color: req.status === 'pending' ? '#D97706'
                                    : req.status === 'approved' ? '#059669'
                                        : '#DC2626',
                            }}>
                                {req.status === 'pending' && <Clock size={11} />}
                                {req.status === 'approved' && <CheckCircle size={11} />}
                                {req.status === 'rejected' && <XCircle size={11} />}
                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </div>
                        </div>

                        {/* Requested status */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            marginBottom: req.reason ? '10px' : '0',
                        }}>
                            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Requested:</span>
                            <span style={{
                                background: statusStyle.bg, color: statusStyle.color,
                                fontWeight: 800, fontSize: '12px',
                                padding: '3px 10px', borderRadius: '999px',
                            }}>
                                {req.requested_status}
                            </span>
                        </div>

                        {/* Reason */}
                        {req.reason && (
                            <div style={{
                                fontSize: '13px', color: '#6B7280',
                                background: '#F9FAFB', borderRadius: '10px',
                                padding: '10px 12px',
                                borderLeft: '3px solid #E5E7EB',
                            }}>
                                "{req.reason}"
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}