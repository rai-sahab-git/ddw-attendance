'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Employee, MonthlySalary } from '@/types'
import type { SalaryCalculation } from '@/lib/salary-calculator'
import { formatCurrency } from '@/lib/utils'

type Props = {
    employee: Employee
    month: number
    year: number
    savedRecord: MonthlySalary | null
    currentSalary: SalaryCalculation
    monthlyAdvance: number
}

export default function SalaryEditForm({ employee, month, year, savedRecord, currentSalary, monthlyAdvance }: Props) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState('')

    const [form, setForm] = useState({
        ot_amount: String(savedRecord?.ot_amount ?? 0),
        extra_work_amount: String(savedRecord?.extra_work_amount ?? 0),
        other_deductions: String(savedRecord?.other_deductions ?? 0),
        paid_amount: String(savedRecord?.paid_amount ?? 0),
    })

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    // Live preview of payable amount
    const otAmt = parseFloat(form.ot_amount) || 0
    const extraAmt = parseFloat(form.extra_work_amount) || 0
    const otherDed = parseFloat(form.other_deductions) || 0
    const paidAmt = parseFloat(form.paid_amount) || 0
    const livePayable = Math.max(0,
        currentSalary.grossEarning
        - currentSalary.absentDeduction
        - currentSalary.halfdayDeduction
        + otAmt + extraAmt - monthlyAdvance - otherDed
    )
    const liveBalance = livePayable - paidAmt

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setMsg('')
        try {
            const res = await fetch(`/api/admin/salary/${employee.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    month, year,
                    ot_amount: otAmt,
                    extra_work_amount: extraAmt,
                    other_deductions: otherDed,
                    paid_amount: paidAmt,
                }),
            })
            const data = await res.json()
            if (res.ok) {
                setMsg('✅ Saved!')
                setTimeout(() => router.refresh(), 600)
            } else {
                setMsg('❌ ' + (data.error ?? 'Save failed'))
            }
        } catch {
            setMsg('❌ Network error')
        }
        setSaving(false)
        setTimeout(() => setMsg(''), 3000)
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '12px 14px', borderRadius: '10px',
        border: '1.5px solid #E5E7EB', fontSize: '15px', color: '#111827',
        background: 'white', outline: 'none', boxSizing: 'border-box',
        fontWeight: 700,
    }
    const labelStyle: React.CSSProperties = {
        display: 'block', fontWeight: 700, fontSize: '11px', color: '#6B7280',
        marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em',
    }

    return (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* OT & Extras */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                    Extra Earnings
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <label style={labelStyle}>OT Amount (₹)</label>
                        <input name="ot_amount" type="number" min="0" step="0.01"
                            value={form.ot_amount} onChange={handleChange} style={inputStyle} />
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>Manual OT amount for the month</div>
                    </div>
                    <div>
                        <label style={labelStyle}>Extra Work Amount (₹)</label>
                        <input name="extra_work_amount" type="number" min="0" step="0.01"
                            value={form.extra_work_amount} onChange={handleChange} style={inputStyle} />
                    </div>
                </div>
            </div>

            {/* Deductions */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                    Deductions
                </div>
                <div>
                    <label style={labelStyle}>Other Deductions (₹)</label>
                    <input name="other_deductions" type="number" min="0" step="0.01"
                        value={form.other_deductions} onChange={handleChange} style={inputStyle} />
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>
                        Advance this month: {formatCurrency(monthlyAdvance)} (auto-deducted)
                    </div>
                </div>
            </div>

            {/* Live Preview */}
            <div style={{ background: 'linear-gradient(135deg,#F0FDF4,#ECFDF5)', borderRadius: '16px', padding: '16px', border: '1.5px solid #86EFAC' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                    Live Preview
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>Net Payable</div>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: '#059669' }}>{formatCurrency(livePayable)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>Balance</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: liveBalance > 0 ? '#EF4444' : '#059669' }}>
                            {liveBalance > 0 ? `-${formatCurrency(liveBalance)}` : '✓ Clear'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Paid Amount */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                    Payment
                </div>
                <div>
                    <label style={labelStyle}>Amount Paid (₹)</label>
                    <input name="paid_amount" type="number" min="0" step="0.01"
                        value={form.paid_amount} onChange={handleChange}
                        style={{ ...inputStyle, borderColor: '#86EFAC', background: '#F0FDF4' }} />
                    <button type="button"
                        onClick={() => setForm(prev => ({ ...prev, paid_amount: String(Math.max(0, livePayable)) }))}
                        style={{
                            marginTop: '8px', padding: '8px 14px', borderRadius: '8px',
                            background: '#F0FDF4', color: '#059669', fontWeight: 700, fontSize: '12px',
                            border: '1px solid #86EFAC', cursor: 'pointer',
                        }}>
                        Set Full Amount → {formatCurrency(livePayable)}
                    </button>
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
                color: 'white', fontWeight: 800, fontSize: '16px', cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(0,166,81,0.3)',
            }}>
                {saving ? '⏳ Saving...' : '💾 Save Salary'}
            </button>
        </form>
    )
}