'use client'
import { useState } from 'react'
import { Download } from 'lucide-react'

type Props = {
    month: number
    year: number
    label?: string
    style?: React.CSSProperties
}

export default function ExportButton({ month, year, label, style }: Props) {
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')

    async function handleExport() {
        setLoading(true)
        setMsg('')
        try {
            const res = await fetch(`/api/admin/export?month=${month}&year=${year}`)
            if (!res.ok) {
                setMsg('❌ Export failed')
                setLoading(false)
                return
            }
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            const cd = res.headers.get('Content-Disposition') ?? ''
            const name = cd.match(/filename="(.+)"/)?.[1] ?? `DDW_Export.xlsx`
            a.href = url
            a.download = name
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            setMsg('✅ Downloaded!')
        } catch {
            setMsg('❌ Network error')
        }
        setLoading(false)
        setTimeout(() => setMsg(''), 3000)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <button
                onClick={handleExport}
                disabled={loading}
                style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: loading ? '#9CA3AF' : 'linear-gradient(135deg,#1D6F42,#217346)',
                    color: 'white', padding: '10px 16px', borderRadius: '12px',
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 700, fontSize: '13px',
                    boxShadow: '0 2px 8px rgba(29,111,66,0.35)',
                    ...style,
                }}
            >
                <Download size={16} />
                {loading ? 'Exporting...' : (label ?? 'Export Excel')}
            </button>
            {msg && (
                <span style={{
                    fontSize: '11px', fontWeight: 700,
                    color: msg.startsWith('✅') ? '#059669' : '#EF4444',
                }}>
                    {msg}
                </span>
            )}
        </div>
    )
}