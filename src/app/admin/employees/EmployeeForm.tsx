'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Employee } from '@/types'

type Warehouse = { id: string; code: string; name: string }

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
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])

    const [form, setForm] = useState({
        name: employee?.name ?? '',
        emp_code: employee?.emp_code ?? '',
        phone: employee?.phone ?? '',
        monthly_salary: String(employee?.monthly_salary ?? ''),
        per_day_rate: String(employee?.per_day_rate ?? ''),
        joining_date: employee?.joining_date ?? new Date().toISOString().split('T')[0],
        login_pin: '',
        is_active: employee?.is_active ?? true,
        warehouse_id: employee?.warehouse_id ?? '',
    })

    useEffect(() => {
        fetch('/api/admin/warehouses')
            .then(r => r.json())
            .then(d => {
                const list = Array.isArray(d.warehouses) ? d.warehouses : []
                setWarehouses(list)
                if (!form.warehouse_id && list[0]?.id) {
                    setForm(prev => ({ ...prev, warehouse_id: list[0].id }))
                }
            })
            .catch(() => {})
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value, type } = e.target
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }))
    }

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
            const payload: Record<string, unknown> = {
                name: form.name,
                emp_code: form.emp_code,
                phone: form.phone,
                monthly_salary: parseFloat(form.monthly_salary) || 0,
                per_day_rate: parseFloat(form.per_day_rate) || 0,
                joining_date: form.joining_date,
                is_active: form.is_active,
                warehouse_id: form.warehouse_id || null,
            }
            if (form.login_pin.trim()) {
                payload.login_pin = form.login_pin.trim()
            } else if (isNew) {
                setMsg('A 4-digit PIN is required')
                setSaving(false)
                return
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
                setMsg('Saved')
                setTimeout(() => router.push('/admin/employees'), 600)
            } else {
                setMsg(data.error ?? 'Save failed')
            }
        } catch {
            setMsg('Network error')
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
                setMsg(data.error ?? 'Delete failed')
                setShowDelete(false)
            }
        } catch {
            setMsg('Network error')
        }
        setDeleting(false)
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '12px 14px', borderRadius: '10px',
        border: '1.5px solid var(--border)', fontSize: '14px', color: 'var(--input-text)',
        background: 'var(--input-bg)', boxSizing: 'border-box',
    }
    const labelStyle: React.CSSProperties = {
        display: 'block', fontWeight: 700, fontSize: '12px', color: 'var(--text-muted)',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
    }
    const cardStyle: React.CSSProperties = {
        background: 'var(--panel)', borderRadius: '16px', padding: '16px',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
    }

    return (
        <>
            {showDelete && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
                    onClick={() => setShowDelete(false)}>
                    <div style={{ background: 'var(--panel)', borderRadius: '20px 20px 0 0', padding: '24px', width: '100%', maxWidth: '480px' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text)', marginBottom: '8px', textAlign: 'center' }}>Deactivate Employee?</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '20px' }}>
                            <strong>{employee?.name}</strong> will be marked inactive and hidden from attendance. History is kept.
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button type="button" onClick={() => setShowDelete(false)} className="btn btn--ghost">Cancel</button>
                            <button type="button" onClick={handleDelete} disabled={deleting} className="btn btn--danger">
                                {deleting ? 'Deactivating…' : 'Yes, Deactivate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={cardStyle}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                        Basic Info
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label htmlFor="emp-name" style={labelStyle}>Full Name *</label>
                            <input id="emp-name" name="name" required value={form.name} onChange={handleChange}
                                placeholder="e.g. Ramesh Kumar" style={inputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label htmlFor="emp-code" style={labelStyle}>Emp Code *</label>
                                <input id="emp-code" name="emp_code" required value={form.emp_code} onChange={handleChange}
                                    placeholder="DDW001" style={inputStyle} />
                            </div>
                            <div>
                                <label htmlFor="emp-phone" style={labelStyle}>Phone</label>
                                <input id="emp-phone" name="phone" type="tel" value={form.phone} onChange={handleChange}
                                    placeholder="9876543210" style={inputStyle} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="emp-joining" style={labelStyle}>Joining Date *</label>
                            <input id="emp-joining" name="joining_date" type="date" required value={form.joining_date} onChange={handleChange}
                                style={inputStyle} />
                        </div>
                        {warehouses.length > 0 && (
                            <div>
                                <label htmlFor="warehouse_id" style={labelStyle}>Warehouse</label>
                                <select id="warehouse_id" name="warehouse_id" value={form.warehouse_id} onChange={handleChange} style={inputStyle}>
                                    <option value="">Unassigned</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.code} — {w.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div style={cardStyle}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                        Salary
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={labelStyle}>Monthly Salary (₹) *</label>
                            <input name="monthly_salary" type="number" required min="0" value={form.monthly_salary}
                                onChange={handleSalaryChange} placeholder="15000" style={inputStyle} />
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Per day rate auto-calculated (÷26 working days)
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Per Day Rate (₹)</label>
                            <input name="per_day_rate" type="number" min="0" step="0.01" value={form.per_day_rate}
                                onChange={handleChange} placeholder="Auto" style={{ ...inputStyle, background: 'var(--gray-50)' }} />
                        </div>
                    </div>
                </div>

                <div style={cardStyle}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                        Employee Login
                    </div>
                    <div>
                        <label htmlFor="login_pin" style={labelStyle}>4-Digit PIN</label>
                        <input
                            id="login_pin"
                            name="login_pin"
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            minLength={isNew ? 4 : undefined}
                            required={isNew}
                            value={form.login_pin}
                            onChange={handleChange}
                            placeholder={isNew ? 'e.g. 1234' : 'Leave blank to keep current'}
                            style={inputStyle}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {isNew
                                ? 'Employee uses this PIN to login on their portal'
                                : 'Leave blank to keep the existing PIN. Enter a new PIN only to change it.'}
                        </div>
                    </div>
                </div>

                {!isNew && (
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>Active Status</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Inactive employees won&apos;t appear in attendance</div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
                                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange}
                                    style={{ opacity: 0, width: 0, height: 0 }} />
                                <span style={{
                                    position: 'absolute', inset: 0, borderRadius: '13px',
                                    background: form.is_active ? 'var(--green-primary)' : 'var(--gray-200)',
                                    transition: 'background 0.2s',
                                }}>
                                    <span style={{
                                        position: 'absolute', top: '3px', left: form.is_active ? '25px' : '3px',
                                        width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    }} />
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                {msg && (
                    <div style={{
                        textAlign: 'center', fontWeight: 700, fontSize: '14px', padding: '4px',
                        color: msg === 'Saved' ? 'var(--green-dark)' : '#EF4444',
                    }}>
                        {msg}
                    </div>
                )}

                <button type="submit" disabled={saving} className="btn btn--primary" style={{ width: '100%', padding: '16px', fontSize: 16 }}>
                    {saving ? 'Saving…' : isNew ? 'Add Employee' : 'Save Changes'}
                </button>

                {!isNew && (
                    <button type="button" onClick={() => setShowDelete(true)} className="btn btn--danger" style={{ width: '100%' }}>
                        Deactivate Employee
                    </button>
                )}
            </form>
        </>
    )
}
