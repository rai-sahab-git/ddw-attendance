'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
    const router = useRouter()
    const supabase = createClient()

    const [tab, setTab] = useState<'admin' | 'employee'>('admin')

    // Admin fields
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)

    // Employee fields
    const [empCode, setEmpCode] = useState('')
    const [pin, setPin] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // ── Admin Login ─────────────────────────────────────────────────────────────
    async function handleAdminLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        })

        if (authError || !data.user) {
            setError('Invalid email or password. Please try again.')
            setLoading(false)
            return
        }

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

        const role = profile?.role ?? 'admin'
        router.push(role === 'admin' ? '/admin/dashboard' : '/employee/dashboard')
        router.refresh()
    }

    // ── Employee Login ───────────────────────────────────────────────────────────
    async function handleEmployeeLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const res = await fetch('/api/employee-auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emp_code: empCode.trim(), pin: pin.trim() }),
        })
        const data = await res.json()

        if (!res.ok) {
            setError(data.error ?? 'Invalid Employee ID or PIN.')
            setLoading(false)
            return
        }

        router.push('/employee/dashboard')
        router.refresh()
    }

    const accentColor = tab === 'admin' ? '#00A651' : '#3B82F6'

    return (
        <div style={{
            minHeight: '100dvh',
            background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f2027 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px 16px',
            fontFamily: 'Inter, sans-serif',
        }}>

            {/* ── Logo ── */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                    width: '72px', height: '72px',
                    background: 'linear-gradient(135deg, #00A651, #007A3D)',
                    borderRadius: '22px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 32px rgba(0,166,81,0.4)',
                }}>
                    <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
                        <rect x="4" y="6" width="24" height="4" rx="2" fill="white" />
                        <rect x="4" y="14" width="16" height="3.5" rx="2" fill="white" />
                        <rect x="4" y="22" width="24" height="4" rx="2" fill="white" />
                    </svg>
                </div>
                <div style={{ color: 'white', fontWeight: 900, fontSize: '24px', letterSpacing: '-0.5px' }}>
                    DDW Attendance
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginTop: '4px' }}>
                    Divine Digital Group
                </div>
            </div>

            {/* ── Card ── */}
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px',
                padding: '28px 24px',
                width: '100%', maxWidth: '400px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            }}>

                {/* Tab switcher */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '14px', padding: '4px',
                    marginBottom: '24px',
                }}>
                    {(['admin', 'employee'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); setError('') }}
                            style={{
                                flex: 1, padding: '10px',
                                borderRadius: '10px', border: 'none', cursor: 'pointer',
                                fontWeight: 700, fontSize: '14px',
                                background: tab === t
                                    ? (t === 'admin' ? '#00A651' : '#3B82F6')
                                    : 'transparent',
                                color: tab === t ? 'white' : 'rgba(255,255,255,0.4)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {t === 'admin' ? '🔐 Admin' : '👤 Employee'}
                        </button>
                    ))}
                </div>

                {/* Welcome text */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ color: 'white', fontWeight: 800, fontSize: '18px' }}>
                        {tab === 'admin' ? 'Admin Login' : 'Employee Login'}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginTop: '3px' }}>
                        {tab === 'admin'
                            ? 'Manage attendance & salary'
                            : 'Enter your Employee ID & PIN'}
                    </div>
                </div>

                {/* ── ADMIN FORM ── */}
                {tab === 'admin' && (
                    <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                        {/* Email */}
                        <div>
                            <label style={labelStyle}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@ddw.com"
                                required
                                style={getInputStyle()}
                                onFocus={e => { e.target.style.borderColor = '#00A651'; e.target.style.background = 'rgba(255,255,255,0.12)' }}
                                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label style={labelStyle}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{ ...getInputStyle(), paddingRight: '48px' }}
                                    onFocus={e => { e.target.style.borderColor = '#00A651'; e.target.style.background = 'rgba(255,255,255,0.12)' }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(p => !p)}
                                    style={{
                                        position: 'absolute', right: '14px', top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'rgba(255,255,255,0.4)', fontSize: '16px', padding: '4px',
                                    }}
                                >
                                    {showPass ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {error && <ErrorBox message={error} />}
                        <SubmitButton loading={loading} label="Sign In as Admin" color="#00A651" />
                    </form>
                )}

                {/* ── EMPLOYEE FORM ── */}
                {tab === 'employee' && (
                    <form onSubmit={handleEmployeeLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                        {/* Employee ID */}
                        <div>
                            <label style={labelStyle}>Employee ID</label>
                            <input
                                value={empCode}
                                onChange={e => setEmpCode(e.target.value.toUpperCase())}
                                placeholder="EMP001"
                                required
                                autoCapitalize="characters"
                                style={getInputStyle()}
                                onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.background = 'rgba(255,255,255,0.12)' }}
                                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
                            />
                        </div>

                        {/* PIN */}
                        <div>
                            <label style={labelStyle}>PIN</label>
                            <input
                                value={pin}
                                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="• • • •"
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                required
                                style={{
                                    ...getInputStyle(),
                                    letterSpacing: pin ? '8px' : '0',
                                    fontSize: pin ? '22px' : '15px',
                                }}
                                onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.background = 'rgba(255,255,255,0.12)' }}
                                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
                            />
                        </div>

                        {/* Hint */}
                        <div style={{
                            background: 'rgba(59,130,246,0.1)',
                            border: '1px solid rgba(59,130,246,0.25)',
                            borderRadius: '12px', padding: '10px 14px',
                        }}>
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', lineHeight: 1.5 }}>
                                💡 Your <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Employee ID</strong> and{' '}
                                <strong style={{ color: 'rgba(255,255,255,0.85)' }}>PIN</strong> are provided by your admin.
                            </div>
                        </div>

                        {error && <ErrorBox message={error} />}
                        <SubmitButton loading={loading} label="Sign In as Employee" color="#3B82F6" />
                    </form>
                )}
            </div>

            {/* Footer */}
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', marginTop: '24px', textAlign: 'center' }}>
                DDW Attendance v1.0 • Divine Digital Group
            </div>

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.25) !important; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px rgba(255,255,255,0.08) inset !important;
          -webkit-text-fill-color: white !important;
        }
      `}</style>
        </div>
    )
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    display: 'block', marginBottom: '6px',
}

function getInputStyle(): React.CSSProperties {
    return {
        width: '100%', padding: '13px 16px',
        background: 'rgba(255,255,255,0.08)',
        border: '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: '14px',
        color: 'white', fontSize: '15px', outline: 'none',
        fontFamily: 'Inter, sans-serif',
        transition: 'border-color 0.15s ease, background 0.15s ease',
        boxSizing: 'border-box',
    }
}

function ErrorBox({ message }: { message: string }) {
    return (
        <div style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '12px', padding: '10px 14px',
            color: '#FCA5A5', fontSize: '13px', fontWeight: 500,
        }}>
            ⚠️ {message}
        </div>
    )
}

function SubmitButton({
    loading, label, color,
}: {
    loading: boolean; label: string; color: string
}) {
    return (
        <button
            type="submit"
            disabled={loading}
            style={{
                width: '100%', padding: '14px',
                background: loading
                    ? 'rgba(255,255,255,0.1)'
                    : `linear-gradient(135deg, ${color}, ${color}cc)`,
                color: 'white', fontWeight: 800, fontSize: '15px',
                border: 'none', borderRadius: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '4px',
                boxShadow: loading ? 'none' : `0 8px 24px ${color}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s ease',
            }}
        >
            {loading ? (
                <>
                    <svg
                        width="18" height="18" viewBox="0 0 24 24"
                        fill="none" stroke="white" strokeWidth="2.5"
                        style={{ animation: 'spin 1s linear infinite' }}
                    >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Signing in...
                </>
            ) : label}
        </button>
    )
}