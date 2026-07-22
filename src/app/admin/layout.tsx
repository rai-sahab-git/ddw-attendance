'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import {
    LayoutDashboard, CalendarCheck, Users, IndianRupee,
    ClipboardList, LogOut, Settings,
} from 'lucide-react'

const NAV = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/admin/attendance', icon: CalendarCheck, label: 'Attendance' },
    { href: '/admin/salary', icon: IndianRupee, label: 'Salary' },
    { href: '/admin/employees', icon: Users, label: 'Employees' },
    { href: '/admin/requests', icon: ClipboardList, label: 'Requests' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const [loggingOut, setLoggingOut] = useState(false)
    const [pendingCount, setPendingCount] = useState(0)

    useEffect(() => {
        async function fetchPending() {
            const { count } = await supabase
                .from('attendance_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')
            setPendingCount(count ?? 0)
        }
        fetchPending()
        const timer = setInterval(fetchPending, 60000)
        return () => clearInterval(timer)
    }, [])

    async function handleLogout() {
        setLoggingOut(true)
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    function isActive(href: string) {
        return pathname === href || pathname.startsWith(href + '/')
    }

    const wide = pathname.startsWith('/admin/attendance')

    return (
        <div className={`app-shell${wide ? ' app-shell--wide' : ''}`}>
            {/* Mobile top bar */}
            <header className="app-shell__top">
                <Link href="/admin/dashboard" className="app-shell__brand">
                    <div className="app-shell__brand-icon">
                        <CalendarCheck size={16} color="white" />
                    </div>
                    <div>
                        <div className="app-shell__brand-title">DDW</div>
                        <div className="app-shell__brand-sub">Attendance</div>
                    </div>
                </Link>
                <div className="app-shell__top-actions">
                    <Link
                        href="/admin/settings"
                        className="btn btn--ghost"
                        aria-label="Settings"
                        aria-current={pathname.startsWith('/admin/settings') ? 'page' : undefined}
                        style={{ width: 36, height: 36, padding: 0 }}
                    >
                        <Settings size={16} />
                    </Link>
                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="btn btn--danger"
                        aria-label="Log out"
                        style={{ padding: '7px 10px', minHeight: 36 }}
                    >
                        <LogOut size={13} />
                        Out
                    </button>
                </div>
            </header>

            <div className="app-shell__body">
                {/* Desktop / tablet sidebar */}
                <aside className="app-shell__sidebar" aria-label="Admin sidebar">
                    <Link href="/admin/dashboard" className="app-shell__sidebar-brand">
                        <div className="app-shell__brand-icon">
                            <CalendarCheck size={16} color="white" />
                        </div>
                        <div className="app-shell__sidebar-brand-text">
                            <div className="app-shell__brand-title">DDW Attendance</div>
                            <div className="app-shell__brand-sub">Admin console</div>
                        </div>
                    </Link>

                    <nav className="app-shell__sidebar-nav">
                        {NAV.map(({ href, icon: Icon, label }) => {
                            const active = isActive(href)
                            const badge = href === '/admin/requests' ? pendingCount : 0
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`app-shell__side-link${active ? ' is-active' : ''}`}
                                    aria-current={active ? 'page' : undefined}
                                    title={label}
                                >
                                    <span style={{ position: 'relative', display: 'inline-flex' }}>
                                        <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                                        {badge > 0 && (
                                            <span className="app-shell__badge" style={{ top: -6, right: -10 }}>
                                                {badge > 99 ? '99+' : badge}
                                            </span>
                                        )}
                                    </span>
                                    <span>{label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="app-shell__sidebar-footer">
                        <Link
                            href="/admin/settings"
                            className={`app-shell__side-link${pathname.startsWith('/admin/settings') ? ' is-active' : ''}`}
                            title="Settings"
                        >
                            <Settings size={20} />
                            <span>Settings</span>
                        </Link>
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="app-shell__side-link"
                            title="Log out"
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', width: '100%' }}
                        >
                            <LogOut size={20} color="#EF4444" />
                            <span style={{ color: '#EF4444' }}>{loggingOut ? '…' : 'Log out'}</span>
                        </button>
                    </div>
                </aside>

                <main className="app-shell__content">{children}</main>
            </div>

            {/* Mobile bottom nav */}
            <nav className="app-shell__bottom" aria-label="Admin navigation">
                {NAV.map(({ href, icon: Icon, label }) => {
                    const active = isActive(href)
                    const badge = href === '/admin/requests' ? pendingCount : 0
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`app-shell__tab${active ? ' is-active' : ''}`}
                            aria-current={active ? 'page' : undefined}
                            aria-label={badge > 0 ? `${label}, ${badge} pending` : label}
                        >
                            <span style={{ position: 'relative' }}>
                                <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                                {badge > 0 && (
                                    <span className="app-shell__badge">
                                        {badge > 99 ? '99+' : badge}
                                    </span>
                                )}
                            </span>
                            {label}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
