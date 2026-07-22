'use client'

import { useEffect, useState } from 'react'
import { Building2, Plus, Users, Shield } from 'lucide-react'

type Warehouse = {
    id: string
    code: string
    name: string
    address?: string
    is_active: boolean
}

type Member = {
    id: string
    role: string
    display_name?: string
    email?: string
    is_super_admin?: boolean
    warehouses: { warehouse_id: string; role: string; warehouse: { name: string; code: string } | null }[]
}

const WH_ROLES = ['owner', 'admin', 'manager', 'viewer'] as const
const PROFILE_ROLES = ['admin', 'manager', 'viewer', 'super_admin'] as const

export default function OrganizationPage() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [members, setMembers] = useState<Member[]>([])
    const [setupRequired, setSetupRequired] = useState(false)
    const [msg, setMsg] = useState('')
    const [form, setForm] = useState({ code: '', name: '', address: '' })
    const [assign, setAssign] = useState({ user_id: '', warehouse_id: '', role: 'manager' })
    const [saving, setSaving] = useState(false)

    async function load() {
        const [w, t] = await Promise.all([
            fetch('/api/admin/warehouses').then(r => r.json()),
            fetch('/api/admin/team').then(r => r.json()),
        ])
        setWarehouses(w.warehouses ?? [])
        setMembers(t.members ?? [])
        setSetupRequired(Boolean(w.setupRequired || t.setupRequired))
        if (!assign.user_id && t.members?.[0]?.id) {
            setAssign(a => ({ ...a, user_id: t.members[0].id }))
        }
        if (!assign.warehouse_id && w.warehouses?.[0]?.id) {
            setAssign(a => ({ ...a, warehouse_id: w.warehouses[0].id }))
        }
    }

    useEffect(() => { load() }, [])

    function flash(text: string) {
        setMsg(text)
        setTimeout(() => setMsg(''), 2500)
    }

    async function addWarehouse(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        const res = await fetch('/api/admin/warehouses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) flash(data.error ?? 'Failed')
        else {
            setForm({ code: '', name: '', address: '' })
            flash('Warehouse created')
            await load()
        }
        setSaving(false)
    }

    async function assignMember(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        const res = await fetch('/api/admin/team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assign),
        })
        const data = await res.json()
        if (!res.ok) flash(data.error ?? 'Assign failed')
        else {
            flash('Member assigned')
            await load()
        }
        setSaving(false)
    }

    async function updateProfileRole(userId: string, role: string) {
        const res = await fetch('/api/admin/team', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, role }),
        })
        const data = await res.json()
        if (!res.ok) flash(data.error ?? 'Update failed')
        else {
            flash('Role updated')
            await load()
        }
    }

    async function removeAssignment(userId: string, warehouseId: string) {
        const res = await fetch('/api/admin/team', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, warehouse_id: warehouseId }),
        })
        const data = await res.json()
        if (!res.ok) flash(data.error ?? 'Remove failed')
        else {
            flash('Assignment removed')
            await load()
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="page-head">
                <div>
                    <h1>Organization</h1>
                    <p>Warehouses, admins & permissions</p>
                </div>
            </div>

            {setupRequired && (
                <div className="panel" style={{ borderColor: '#FDE68A', background: 'var(--gray-50)' }}>
                    <div className="panel__body" style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>
                        <strong>Database setup required.</strong> Run{' '}
                        <code style={{ background: 'var(--panel)', padding: '2px 6px', borderRadius: 6, border: '1px solid var(--border)' }}>
                            migrations/v3-multi-tenant.sql
                        </code>{' '}
                        in the Supabase SQL editor to enable multi-warehouse and team permissions.
                    </div>
                </div>
            )}

            {msg && (
                <div style={{
                    padding: '10px 14px', borderRadius: 12, fontWeight: 700, fontSize: 13,
                    background: 'var(--green-light)', color: 'var(--green-dark)',
                }}>{msg}</div>
            )}

            <div className="dash-grid">
                <div className="panel">
                    <div className="panel__head" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Building2 size={14} /> Warehouses
                    </div>
                    <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {warehouses.length === 0 && (
                            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No warehouses yet</div>
                        )}
                        {warehouses.map(w => (
                            <div key={w.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px 14px', borderRadius: 12,
                                background: 'var(--gray-50)', border: '1px solid var(--border)',
                            }}>
                                <div>
                                    <div style={{ fontWeight: 800, color: 'var(--text)' }}>{w.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {w.code}{w.address ? ` · ${w.address}` : ''}
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '3px 10px',
                                    background: w.is_active ? 'var(--green-light)' : '#FEE2E2',
                                    color: w.is_active ? 'var(--green-dark)' : '#DC2626',
                                }}>
                                    {w.is_active ? 'Active' : 'Off'}
                                </span>
                            </div>
                        ))}

                        <form onSubmit={addWarehouse} style={{
                            marginTop: 8, paddingTop: 14, borderTop: '1px solid var(--border)',
                            display: 'flex', flexDirection: 'column', gap: 10,
                        }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>
                                <Plus size={14} style={{ verticalAlign: 'middle' }} /> Add warehouse
                            </div>
                            <input
                                required placeholder="Code (e.g. WH01)"
                                value={form.code}
                                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                style={inp}
                            />
                            <input
                                required placeholder="Name"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                style={inp}
                            />
                            <input
                                placeholder="Address (optional)"
                                value={form.address}
                                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                style={inp}
                            />
                            <button type="submit" disabled={saving || setupRequired} className="btn btn--primary">
                                {saving ? 'Saving…' : 'Create warehouse'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="panel">
                    <div className="panel__head" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={14} /> Admins & roles
                    </div>
                    <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 4 }}>
                            <Shield size={12} style={{ verticalAlign: 'middle' }} />{' '}
                            Roles: <strong>owner/admin</strong> full access · <strong>manager</strong> attendance & requests · <strong>viewer</strong> read-only
                        </div>
                        {members.length === 0 && (
                            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                No admin profiles found. Existing Supabase auth users with role=admin appear here after migration.
                            </div>
                        )}
                        {members.map(m => (
                            <div key={m.id} style={{
                                padding: '12px 14px', borderRadius: 12,
                                background: 'var(--gray-50)', border: '1px solid var(--border)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ fontWeight: 800, color: 'var(--text)' }}>
                                        {m.display_name || m.email || m.id.slice(0, 8)}
                                        {m.is_super_admin && (
                                            <span style={{
                                                marginLeft: 8, fontSize: 10, fontWeight: 800,
                                                background: '#DBEAFE', color: '#1D4ED8',
                                                padding: '2px 8px', borderRadius: 999,
                                            }}>SUPER</span>
                                        )}
                                    </div>
                                    <select
                                        value={m.role}
                                        disabled={setupRequired || m.is_super_admin}
                                        onChange={e => updateProfileRole(m.id, e.target.value)}
                                        style={{ ...inp, width: 'auto', padding: '6px 10px', fontSize: 12 }}
                                    >
                                        {PROFILE_ROLES.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {(m.warehouses?.length ?? 0) === 0
                                        ? <span>No warehouse assignment</span>
                                        : m.warehouses.map(w => (
                                            <span key={`${m.id}-${w.warehouse_id}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                                <span>{w.warehouse?.code ?? '?'} ({w.role})</span>
                                                <button type="button" onClick={() => removeAssignment(m.id, w.warehouse_id)}
                                                    style={{ border: 'none', background: 'transparent', color: '#EF4444', fontWeight: 700, cursor: 'pointer', fontSize: 11 }}>
                                                    Remove
                                                </button>
                                            </span>
                                        ))}
                                </div>
                            </div>
                        ))}

                        <form onSubmit={assignMember} style={{
                            marginTop: 8, paddingTop: 14, borderTop: '1px solid var(--border)',
                            display: 'flex', flexDirection: 'column', gap: 10,
                        }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>Assign to warehouse</div>
                            <select
                                required
                                value={assign.user_id}
                                onChange={e => setAssign(a => ({ ...a, user_id: e.target.value }))}
                                style={inp}
                                disabled={setupRequired || members.length === 0}
                            >
                                <option value="">Select admin</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.display_name || m.email || m.id.slice(0, 8)}</option>
                                ))}
                            </select>
                            <select
                                required
                                value={assign.warehouse_id}
                                onChange={e => setAssign(a => ({ ...a, warehouse_id: e.target.value }))}
                                style={inp}
                                disabled={setupRequired || warehouses.length === 0}
                            >
                                <option value="">Select warehouse</option>
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>{w.code} — {w.name}</option>
                                ))}
                            </select>
                            <select
                                value={assign.role}
                                onChange={e => setAssign(a => ({ ...a, role: e.target.value }))}
                                style={inp}
                            >
                                {WH_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <button type="submit" disabled={saving || setupRequired} className="btn btn--primary">
                                {saving ? 'Saving…' : 'Assign member'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

const inp: React.CSSProperties = {
    width: '100%', padding: '11px 12px', borderRadius: 10,
    border: '1.5px solid var(--border)', background: 'var(--input-bg)',
    color: 'var(--input-text)', fontSize: 14, boxSizing: 'border-box',
}
