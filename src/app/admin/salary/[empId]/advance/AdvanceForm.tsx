'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
    employeeId: string
    employeeName: string
    month: number
    year: number
}

export default function AdvanceForm({ employeeId, employeeName, month, year }: Props) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState('')
    const [form, setForm] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        deduct_month: String(month),
        deduct_year: String(year),
        deduct_now: true,
    })

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        const { name, value, type } = e.target
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.amount || parseFloat(form.amount) <= 0) {
            setMsg('❌ Enter valid amount')
            return
        }
        setSaving(true)
        setMsg('')
        try {
            const res = await fetch('/api/admin/advance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_id: employeeId,
                    amount: parseFloat(form.amount),
                    date: form.date,
                    description: form.description,
                    deduct_month: form.deduct_now ? parseInt(form.deduct_month) : null,
                    deduct_year: form.deduct_now ? parseInt(form.deduct_year) : null,
                    is_deducted: false,
                }),
            })
            const data = await res.json()
            if (res.ok) {
                setMsg('✅ Advance added!')
                setTimeout(() => router.back(), 800)
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
        border: '1.5px solid #E5E7EB', fontSize: '15px', color: '#111827',
        background: 'white', outline: 'none', boxSizing: 'border-box', fontWeight: 600,
    }
    const labelStyle: React.CSSProperties = {
        display: 'block', fontWeight: 700, fontSize: '11px', color: '#6B7280',
        marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em',
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    <div>
                        <label style={labelStyle}>Amount (₹) *</label>
                        <input name="amount" type="number" required min="1" step="0.01"
                            value={form.amount} onChange={handleChange}
                            placeholder="Enter advance amount" style={{ ...inputStyle, fontSize: '20px', fontWeight: 800 }} />
                    </div>

                    <div>
                        <label style={labelStyle}>Date *</label>
                        <input name="date" type="date" required value={form.date} onChange={handleChange} style={inputStyle} />
                    </div>

                    <div>
                        <label style={labelStyle}>Description</label>
                        <input name="description" value={form.description} onChange={handleChange}
                            placeholder="e.g. Emergency advance, Festival advance" style={inputStyle} />
                    </div>
                </div>
            </div>

            {/* Deduction month */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                    Deduction
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>Deduct in a specific month</div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Which month's salary to deduct from</div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
                        <input type="checkbox" name="deduct_now" checked={form.deduct_now} onChange={handleChange}
                            style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{
                            position: 'absolute', inset: 0, borderRadius: '13px',
                            background: form.deduct_now ? '#00A651' : '#D1D5DB', transition: 'background 0.2s',
                        }}>
                            <span style={{
                                position: 'absolute', top: '3px', left: form.deduct_now ? '25px' : '3px',
                                width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }} />
                        </span>
                    </label>
                </div>

                {form.deduct_now && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={labelStyle}>Month</label>
                            <select name="deduct_month" value={form.deduct_month} onChange={handleChange}
                                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                                {months.map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Year</label>
                            <select name="deduct_year" value={form.deduct_year} onChange={handleChange}
                                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                                {[year - 1, year, year + 1].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {msg && (
                <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '14px', color: msg.startsWith('✅') ? '#059669' : '#EF4444' }}>
                    {msg}
                </div>
            )}

            <button type="submit" disabled={saving} style={{
                width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                background: saving ? '#9CA3AF' : 'linear-gradient(135deg,#F59E0B,#D97706)',
                color: 'white', fontWeight: 800, fontSize: '16px', cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
            }}>
                {saving ? '⏳ Saving...' : '💰 Add Advance'}
            </button>
        </form>
    )
}