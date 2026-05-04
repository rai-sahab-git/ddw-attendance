'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Employee } from '@/types'
import type { SalaryCalculation } from '@/lib/salary-calculator'

type Props = {
    employee: Employee
    month: number
    year: number
    savedRecord: any | null
    currentSalary: SalaryCalculation
    monthlyAdvance: number
}

export default function SalaryEditForm({ employee, month, year, savedRecord, currentSalary, monthlyAdvance }: Props) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState('')
    const [form, setForm] = useState({
        other_deductions: String(savedRecord?.other_deductions ?? 0),
        paid_amount: String(savedRecord?.paid_amount ?? 0),
        bonus_manual: String(savedRecord?.bonus_manual ?? 0),
    })

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const otherDed = parseFloat(form.other_deductions) || 0
    const paidAmt = parseFloat(form.paid_amount) || 0
    const bonusManual = parseFloat(form.bonus_manual) || 0

    const livePayable = Math.max(0, currentSalary.grossEarning + bonusManual - otherDed)
    const liveBalance = Math.max(0, livePayable - paidAmt)
    const liveOverpaid = Math.max(0, paidAmt - livePayable)

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setMsg('')
        try {
            const res = await fetch(`/api/admin/salary/${employee.id}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month, year, other_deductions: otherDed, paid_amount: paidAmt, bonus_manual: bonusManual }),
            })
            const data = await res.json()
            if (res.ok) { setMsg('✅ Saved!'); setTimeout(() => router.refresh(), 600) }
            else { setMsg('❌ ' + (data.error ?? 'Save failed')) }
        } catch { setMsg('❌ Network error') }
        setSaving(false)
        setTimeout(() => setMsg(''), 3000)
    }

    const inp: React.CSSProperties = {
        width: '100%', padding: '12px 14px', borderRadius: '10px',
        border: '1.5px solid #E5E7EB', fontSize: '15px',
        color: '#111827', background: 'white', outline: 'none',
        boxSizing: 'border-box', fontWeight: 700,
    }
    const lbl: React.CSSProperties = {
        display: 'block', fontWeight: 700, fontSize: '11px', color: '#6B7280',
        marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em',
    }

    return (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Attendance Breakdown */}
            <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '14px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#374151', marginBottom: '10px' }}>
                    📊 Attendance Breakdown
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                    <Row label="Monthly Salary" value={`₹${employee.monthly_salary.toLocaleString('en-IN')}`} color="#374151" bold />
                    <Row label="Per Day Rate (÷26)" value={`₹${currentSalary.perDay.toFixed(2)}`} color="#6B7280" small />
                    <Divider />

                    {/* Per-type rows from v2 calculator */}
                    {currentSalary.typeBreakdown.map(t => (
                        <Row
                            key={t.code}
                            label={`${t.code} × ${t.count}`}
                            value={t.amount > 0 ? `+₹${t.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` :
                                t.amount < 0 ? `-₹${Math.abs(t.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'}
                            color={t.amount > 0 ? '#059669' : t.amount < 0 ? '#EF4444' : '#9CA3AF'}
                            small
                        />
                    ))}

                    {currentSalary.absentDeduction > 0 &&
                        <Row label={`Absent deduction (${currentSalary.absentDays}d)`}
                            value={`-₹${currentSalary.absentDeduction.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                            color="#EF4444" small />}
                    {currentSalary.halfdayDeduction > 0 &&
                        <Row label={`Half day deduction (${currentSalary.halfDays}d)`}
                            value={`-₹${currentSalary.halfdayDeduction.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                            color="#F59E0B" small />}
                    {currentSalary.bonusTotal > 0 &&
                        <Row label="OT / Bonus Total"
                            value={`+₹${currentSalary.bonusTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                            color="#059669" small />}

                    <Divider />
                    {monthlyAdvance > 0 &&
                        <Row label="Advance (this month)"
                            value={`-₹${monthlyAdvance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                            color="#8B5CF6" />}

                    <Row label="Gross Earning"
                        value={`₹${currentSalary.grossEarning.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                        color="#059669" bold />
                </div>
            </div>

            {/* Manual Adjustments */}
            <div style={{ background: 'white', borderRadius: '14px', padding: '14px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#374151', marginBottom: '12px' }}>
                    ✨ Manual Adjustments
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <label style={lbl}>Extra Bonus / Addition (₹)</label>
                        <input name="bonus_manual" type="number" min="0" step="0.01"
                            value={form.bonus_manual} onChange={handleChange} placeholder="0" style={inp} />
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Festival bonus, incentive etc</span>
                    </div>
                    <div>
                        <label style={lbl}>Other Deductions (₹)</label>
                        <input name="other_deductions" type="number" min="0" step="0.01"
                            value={form.other_deductions} onChange={handleChange} placeholder="0" style={inp} />
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Fine, damage etc (advance auto deducted)</span>
                    </div>
                </div>
            </div>

            {/* Live Preview */}
            <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: '16px', padding: '16px' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Net Payable
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#34D399' }}>
                    ₹{livePayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                    Advance ₹{monthlyAdvance.toLocaleString('en-IN')} + Deductions ₹{otherDed.toLocaleString('en-IN')}
                </div>
                {liveBalance > 0 &&
                    <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 800, color: '#FCA5A5' }}>
                        ⚠️ Balance due: ₹{liveBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>}
                {liveOverpaid > 0 &&
                    <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 800, color: '#FCD34D' }}>
                        ⚠️ Overpaid: ₹{liveOverpaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>}
            </div>

            {/* Payment */}
            <div style={{ background: 'white', borderRadius: '14px', padding: '14px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#374151', marginBottom: '12px' }}>
                    💵 Payment
                </div>
                <label style={lbl}>Amount Paid (₹)</label>
                <input name="paid_amount" type="number" min="0" step="0.01"
                    value={form.paid_amount} onChange={handleChange}
                    style={{ ...inp, borderColor: '#86EFAC', background: '#F0FDF4' }} />
                <button type="button"
                    onClick={() => setForm(p => ({ ...p, paid_amount: String(Math.max(0, livePayable)) }))}
                    style={{
                        marginTop: '8px', padding: '8px 14px', borderRadius: '8px',
                        background: '#F0FDF4', color: '#059669', fontWeight: 700,
                        fontSize: '12px', border: '1px solid #86EFAC', cursor: 'pointer',
                    }}>
                    Set Full → ₹{livePayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </button>
            </div>

            {msg && (
                <div style={{
                    padding: '12px', borderRadius: '12px', textAlign: 'center', fontWeight: 700, fontSize: '14px',
                    background: msg.startsWith('✅') ? '#F0FDF4' : '#FEF2F2',
                    color: msg.startsWith('✅') ? '#059669' : '#EF4444',
                }}>{msg}</div>
            )}

            <button type="submit" disabled={saving} style={{
                padding: '16px', borderRadius: '14px', border: 'none',
                background: saving ? '#9CA3AF' : 'linear-gradient(135deg,#00A651,#059669)',
                color: 'white', fontWeight: 800, fontSize: '16px',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(0,166,81,0.3)',
            }}>
                {saving ? '⏳ Saving...' : '💾 Save Salary'}
            </button>
        </form>
    )
}

function Row({ label, value, color = '#374151', bold = false, small = false }: {
    label: string; value: string; color?: string; bold?: boolean; small?: boolean
}) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: small ? '12px' : '13px', color: '#6B7280', fontWeight: bold ? 800 : 500 }}>{label}</span>
            <span style={{ fontSize: small ? '12px' : '13px', color, fontWeight: bold ? 900 : 700 }}>{value}</span>
        </div>
    )
}
function Divider() {
    return <div style={{ height: '1px', background: '#E5E7EB', margin: '4px 0' }} />
}