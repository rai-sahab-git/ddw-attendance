'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const STATUS_OPTIONS = [
    { value: 'P', label: 'Present', emoji: '✅', color: '#059669', bg: '#D1FAE5' },
    { value: '2P', label: 'Double P', emoji: '💪', color: '#2563EB', bg: '#DBEAFE' },
    { value: 'H', label: 'Half Day', emoji: '🌗', color: '#D97706', bg: '#FEF3C7' },
    { value: 'OT', label: 'OT', emoji: '⏰', color: '#EA580C', bg: '#FFEDD5' },
    { value: 'L', label: 'Leave', emoji: '🏠', color: '#DB2777', bg: '#FCE7F3' },
]

export default function NewRequestPage() {
    const router = useRouter()
    const supabase = createClient()

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        requested_status: 'P',
        reason: '',
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError('')

        const res = await fetch('/api/employee-auth/me')
        const data = await res.json()

        if (!res.ok || !data.id) {
            setError('Session expired. Please login again.')
            setSaving(false)
            return
        }

        const { error: insertError } = await supabase.from('attendance_requests').insert({
            employee_id: data.id,
            date: form.date,
            requested_status: form.requested_status,
            reason: form.reason,
            status: 'pending',
        })

        if (insertError) {
            setError('Failed to submit. Please try again.')
            setSaving(false)
            return
        }

        router.push('/employee/requests')
        router.refresh()
    }

    const selected = STATUS_OPTIONS.find(s => s.value === form.requested_status)!

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link href="/employee/dashboard" style={{ width: '38px', height: '38px', background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                    <ArrowLeft size={18} color="#374151" />
                </Link>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '18px', color: '#111827' }}>Raise Request</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>Attendance correction</div>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px' }}>📅 Date</label>
                        <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                            style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '8px' }}>🔄 Request Status</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                            {STATUS_OPTIONS.map(opt => (
                                <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, requested_status: opt.value }))}
                                    style={{ padding: '8px 16px', borderRadius: '12px', border: `2px solid ${form.requested_status === opt.value ? opt.color : '#E5E7EB'}`, background: form.requested_status === opt.value ? opt.bg : 'white', color: form.requested_status === opt.value ? opt.color : '#6B7280', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {opt.emoji} {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px' }}>💬 Reason</label>
                        <textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                            placeholder="Please explain why you're requesting this change..." rows={3}
                            style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '12px', fontSize: '14px', outline: 'none', resize: 'none' as const, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' as const }} />
                    </div>
                </div>

                <div style={{ background: selected.bg, borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: `2px solid ${selected.color}22` }}>
                    <span style={{ fontSize: '28px' }}>{selected.emoji}</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: selected.color }}>Requesting: {selected.label}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                            for {new Date(form.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                </div>

                {error && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '12px 14px', color: '#DC2626', fontSize: '13px' }}>⚠️ {error}</div>
                )}

                <button type="submit" disabled={saving} style={{ width: '100%', padding: '16px', background: saving ? '#9CA3AF' : 'linear-gradient(135deg, #1a1a2e, #16213e)', color: 'white', fontWeight: 800, fontSize: '15px', border: 'none', borderRadius: '16px', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 6px 20px rgba(0,0,0,0.2)' }}>
                    {saving ? 'Submitting...' : '📤 Submit Request'}
                </button>
            </form>
        </div>
    )
}