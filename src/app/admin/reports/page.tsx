'use client'

import { useEffect, useState } from 'react'
import { Download, FileSpreadsheet, Calendar, Wallet, Settings2, IndianRupee } from 'lucide-react'

type Warehouse = { id: string; name: string; code: string }

const REPORTS = [
    { type: 'salary', label: 'Salary sheet', desc: 'Payable, deductions, OT, advances', icon: Wallet, color: '#00A651' },
    { type: 'attendance', label: 'Attendance grid', desc: 'Day-wise status for all employees', icon: Calendar, color: '#2563EB' },
    { type: 'amounts', label: 'Day amounts', desc: 'Per-day value from custom types', icon: IndianRupee, color: '#0891B2' },
    { type: 'advances', label: 'Advances register', desc: 'All advance payments & status', icon: FileSpreadsheet, color: '#7C3AED' },
    { type: 'settings', label: 'Attendance types', desc: 'Custom codes, amounts & calc rules', icon: Settings2, color: '#D97706' },
    { type: 'full', label: 'Full pack', desc: 'Salary + Attendance + Amounts + Advances', icon: Download, color: '#0F172A' },
]

export default function ReportsPage() {
    const today = new Date()
    const [month, setMonth] = useState(today.getMonth() + 1)
    const [year, setYear] = useState(today.getFullYear())
    const [warehouseId, setWarehouseId] = useState('')
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [loading, setLoading] = useState<string | null>(null)
    const [msg, setMsg] = useState('')

    useEffect(() => {
        fetch('/api/admin/warehouses')
            .then(r => r.json())
            .then(d => setWarehouses(Array.isArray(d.warehouses) ? d.warehouses : []))
            .catch(() => {})
    }, [])

    async function exportReport(type: string) {
        setLoading(type)
        setMsg('')
        try {
            const qs = new URLSearchParams({
                type, month: String(month), year: String(year),
            })
            if (warehouseId) qs.set('warehouse_id', warehouseId)
            const res = await fetch(`/api/admin/reports?${qs}`)
            if (!res.ok) {
                const d = await res.json().catch(() => ({}))
                setMsg(d.error ?? 'Export failed')
                setLoading(null)
                return
            }
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            const cd = res.headers.get('Content-Disposition') ?? ''
            a.download = cd.match(/filename="(.+)"/)?.[1] ?? `DDW_${type}.xlsx`
            a.href = url
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            setMsg('Downloaded')
        } catch {
            setMsg('Network error')
        }
        setLoading(null)
        setTimeout(() => setMsg(''), 2500)
    }

    const years = [year - 1, year, year + 1]
    const months = Array.from({ length: 12 }, (_, i) => i + 1)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="page-head">
                <div>
                    <h1>Reports</h1>
                    <p>Custom Excel exports — salary, attendance, advances & types</p>
                </div>
            </div>

            <div className="panel">
                <div className="panel__head">Filters</div>
                <div className="panel__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>MONTH</label>
                        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={selectStyle}>
                            {months.map(m => (
                                <option key={m} value={m}>
                                    {new Date(2024, m - 1).toLocaleString('en', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>YEAR</label>
                        <select value={year} onChange={e => setYear(parseInt(e.target.value))} style={selectStyle}>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>WAREHOUSE</label>
                        <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} style={selectStyle}>
                            <option value="">All warehouses</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.code} — {w.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {msg && (
                <div style={{
                    padding: '10px 14px', borderRadius: 12, fontWeight: 700, fontSize: 13,
                    background: msg === 'Downloaded' ? 'var(--green-light)' : '#FEF2F2',
                    color: msg === 'Downloaded' ? 'var(--green-dark)' : '#DC2626',
                }}>
                    {msg}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {REPORTS.map(({ type, label, desc, icon: Icon, color }) => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => exportReport(type)}
                        disabled={loading !== null}
                        style={{
                            textAlign: 'left',
                            background: 'var(--panel)',
                            border: '1px solid var(--border)',
                            borderRadius: 16,
                            padding: 18,
                            cursor: loading ? 'wait' : 'pointer',
                            boxShadow: 'var(--shadow-sm)',
                        }}
                    >
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: `${color}18`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: 12,
                        }}>
                            <Icon size={20} color={color} />
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 12 }}>{desc}</div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            fontSize: 12, fontWeight: 700, color: color,
                        }}>
                            <Download size={14} />
                            {loading === type ? 'Exporting…' : 'Download Excel'}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}

const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1.5px solid var(--border)',
    background: 'var(--input-bg)',
    color: 'var(--input-text)',
    fontSize: 14,
    fontWeight: 600,
}
