'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const initialTab = searchParams.get('tab') === 'employee' ? 'employee' : 'admin'
    const [tab, setTab] = useState<'admin' | 'employee'>(initialTab)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)

    const [empCode, setEmpCode] = useState('')
    const [pin, setPin] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

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

    const accent = tab === 'admin' ? '#00A651' : '#3B82F6'

    return (
        <div className="login-page" style={{
            minHeight: '100dvh',
            background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 55%, #0f2027 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(16px, 4vw, 32px)',
            fontFamily: 'Inter, system-ui, sans-serif',
            colorScheme: 'dark',
        }}>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(20px, 4vw, 32px)', width: '100%', maxWidth: 420 }}>
                <div style={{
                    width: 64, height: 64,
                    background: 'linear-gradient(135deg, #00A651, #007A3D)',
                    borderRadius: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 14px',
                    boxShadow: '0 8px 32px rgba(0,166,81,0.35)',
                }}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
                        <rect x="4" y="6" width="24" height="4" rx="2" fill="white" />
                        <rect x="4" y="14" width="16" height="3.5" rx="2" fill="white" />
                        <rect x="4" y="22" width="24" height="4" rx="2" fill="white" />
                    </svg>
                </div>
                <h1 style={{ color: '#F8FAFC', fontWeight: 900, fontSize: 'clamp(22px, 5vw, 26px)', letterSpacing: '-0.5px', margin: 0 }}>
                    DDW Attendance
                </h1>
                <p style={{ color: '#94A3B8', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                    Divine Digital Group
                </p>
            </div>

            <div style={{
                background: '#0F172A',
                border: '1px solid #334155',
                borderRadius: 20,
                padding: 'clamp(20px, 4vw, 28px)',
                width: '100%',
                maxWidth: 420,
                boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
            }}>
                <div style={{
                    display: 'flex',
                    background: '#1E293B',
                    borderRadius: 12,
                    padding: 4,
                    marginBottom: 22,
                    gap: 4,
                }} role="tablist" aria-label="Login type">
                    {(['admin', 'employee'] as const).map(t => (
                        <button
                            key={t}
                            type="button"
                            role="tab"
                            aria-selected={tab === t}
                            onClick={() => { setTab(t); setError('') }}
                            style={{
                                flex: 1,
                                padding: '11px 8px',
                                borderRadius: 10,
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: 14,
                                background: tab === t ? (t === 'admin' ? '#00A651' : '#3B82F6') : 'transparent',
                                color: tab === t ? '#FFFFFF' : '#94A3B8',
                                transition: 'all 0.15s ease',
                                minHeight: 44,
                            }}
                        >
                            {t === 'admin' ? 'Admin' : 'Employee'}
                        </button>
                    ))}
                </div>

                <div style={{ marginBottom: 18 }}>
                    <div style={{ color: '#F8FAFC', fontWeight: 800, fontSize: 18 }}>
                        {tab === 'admin' ? 'Admin Login' : 'Employee Login'}
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: 13, marginTop: 3 }}>
                        {tab === 'admin'
                            ? 'Manage attendance & salary'
                            : 'Enter your Employee ID & PIN'}
                    </div>
                </div>

                {tab === 'admin' && (
                    <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <label htmlFor="admin-email" style={labelStyle}>Email</label>
                            <input
                                id="admin-email"
                                className="login-input"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@ddw.com"
                                required
                                autoComplete="username"
                                style={inputStyle(accent)}
                            />
                        </div>
                        <div>
                            <label htmlFor="admin-password" style={labelStyle}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="admin-password"
                                    className="login-input"
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    style={{ ...inputStyle(accent), paddingRight: 64 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(p => !p)}
                                    aria-label={showPass ? 'Hide password' : 'Show password'}
                                    style={{
                                        position: 'absolute',
                                        right: 8,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: '#334155',
                                        border: 'none',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        color: '#E2E8F0',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        padding: '6px 10px',
                                        minHeight: 32,
                                    }}
                                >
                                    {showPass ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>
                        {error && <ErrorBox message={error} />}
                        <SubmitButton loading={loading} label="Sign In as Admin" color="#00A651" />
                    </form>
                )}

                {tab === 'employee' && (
                    <form onSubmit={handleEmployeeLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <label htmlFor="emp-code" style={labelStyle}>Employee ID</label>
                            <input
                                id="emp-code"
                                className="login-input"
                                value={empCode}
                                onChange={e => setEmpCode(e.target.value.toUpperCase())}
                                placeholder="EMP001"
                                required
                                autoCapitalize="characters"
                                autoComplete="username"
                                style={inputStyle(accent)}
                            />
                        </div>
                        <div>
                            <label htmlFor="emp-pin" style={labelStyle}>PIN</label>
                            <input
                                id="emp-pin"
                                className="login-input"
                                value={pin}
                                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="••••"
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                required
                                autoComplete="current-password"
                                style={{
                                    ...inputStyle(accent),
                                    letterSpacing: pin ? 10 : 0,
                                    fontSize: pin ? 22 : 15,
                                    textAlign: pin ? 'center' : 'left',
                                }}
                            />
                        </div>
                        <div style={{
                            background: 'rgba(59,130,246,0.12)',
                            border: '1px solid rgba(59,130,246,0.35)',
                            borderRadius: 12,
                            padding: '10px 14px',
                        }}>
                            <p style={{ color: '#CBD5E1', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                                Your <strong style={{ color: '#F8FAFC' }}>Employee ID</strong> and{' '}
                                <strong style={{ color: '#F8FAFC' }}>PIN</strong> are provided by your admin.
                            </p>
                        </div>
                        {error && <ErrorBox message={error} />}
                        <SubmitButton loading={loading} label="Sign In as Employee" color="#3B82F6" />
                    </form>
                )}
            </div>

            <p style={{ color: '#64748B', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
                DDW Attendance v1.0 · Divine Digital Group
            </p>
        </div>
    )
}

const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#CBD5E1',
    display: 'block',
    marginBottom: 6,
}

function inputStyle(accent: string): React.CSSProperties {
    return {
        width: '100%',
        padding: '13px 14px',
        background: '#1E293B',
        border: '1.5px solid #475569',
        borderRadius: 12,
        color: '#F8FAFC',
        fontSize: 15,
        outline: 'none',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        minHeight: 48,
        // CSS variable used by :focus in stylesheet
        ['--login-accent' as string]: accent,
    }
}

function ErrorBox({ message }: { message: string }) {
    return (
        <div role="alert" style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 12,
            padding: '10px 14px',
            color: '#FECACA',
            fontSize: 13,
            fontWeight: 500,
        }}>
            {message}
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
                width: '100%',
                padding: 14,
                minHeight: 48,
                background: loading ? '#334155' : color,
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 15,
                border: 'none',
                borderRadius: 12,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
                boxShadow: loading ? 'none' : `0 8px 24px ${color}55`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
            }}
        >
            {loading ? 'Signing in…' : label}
        </button>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="login-page" style={{
                minHeight: '100dvh',
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F8FAFC',
                colorScheme: 'dark',
            }}>
                Loading…
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
