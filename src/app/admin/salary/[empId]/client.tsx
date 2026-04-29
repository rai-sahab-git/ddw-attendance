'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface Props {
    empId: string
    month: number
    year: number
    payableAmount: number
    initialPaidAmount: number
    initialOtAmount: number
    savedRecordId?: string
}

export default function SalaryDetailClient({
    empId, month, year,
    payableAmount, initialPaidAmount, initialOtAmount, savedRecordId
}: Props) {
    const supabase = createClient()
    const [paidAmount, setPaidAmount] = useState(initialPaidAmount)
    const [otAmount, setOtAmount] = useState(initialOtAmount)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const balance = payableAmount - paidAmount

    async function handleSave() {
        setSaving(true)
        await supabase.from('monthly_salary').upsert({
            ...(savedRecordId ? { id: savedRecordId } : {}),
            employee_id: empId, month, year,
            ot_amount: otAmount,
            paid_amount: paidAmount,
            payable_amount: payableAmount,
            balance_amount: balance,
        }, { onConflict: 'employee_id,month,year' })
        setSaved(true)
        setSaving(false)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div style={{ background: 'white', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>Payment Details</div>

            {/* OT Amount */}
            <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px' }}>
                    OT / Extra Amount (₹)
                </label>
                <input
                    type="number"
                    value={otAmount || ''}
                    onChange={e => setOtAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    style={{
                        width: '100%', padding: '10px 14px',
                        border: '2px solid #E5E7EB', borderRadius: '12px',
                        fontSize: '15px', fontWeight: 600,
                        outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = '#F97316'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
            </div>

            {/* Paid Amount */}
            <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px' }}>
                    Amount Paid (₹)
                </label>
                <input
                    type="number"
                    value={paidAmount || ''}
                    onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    style={{
                        width: '100%', padding: '10px 14px',
                        border: '2px solid #E5E7EB', borderRadius: '12px',
                        fontSize: '15px', fontWeight: 600,
                        outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = '#3B82F6'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
            </div>

            {/* Balance */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: balance > 0 ? '#FEF3C7' : '#D1FAE5',
                borderRadius: '12px', padding: '12px 16px',
            }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Balance</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: balance > 0 ? '#D97706' : '#059669' }}>
                    {formatCurrency(Math.abs(balance))}
                    {balance <= 0 && <span style={{ fontSize: '12px', marginLeft: '6px' }}>✓ Clear</span>}
                </div>
            </div>

            <button onClick={handleSave} disabled={saving} style={{
                width: '100%', padding: '14px',
                background: saved ? '#059669' : 'linear-gradient(135deg, #00A651, #007A3D)',
                color: 'white', fontWeight: 800, fontSize: '15px',
                border: 'none', borderRadius: '14px', cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0,166,81,0.35)',
            }}>
                {saved ? '✅ Saved!' : saving ? 'Saving...' : '💾 Save Payment'}
            </button>
        </div>
    )
}