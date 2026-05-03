'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const STATUS_OPTIONS = [
    { value: 'P', label: '🟢 Present (P)' },
    { value: '2P', label: '🔵 Double Present (2P)' },
    { value: 'H', label: '🟡 Half Day (H)' },
    { value: 'OT', label: '🟠 Overtime (OT)' },
    { value: 'L', label: '🩷 Leave (L)' },
]

const TYPE_OPTIONS = [
    { value: 'correction', label: '📝 Attendance Correction' },
    { value: 'leave', label: '🏖️ Leave Request' },
    { value: 'half_day', label: '⏰ Half Day' },
    { value: 'ot_claim', label: '💪 OT Claim' },
]

export default function NewRequestPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState('')
    const [form, setForm] = useState({
        request_type: 'correction',
        date: new Date().toISOString().split('T')[0],
        requested_status: 'P',
        reason: '',
    })

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setMsg('')
        try {
            const res = await fetch('/api/employee/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (res.ok) {
                setMsg('✅ Request submitted!')
                setTimeout(() => router.push('/employee/requests'), 900)
            } else {
                setMsg('❌ ' + (data.error ?? 'Failed'))
            }
        } catch {
            setMsg('❌ Network error')
        }
        setSaving(false)
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '12px 14px', borderRadius: '10px',
        border: '1.5px solid #E5E7EB', fontSize: '14px', color: '#111827',
        background: 'white', outline: 'none', boxSizing: 'border-box',
    }
    const labelStyle: React.CSSProperties = {
        display: 'block', fontWeight: 700, fontSize: '11px', color: '#6B7280',
        marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em',
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link href="/employee/requests" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', color: '#374151',
                }}>
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 style={{ fontWeight: 800, fontSize: '20px', color: '#111827', margin: 0 }}>New Request</h1>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '1px' }}>Raise attendance correction</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                        <div>
                            <label style={labelStyle}>Request Type *</label>
                            <select name="request_type" value={form.request_type} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Date *</label>
                            <input name="date" type="date" required value={form.date} onChange={handleChange} style={inputStyle} />
                        </div>

                        <div>
                            <label style={labelStyle}>Requested Status *</label>
                            <select name="requested_status" value={form.requested_status} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Reason</label>
                            <textarea name="reason" value={form.reason} onChange={handleChange as any}
                                placeholder="Explain why this correction is needed..."
                                rows={3}
                                style={{ ...inputStyle, resize: 'none', lineHeight: '1.5' }} />
                        </div>
                    </div>
                </div>

                {msg && (
                    <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '14px', color: msg.startsWith('✅') ? '#059669' : '#EF4444' }}>
                        {msg}
                    </div>
                )}

                <button type="submit" disabled={saving} style={{
                    width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                    background: saving ? '#9CA3AF' : 'linear-gradient(135deg,#00A651,#059669)',
                    color: 'white', fontWeight: 800, fontSize: '16px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(0,166,81,0.3)',
                }}>
                    {saving ? '⏳ Submitting...' : '📤 Submit Request'}
                </button>
            </form>
        </div>
    )
}