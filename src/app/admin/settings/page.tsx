'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, GripVertical, ShieldCheck, X, Check } from 'lucide-react'

interface AttendanceSetting {
    id: string
    code: string
    label: string
    color: string
    text_color: string
    calc_type: string
    fixed_amount: number
    sort_order: number
    is_active: boolean
    is_system: boolean
}

const CALC_TYPES = [
    { value: 'present', label: '✅ Present', desc: 'Full day present — no deduction' },
    { value: 'absent', label: '❌ Absent', desc: 'Full day deduction from salary' },
    { value: 'half', label: '½ Half Day', desc: 'Half day deduction' },
    { value: 'extra', label: '⭐ Extra / Bonus Day', desc: 'Present + 1 bonus day pay added' },
    { value: 'ot_fixed', label: '💰 OT Fixed Amount', desc: 'Present + fixed ₹ per occurrence' },
    { value: 'no_effect', label: '⬜ No Effect', desc: 'No salary impact (Holiday, WO)' },
]

const DEFAULT_COLORS = [
    '#00A651', '#3B82F6', '#EF4444', '#F59E0B', '#F97316',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#6B7280',
]

const EMPTY_FORM = {
    code: '', label: '', color: '#6B7280', text_color: '#FFFFFF',
    calc_type: 'present', fixed_amount: 0, sort_order: 99,
}

export default function AttendanceSettingsPage() {
    const [settings, setSettings] = useState<AttendanceSetting[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editItem, setEditItem] = useState<AttendanceSetting | null>(null)
    const [form, setForm] = useState({ ...EMPTY_FORM })
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState('')
    const [deletingId, setDeletingId] = useState<string | null>(null)

    async function fetchSettings() {
        setLoading(true)
        const res = await fetch('/api/admin/settings/attendance')
        const data = await res.json()
        setSettings(Array.isArray(data) ? data : [])
        setLoading(false)
    }

    useEffect(() => { fetchSettings() }, [])

    function openAdd() {
        setEditItem(null)
        setForm({ ...EMPTY_FORM })
        setShowForm(true)
    }

    function openEdit(s: AttendanceSetting) {
        setEditItem(s)
        setForm({
            code: s.code,
            label: s.label,
            color: s.color,
            text_color: s.text_color,
            calc_type: s.calc_type,
            fixed_amount: s.fixed_amount,
            sort_order: s.sort_order,
        })
        setShowForm(true)
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: name === 'fixed_amount' || name === 'sort_order' ? Number(value) : value }))
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setMsg('')

        const method = editItem ? 'PUT' : 'POST'
        const body = editItem ? { id: editItem.id, ...form } : form

        const res = await fetch('/api/admin/settings/attendance', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        const data = await res.json()

        if (res.ok) {
            setMsg('✅ Saved!')
            setShowForm(false)
            fetchSettings()
        } else {
            setMsg('❌ ' + (data.error ?? 'Failed'))
        }
        setSaving(false)
        setTimeout(() => setMsg(''), 3000)
    }

    async function handleDelete(id: string) {
        setDeletingId(id)
        const res = await fetch('/api/admin/settings/attendance', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        const data = await res.json()
        if (res.ok) {
            fetchSettings()
        } else {
            setMsg('❌ ' + (data.error ?? 'Cannot delete'))
            setTimeout(() => setMsg(''), 3000)
        }
        setDeletingId(null)
    }

    async function toggleActive(s: AttendanceSetting) {
        await fetch('/api/admin/settings/attendance', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: s.id, ...s, is_active: !s.is_active }),
        })
        fetchSettings()
    }

    const selectedCalcType = CALC_TYPES.find(c => c.value === form.calc_type)

    // ── Styles ──
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '11px 14px', borderRadius: '10px',
        border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none',
        background: 'white', boxSizing: 'border-box',
    }
    const labelStyle: React.CSSProperties = {
        display: 'block', fontWeight: 700, fontSize: '11px', color: '#6B7280',
        marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em',
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontWeight: 900, fontSize: '22px', color: '#111827', margin: 0 }}>
                        Attendance Settings
                    </h1>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                        Custom attendance types & salary rules
                    </p>
                </div>
                <button onClick={openAdd} style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: 'linear-gradient(135deg,#00A651,#059669)',
                    color: 'white', padding: '10px 14px', borderRadius: '12px',
                    border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                    boxShadow: '0 2px 8px rgba(0,166,81,0.3)',
                }}>
                    <Plus size={16} /> Add Type
                </button>
            </div>

            {msg && (
                <div style={{
                    textAlign: 'center', fontWeight: 700, fontSize: '14px', padding: '10px',
                    borderRadius: '10px',
                    background: msg.startsWith('✅') ? '#F0FDF4' : '#FEF2F2',
                    color: msg.startsWith('✅') ? '#059669' : '#EF4444',
                }}>
                    {msg}
                </div>
            )}

            {/* Legend card */}
            <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '14px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontWeight: 800, fontSize: '12px', color: '#374151', marginBottom: '8px' }}>
                    📖 Calc Type Guide
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {CALC_TYPES.map(ct => (
                        <div key={ct.value} style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                            <span style={{ fontWeight: 700, color: '#374151', minWidth: '80px' }}>{ct.label}</span>
                            <span style={{ color: '#6B7280' }}>{ct.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Settings list */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>Loading...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {settings.map(s => (
                        <div key={s.id} style={{
                            background: 'white', borderRadius: '14px', padding: '14px 14px 14px 10px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                            border: s.is_active ? '1px solid #E5E7EB' : '1px dashed #D1D5DB',
                            opacity: s.is_active ? 1 : 0.6,
                            display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                            {/* Drag handle */}
                            <GripVertical size={16} color="#D1D5DB" style={{ flexShrink: 0 }} />

                            {/* Color badge */}
                            <div style={{
                                background: s.color, color: s.text_color,
                                borderRadius: '8px', padding: '5px 10px',
                                fontWeight: 900, fontSize: '14px', minWidth: '44px',
                                textAlign: 'center', flexShrink: 0,
                            }}>
                                {s.code}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>{s.label}</span>
                                    {s.is_system && (
                                        <ShieldCheck size={12} color="#9CA3AF" title="System type" />
                                    )}
                                </div>
                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                                    {CALC_TYPES.find(c => c.value === s.calc_type)?.label ?? s.calc_type}
                                    {s.calc_type === 'ot_fixed' && s.fixed_amount > 0 && (
                                        <span style={{ color: '#F97316', marginLeft: '6px' }}>
                                            +₹{s.fixed_amount}/day
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                {/* Toggle active */}
                                <button onClick={() => toggleActive(s)}
                                    title={s.is_active ? 'Disable' : 'Enable'}
                                    style={{
                                        width: '30px', height: '30px', borderRadius: '8px', border: 'none',
                                        background: s.is_active ? '#F0FDF4' : '#F3F4F6',
                                        color: s.is_active ? '#059669' : '#9CA3AF',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                    <Check size={14} />
                                </button>

                                {/* Edit */}
                                <button onClick={() => openEdit(s)}
                                    style={{
                                        width: '30px', height: '30px', borderRadius: '8px', border: 'none',
                                        background: '#EFF6FF', color: '#2563EB',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                    <Pencil size={13} />
                                </button>

                                {/* Delete — only non-system */}
                                {!s.is_system && (
                                    <button onClick={() => handleDelete(s.id)}
                                        disabled={deletingId === s.id}
                                        style={{
                                            width: '30px', height: '30px', borderRadius: '8px', border: 'none',
                                            background: '#FEF2F2', color: '#EF4444',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Add/Edit Bottom Sheet ── */}
            {showForm && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 999,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'flex-end',
                }} onClick={() => setShowForm(false)}>
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '100%', background: 'white',
                            borderRadius: '20px 20px 0 0', padding: '20px 16px',
                            paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
                            maxHeight: '90dvh', overflowY: 'auto',
                        }}
                    >
                        {/* Sheet header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontWeight: 900, fontSize: '18px', margin: 0 }}>
                                {editItem ? '✏️ Edit Attendance Type' : '➕ New Attendance Type'}
                            </h2>
                            <button onClick={() => setShowForm(false)}
                                style={{ background: '#F3F4F6', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                            {/* Code — read only if editing */}
                            <div>
                                <label style={labelStyle}>Code * (e.g. P, OT, NITE)</label>
                                <input
                                    name="code" value={form.code} onChange={handleChange}
                                    readOnly={!!editItem}
                                    maxLength={6}
                                    placeholder="OT, 2P, NITE, EXTRA..."
                                    required
                                    style={{ ...inputStyle, textTransform: 'uppercase', background: editItem ? '#F9FAFB' : 'white' }}
                                />
                                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                    Max 6 chars, uppercase. Used in attendance grid.
                                </span>
                            </div>

                            {/* Label */}
                            <div>
                                <label style={labelStyle}>Label *</label>
                                <input name="label" value={form.label} onChange={handleChange}
                                    placeholder="e.g. Night Shift, Sunday OT..."
                                    required style={inputStyle} />
                            </div>

                            {/* Color picker */}
                            <div>
                                <label style={labelStyle}>Badge Color</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                    {DEFAULT_COLORS.map(c => (
                                        <button key={c} type="button"
                                            onClick={() => setForm(prev => ({ ...prev, color: c }))}
                                            style={{
                                                width: '30px', height: '30px', borderRadius: '8px', background: c, border: 'none',
                                                cursor: 'pointer', outline: form.color === c ? '3px solid #1a1a2e' : 'none',
                                                outlineOffset: '2px',
                                            }} />
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input type="color" name="color" value={form.color} onChange={handleChange}
                                        style={{ width: '44px', height: '36px', borderRadius: '8px', border: '1px solid #E5E7EB', cursor: 'pointer', padding: '2px' }} />
                                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Custom color</span>
                                    {/* Preview */}
                                    <div style={{
                                        background: form.color, color: form.text_color,
                                        borderRadius: '8px', padding: '5px 12px',
                                        fontWeight: 900, fontSize: '14px', marginLeft: 'auto',
                                    }}>
                                        {form.code || 'CODE'}
                                    </div>
                                </div>
                            </div>

                            {/* Text color */}
                            <div>
                                <label style={labelStyle}>Text Color</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {['#FFFFFF', '#111827', '#374151'].map(tc => (
                                        <button key={tc} type="button"
                                            onClick={() => setForm(prev => ({ ...prev, text_color: tc }))}
                                            style={{
                                                padding: '6px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '12px',
                                                background: tc === '#FFFFFF' ? '#1a1a2e' : '#F3F4F6',
                                                color: tc, cursor: 'pointer',
                                                border: form.text_color === tc ? '2px solid #00A651' : '2px solid transparent',
                                            }}>
                                            {tc === '#FFFFFF' ? 'White' : tc === '#111827' ? 'Black' : 'Gray'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Calc type */}
                            <div>
                                <label style={labelStyle}>Salary Calculation *</label>
                                <select name="calc_type" value={form.calc_type} onChange={handleChange}
                                    style={{ ...inputStyle, cursor: 'pointer' }}>
                                    {CALC_TYPES.map(ct => (
                                        <option key={ct.value} value={ct.value}>{ct.label}</option>
                                    ))}
                                </select>
                                {selectedCalcType && (
                                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', padding: '8px', background: '#F9FAFB', borderRadius: '8px' }}>
                                        ℹ️ {selectedCalcType.desc}
                                    </div>
                                )}
                            </div>

                            {/* Fixed amount — only for ot_fixed */}
                            {form.calc_type === 'ot_fixed' && (
                                <div>
                                    <label style={labelStyle}>Fixed OT Amount per Day (₹)</label>
                                    <input name="fixed_amount" type="number" min="0" step="0.01"
                                        value={form.fixed_amount} onChange={handleChange}
                                        placeholder="e.g. 150"
                                        style={inputStyle} />
                                    <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                        Yeh amount salary mein add hogi jab bhi yeh status lagao
                                    </span>
                                </div>
                            )}

                            {/* Sort order */}
                            <div>
                                <label style={labelStyle}>Display Order (lower = first)</label>
                                <input name="sort_order" type="number" min="1"
                                    value={form.sort_order} onChange={handleChange}
                                    style={inputStyle} />
                            </div>

                            {msg && (
                                <div style={{
                                    textAlign: 'center', fontWeight: 700, padding: '10px', borderRadius: '10px',
                                    background: msg.startsWith('✅') ? '#F0FDF4' : '#FEF2F2',
                                    color: msg.startsWith('✅') ? '#059669' : '#EF4444',
                                }}>
                                    {msg}
                                </div>
                            )}

                            <button type="submit" disabled={saving} style={{
                                padding: '15px', borderRadius: '14px', border: 'none',
                                background: saving ? '#9CA3AF' : 'linear-gradient(135deg,#00A651,#059669)',
                                color: 'white', fontWeight: 800, fontSize: '16px',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 12px rgba(0,166,81,0.3)',
                            }}>
                                {saving ? '⏳ Saving...' : editItem ? '✅ Update Type' : '➕ Add Type'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}