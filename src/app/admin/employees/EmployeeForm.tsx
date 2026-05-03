'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Employee } from '@/types'

type Props = {
    employee?: Employee
    isNew?: boolean
}

export default function EmployeeForm({ employee, isNew = false }: Props) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [msg, setMsg] = useState('')
    const [showDelete, setShowDelete] = useState(false)

    const [form, setForm] = useState({
        name: employee?.name ?? '',
        emp_code: employee?.emp_code ?? '',
        phone: employee?.phone ?? '',
        monthly_salary: String(employee?.monthly_salary ?? ''),
        per_day_rate: String(employee?.per_day_rate ?? ''),
        joining_date: employee?.joining_date ?? new Date().toISOString().split('T')[0],
        login_pin: employee?.login_pin ?? '',
        is_active: employee?.is_active ?? true,
    })

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value, type } = e.target
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }))
    }

    // Auto-calculate per_day_rate from monthly_salary
    function handleSalaryChange(e: React.ChangeEvent<HTMLInputElement>) {
        const salary = parseFloat(e.target.value) || 0
        const perDay = salary > 0 ? Math.round((salary / 26) * 100) / 100 : 0
        setForm(prev => ({ ...prev, monthly_salary: e.target.value, per_day_rate: String(perDay) }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setMsg('')
        try {
            const payload = {
                ...form,
                monthly_salary: parseFloat(form.monthly_salary) || 0,
                per_day_rate: parseFloat(form.per_day_rate) || 0,
            }
            const url = isNew ? '/api/admin/employees' : `/api/admin/employees/${employee?.id}`
            const method = isNew ? 'POST' : 'PUT'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (res.ok) {
                setMsg('✅ Saved!')
                setTimeout(() => router.push('/admin/employees'), 800)
            } else {
                setMsg('❌ ' + (data.error ?? 'Save failed'))
            }
        } catch {
            setMsg('❌ Network error')
        }
        setSaving(false)
    }

    async function handleDelete() {
        setDeleting(true)
        try {
            const res = await fetch(`/api/admin/employees/${employee?.id}`, { method: 'DELETE' })
            const data = await res.json()
            if (res.ok) {
                router.push('/admin/employees')
            } else {
                setMsg('❌ ' + (data.error ?? 'Delete failed'))
                setShowDelete(false)
            }
        } catch {
            setMsg('❌ Network error')
        }
        setDeleting(false)
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '12px 14px', borderRadius: '10px',
        border: '1.5px solid #E5E7EB', fontSize: '14px', color: '#111827',
        background: 'white', outline: 'none', boxSizing: 'border-box',
    }
    const labelStyle: React.CSSProperties = {
        display: 'block', fontWeight: 700, fontSize: '12px', color: '#374151',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
    }

    return (
        <>
            {/* Delete Confirm Bottom Sheet */}
            {showDelete && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
                    onClick={() => setShowDelete(false)}>
                    <div style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: '24px', width: '100%', maxWidth: '480px' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ fontWeight: 800, fontSize: '16px', color: '#111827', marginBottom: '8px', textAlign: 'center' }}>Delete Employee?</div>
                        <div style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', marginBottom: '20px' }}>
                            This will permanently delete <strong>{employee?.name}</strong> and all related records.
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button onClick={() => setShowDelete(false)}
                                style={{ padding: '13px', borderRadius: '12px', background: '#F3F4F6', color: '#374151', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                style={{ padding: '13px', borderRadius: '12px', background: '#EF4444', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Basic Info */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                        Basic Info
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={labelStyle}>Full Name *</label>
                            <input name="name" required value={form.name} onChange={handleChange}
                                placeholder="e.g. Ramesh Kumar" style={inputStyle} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={labelStyle}>Emp Code *</label>
                                <input name="emp_code" required value={form.emp_code} onChange={handleChange}
                                    placeholder="DDW001" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Phone</label>
                                <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                                    placeholder="9876543210" style={inputStyle} />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Joining Date *</label>
                            <input name="joining_date" type="date" required value={form.joining_date} onChange={handleChange}
                                style={inputStyle} />
                        </div>
                    </div>
                </div>

                {/* Salary */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                        Salary
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={labelStyle}>Monthly Salary (₹) *</label>
                            <input name="monthly_salary" type="number" required min="0" value={form.monthly_salary}
                                onChange={handleSalaryChange} placeholder="15000" style={inputStyle} />
                            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                                Per day rate auto-calculated (÷26 working days)
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Per Day Rate (₹)</label>
                            <input name="per_day_rate" type="number" min="0" step="0.01" value={form.per_day_rate}
                                onChange={handleChange} placeholder="Auto" style={{ ...inputStyle, background: '#F9FAFB' }} />
                        </div>
                    </div>
                </div>

                {/* Login PIN */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                        Employee Login
                    </div>
                    <div>
                        <label style={labelStyle}>4-Digit PIN</label>
                        <input name="login_pin" type="password" inputMode="numeric" maxLength={4} minLength={4}
                            value={form.login_pin} onChange={handleChange} placeholder="e.g. 1234" style={inputStyle} />
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                            Employee uses this PIN to login on their portal
                        </div>
                    </div>
                </div>

                {/* Status (edit only) */}
                {!isNew && (
                    <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>Active Status</div>
                                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Inactive employees won't appear in attendance</div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
                                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange}
                                    style={{ opacity: 0, width: 0, height: 0 }} />
                                <span style={{
                                    position: 'absolute', inset: 0, borderRadius: '13px',
                                    background: form.is_active ? '#00A651' : '#D1D5DB',
                                    transition: 'background 0.2s',
                                }}>
                                    <span style={{
                                        position: 'absolute', top: '3px', left: form.is_active ? '25px' : '3px',
                                        width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    }} />
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Message */}
                {msg && (
                    <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '14px', color: msg.startsWith('✅') ? '#059669' : '#EF4444', padding: '4px' }}>
                        {msg}
                    </div>
                )}

                {/* Save Button */}
                <button type="submit" disabled={saving} style={{
                    width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                    background: saving ? '#9CA3AF' : 'linear-gradient(135deg,#00A651,#059669)',
                    color: 'white', fontWeight: 800, fontSize: '16px', cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(0,166,81,0.3)',
                }}>
                    {saving ? '⏳ Saving...' : isNew ? '➕ Add Employee' : '💾 Save Changes'}
                </button>

                {/* Delete Button (edit only) */}
                {!isNew && (
                    <button type="button" onClick={() => setShowDelete(true)}
                        style={{
                            width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #FCA5A5',
                            background: 'white', color: '#EF4444', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                        }}>
                        🗑️ Delete Employee
                    </button>
                )}
            </form>
        </>
    )
}