'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, RotateCcw } from 'lucide-react'
import EmployeeForm from '../EmployeeForm'

interface AttendanceSetting {
    code: string; label: string; color: string; text_color: string
    calc_type: string; fixed_amount: number; multiplier: number
}
interface Override {
    type_code: string; override_amount: number | null; override_multiplier: number | null
}
interface Employee {
    id: string; name: string; emp_code: string; monthly_salary: number
}

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
    const [empId, setEmpId] = useState<string | null>(null)
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [settings, setSettings] = useState<AttendanceSetting[]>([])
    const [overrides, setOverrides] = useState<Override[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'info' | 'rates'>('info')
    const [savingCode, setSavingCode] = useState<string | null>(null)
    const [msg, setMsg] = useState('')

    useEffect(() => { params.then(p => setEmpId(p.id)) }, [params])

    useEffect(() => {
        if (!empId) return
        setLoading(true)
        Promise.all([
            fetch(`/api/admin/employees/${empId}`).then(r => r.json()),
            fetch('/api/admin/settings/attendance').then(r => r.json()),
            fetch(`/api/admin/employees/${empId}/overrides`).then(r => r.json()),
        ]).then(([emp, sett, ovr]) => {
            setEmployee(emp)
            setSettings(Array.isArray(sett)
                ? sett.filter((s: AttendanceSetting) => ['ot_fixed', 'per_day_multiply'].includes(s.calc_type))
                : [])
            setOverrides(Array.isArray(ovr) ? ovr : [])
            setLoading(false)
        })
    }, [empId])

    function getOverride(code: string) {
        return overrides.find(o => o.type_code === code) ?? null
    }

    async function refreshOverrides() {
        if (!empId) return
        const ovr = await fetch(`/api/admin/employees/${empId}/overrides`).then(r => r.json())
        setOverrides(Array.isArray(ovr) ? ovr : [])
    }

    async function saveOverride(code: string, field: 'amount' | 'multiplier', value: string) {
        if (!empId) return
        const num = parseFloat(value)
        if (isNaN(num) || num < 0) { setMsg('❌ Valid number daalo'); return }
        setSavingCode(code)
        const body: any = { type_code: code }
        if (field === 'amount') body.override_amount = num
        if (field === 'multiplier') body.override_multiplier = num
        const res = await fetch(`/api/admin/employees/${empId}/overrides`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        if (res.ok) { await refreshOverrides(); setMsg('✅ Override saved!') }
        else { setMsg('❌ Save failed') }
        setSavingCode(null)
        setTimeout(() => setMsg(''), 2500)
    }

    async function removeOverride(code: string) {
        if (!empId) return
        setSavingCode(code)
        await fetch(`/api/admin/employees/${empId}/overrides`, {
            method: 'DELETE', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type_code: code }),
        })
        await refreshOverrides()
        setMsg('✅ Reset to global')
        setSavingCode(null)
        setTimeout(() => setMsg(''), 2500)
    }

    const perDay = employee ? employee.monthly_salary / 26 : 0

    const inp: React.CSSProperties = {
        flex: 1, padding: '9px 12px', borderRadius: '9px',
        border: '1.5px solid #E5E7EB', fontSize: '14px',
        fontWeight: 700, outline: 'none', background: 'white',
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading...</div>
    if (!employee) return <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}>Employee not found</div>

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link href="/admin/employees" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: '#F3F4F6', color: '#374151',
                }}>
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 style={{ fontWeight: 900, fontSize: '20px', color: '#111827', margin: 0 }}>{employee.name}</h1>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                        {employee.emp_code} · ₹{employee.monthly_salary.toLocaleString('en-IN')}/mo
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '12px', padding: '4px', gap: '4px' }}>
                {(['info', 'rates'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                        flex: 1, padding: '10px', borderRadius: '9px', border: 'none',
                        fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                        background: tab === t ? 'white' : 'transparent',
                        color: tab === t ? '#111827' : '#9CA3AF',
                        boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}>
                        {t === 'info' ? '👤 Basic Info' : '💰 Rate Overrides'}
                    </button>
                ))}
            </div>

            {/* Tab: Info */}
            {tab === 'info' && <EmployeeForm employee={employee as any} isNew={false} />}

            {/* Tab: Rates */}
            {tab === 'rates' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Info card */}
                    <div style={{ background: '#F0FDF4', borderRadius: '14px', padding: '14px', border: '1px solid #BBF7D0' }}>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#065F46', marginBottom: '4px' }}>
                            ℹ️ Per-Employee Rate Override
                        </div>
                        <div style={{ fontSize: '12px', color: '#047857', lineHeight: 1.6 }}>
                            Global rates Settings se aate hain. Iss employee ke liye alag rate chahiye toh yahan set karo.<br />
                            <strong>Per Day: ₹{perDay.toFixed(2)}</strong> (₹{employee.monthly_salary.toLocaleString('en-IN')} ÷ 26)
                        </div>
                    </div>

                    {msg && (
                        <div style={{
                            padding: '10px', borderRadius: '10px', textAlign: 'center', fontWeight: 700, fontSize: '13px',
                            background: msg.startsWith('✅') ? '#F0FDF4' : '#FEF2F2',
                            color: msg.startsWith('✅') ? '#059669' : '#EF4444',
                        }}>{msg}</div>
                    )}

                    {settings.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF', fontSize: '13px' }}>
                            Koi OT/Bonus type nahi hai.{' '}
                            <Link href="/admin/settings" style={{ color: '#00A651', fontWeight: 700 }}>
                                Settings → Add Type
                            </Link>
                        </div>
                    )}

                    {settings.map(s => {
                        const ov = getOverride(s.code)
                        const isFixed = s.calc_type === 'ot_fixed'
                        const isMulti = s.calc_type === 'per_day_multiply'
                        const curVal = isFixed ? (ov?.override_amount ?? s.fixed_amount) : (ov?.override_multiplier ?? s.multiplier)
                        const globalVal = isFixed ? s.fixed_amount : s.multiplier
                        const hasOverride = ov !== null && (
                            (isFixed && ov.override_amount != null) ||
                            (isMulti && ov.override_multiplier != null)
                        )

                        return (
                            <div key={s.code} style={{
                                background: 'white', borderRadius: '14px', padding: '14px',
                                border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                            }}>
                                {/* Top */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <div style={{
                                        background: s.color, color: s.text_color,
                                        borderRadius: '7px', padding: '4px 10px',
                                        fontWeight: 900, fontSize: '13px',
                                    }}>{s.code}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>{s.label}</div>
                                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                            {isFixed
                                                ? `Global: ₹${globalVal} flat per occurrence`
                                                : `Global: ${globalVal}× per day (₹${(perDay * (Number(globalVal) - 1)).toFixed(0)} bonus/day)`}
                                        </div>
                                    </div>
                                    {hasOverride && (
                                        <span style={{
                                            fontSize: '10px', fontWeight: 800,
                                            background: '#FEF3C7', color: '#D97706',
                                            borderRadius: '99px', padding: '3px 8px',
                                        }}>OVERRIDE</span>
                                    )}
                                </div>

                                {/* Input */}
                                <OverrideInput
                                    key={`${s.code}-${curVal}`}
                                    defaultValue={String(curVal)}
                                    placeholder={`Global: ${globalVal}`}
                                    step={isFixed ? '1' : '0.1'}
                                    prefix={isFixed ? '₹' : ''}
                                    suffix={isFixed ? 'per OT' : '× per day'}
                                    saving={savingCode === s.code}
                                    onSave={val => saveOverride(s.code, isFixed ? 'amount' : 'multiplier', val)}
                                    inputStyle={inp}
                                />

                                {hasOverride && (
                                    <button onClick={() => removeOverride(s.code)} disabled={savingCode === s.code}
                                        style={{
                                            marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px',
                                            padding: '7px 12px', borderRadius: '8px', border: 'none',
                                            background: '#FEF2F2', color: '#EF4444',
                                            cursor: 'pointer', fontWeight: 700, fontSize: '12px',
                                        }}>
                                        <RotateCcw size={12} /> Reset to Global (₹{globalVal})
                                    </button>
                                )}

                                {/* Preview */}
                                <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280', background: '#F9FAFB', padding: '8px', borderRadius: '8px' }}>
                                    {isFixed
                                        ? `💡 3 OT lage toh: ₹${(Number(curVal) * 3).toLocaleString('en-IN')} add hoga`
                                        : `💡 1 day lage toh: ₹${(perDay * (Number(curVal) - 1)).toFixed(0)} bonus (extra ${(Number(curVal) - 1)}× per day)`}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function OverrideInput({
    defaultValue, placeholder, step, prefix, suffix, saving, onSave, inputStyle,
}: {
    defaultValue: string; placeholder: string; step: string; prefix: string
    suffix: string; saving: boolean; onSave: (v: string) => void
    inputStyle: React.CSSProperties
}) {
    const [val, setVal] = useState(defaultValue)
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {prefix && <span style={{ fontWeight: 700, fontSize: '14px', color: '#374151' }}>{prefix}</span>}
            <input type="number" min="0" step={step} value={val}
                onChange={e => setVal(e.target.value)}
                placeholder={placeholder}
                style={inputStyle} />
            {suffix && <span style={{ fontSize: '12px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>{suffix}</span>}
            <button onClick={() => onSave(val)} disabled={saving} style={{
                padding: '9px 16px', borderRadius: '9px', border: 'none',
                background: saving ? '#9CA3AF' : 'linear-gradient(135deg,#00A651,#059669)',
                color: 'white', fontWeight: 800, fontSize: '13px',
                cursor: saving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
            }}>
                {saving ? '...' : 'Save'}
            </button>
        </div>
    )
}