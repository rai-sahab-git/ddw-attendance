'use client'

import { useTheme, type ThemeMode } from '@/lib/theme'
import { Monitor, Moon, Sun, Check } from 'lucide-react'

const OPTIONS: { value: ThemeMode; label: string; desc: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', desc: 'Bright surfaces, high contrast', icon: Sun },
    { value: 'dark', label: 'Dark', desc: 'Low-light friendly', icon: Moon },
    { value: 'system', label: 'System', desc: 'Follow device setting', icon: Monitor },
]

export default function AppearancePage() {
    const { theme, resolved, setTheme } = useTheme()

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
            <div className="page-head">
                <div>
                    <h1>Appearance</h1>
                    <p>Theme preference · currently {resolved}</p>
                </div>
            </div>

            <div className="panel">
                <div className="panel__head">Theme</div>
                <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {OPTIONS.map(({ value, label, desc, icon: Icon }) => {
                        const active = theme === value
                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setTheme(value)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    padding: 14, borderRadius: 14,
                                    border: active ? '2px solid var(--green-primary)' : '1.5px solid var(--border)',
                                    background: active ? 'var(--green-light)' : 'var(--panel)',
                                    cursor: 'pointer', textAlign: 'left', width: '100%',
                                }}
                            >
                                <div style={{
                                    width: 42, height: 42, borderRadius: 12,
                                    background: active ? 'var(--green-primary)' : 'var(--gray-50)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: active ? '#fff' : 'var(--text-muted)',
                                }}>
                                    <Icon size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{label}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
                                </div>
                                {active && <Check size={18} color="var(--green-primary)" />}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="panel">
                <div className="panel__body">
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        Theme is saved on this device and synced to your account when signed in.
                        Brand green stays consistent in both modes.
                    </div>
                </div>
            </div>
        </div>
    )
}
