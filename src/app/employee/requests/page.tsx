import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock, Plus } from 'lucide-react'
import { getEmployeeSession } from '@/lib/employee-auth'

export default async function EmployeeRequestsPage() {
    const emp = await getEmployeeSession()
    if (!emp) redirect('/login')

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '20px', color: '#111827' }}>My Requests</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>Attendance corrections</div>
                </div>
                <Link href="/employee/requests/new" style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg,#1a1a2e,#16213e)', color: 'white',
                    padding: '10px 16px', borderRadius: '12px', textDecoration: 'none',
                    fontWeight: 700, fontSize: '13px',
                }}>
                    <Plus size={16} /> New
                </Link>
            </div>

            {/* Empty state */}
            {(!requests || requests.length === 0) && (
                <div style={{ background: 'white', borderRadius: '20px', padding: '40px 20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#111827', marginBottom: '6px' }}>No requests yet</div>
                    <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>Raise a request if your attendance needs correction</div>
                    <Link href="/employee/requests/new" style={{
                        background: 'linear-gradient(135deg,#1a1a2e,#16213e)', color: 'white',
                        padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '14px',
                    }}>
                        Raise Request
                    </Link>
                </div>
            )}

            {/* Request list */}
            {requests?.map(req => {
                const statusStyle = STATUS_STYLE[req.requested_status] ?? { bg: '#F3F4F6', color: '#374151' }
                const dateStr = new Date(req.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                const createdStr = new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                return (
                    <div key={req.id} style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>{dateStr}</div>
                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>Submitted on {createdStr}</div>
                            </div>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                background: req.status === 'approved' ? '#D1FAE5' : req.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                                color: req.status === 'approved' ? '#059669' : req.status === 'rejected' ? '#DC2626' : '#D97706',
                                padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700,
                            }}>
                                {req.status === 'pending' && <Clock size={12} />}
                                {req.status === 'approved' && <CheckCircle size={12} />}
                                {req.status === 'rejected' && <XCircle size={12} />}
                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: req.reason ? '8px' : '0' }}>
                            <span style={{ fontSize: '12px', color: '#6B7280' }}>Requested:</span>
                            <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                                {req.requested_status}
                            </span>
                        </div>
                        {req.reason && (
                            <div style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic', background: '#F9FAFB', borderRadius: '8px', padding: '8px 10px' }}>
                                "{req.reason}"
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}