'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AddAdvancePage({ params }: { params: { empId: string } }) {
    const router = useRouter()
    const sp = useSearchParams()
    const supabase = createClient()
    const month = parseInt(sp.get('month') ?? String(new Date().getMonth() + 1))
    const year = parseInt(sp.get('year') ?? String(new Date().getFullYear()))

    const [form, setForm] = useState({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        deduct_this_month: true,
    })
    const [saving, setSaving] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)

        await supabase.from('advance_payments').insert({
            employee_id: params.empId,
            date: form.date,
            amount: parseFloat(form.amount),
            description: form.description,
            deduct_month: form.deduct_this_month ? month : null,
            deduct_year: form.deduct_this_month ? year : null,
            is_deducted: false,
        })

        router.push(`/admin/salary/${params.empId}?month=${month}&year=${year}`)
        router.refresh()
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link href={`/admin/salary/${params.empId}?month=${month}&year=${year}`} style={{
                    width: '38px', height: '38px', background: 'white', borderRadius: '12px',
                    border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none',
                }}>
                    <ArrowLeft size={18} color="#374151" />
                </Link>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '18px', color: '#111827' }}>Add Advance</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>Deduction record</div>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'white', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px' }}>Amount (₹) *</label>
                        <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                            placeholder="1200" required
                            style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '12px', fontSize: '16px', fontWeight: 700, outline: 'none' }} />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px' }}>Description</label>
                        <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="Pigeon Cooker 1200 + Shoe 200"
                            style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '12px', fontSize: '14px', outline: 'none' }} />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '6px' }}>Date</label>
                        <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                            style={{ width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB', borderRadius: '12px', fontSize: '14px', outline: 'none' }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input type="checkbox" id="deduct" checked={form.deduct_this_month}
                            onChange={e => setForm(p => ({ ...p, deduct_this_month: e.target.checked }))}
                            style={{ width: '18px', height: '18px', accentColor: '#00A651' }} />
                        <label htmlFor="deduct" style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                            Deduct from this month's salary
                        </label>
                    </div>
                </div>

                <button type="submit" disabled={saving} style={{
                    width: '100%', padding: '16px',
                    background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                    color: 'white', fontWeight: 800, fontSize: '15px',
                    border: 'none', borderRadius: '16px', cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(139,92,246,0.35)',
                }}>
                    {saving ? 'Adding...' : '💳 Add Advance / Deduction'}
                </button>
            </form>
        </div>
    )
}