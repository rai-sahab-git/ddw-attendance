'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import {
    LayoutDashboard, CalendarCheck, Users, IndianRupee,
    ClipboardList, LogOut, Settings, FileSpreadsheet,
    Palette, Building2, MoreHorizontal, X,
} from 'lucide-react'
import { NavigationPrefetch } from '@/components/NavigationPrefetch'

const NAV = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/admin/attendance', icon: CalendarCheck, label: 'Attendance' },
    { href: '/admin/salary', icon: IndianRupee, label: 'Salary' },
    { href: '/admin/employees', icon: Users, label: 'Employees' },
    { href: '/admin/requests', icon: ClipboardList, label: 'Requests' },
    { href: '/admin/reports', icon: FileSpreadsheet, label: 'Reports' },
]

const MORE_LINKS = [
    { href: '/admin/requests', icon: ClipboardList, label: 'Requests' },
    { href: '/admin/reports', icon: FileSpreadsheet, label: 'Reports' },
    { href: '/admin/organization', icon: Building2, label: 'Organization' },
    { href: '/admin/appearance', icon: Palette, label: 'Appearance' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

const PREFETCH = [
    ...NAV.map(n => n.href),
    '/admin/settings',
    '/admin/appearance',
    '/admin/organization',
    '/admin/attendance/mark',
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const [loggingOut, setLoggingOut] = useState(false)
    const [pendingCount, setPendingCount] = useState(0)
    const [moreOpen, setMoreOpen] = useState(false)

    useEffect(() => {
        setMoreOpen(false)
    }, [pathname])

    useEffect(() => {
        let alive = true
        async function fetchPending() {
            const { count } = await supabase
                .from('attendance_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')
            if (alive) setPendingCount(count ?? 0)
        }
        fetchPending()
        const timer = setInterval(fetchPending, 90000)
        return () => { alive = false; clearInterval(timer) }
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

    const moreActive = MORE_LINKS.some(l => isActive(l.href))
    const wide = pathname.startsWith('/admin/attendance') || pathname.startsWith('/admin/reports')

    return (
        <div className={`app-shell${wide ? ' app-shell--wide' : ''}`}>
            <NavigationPrefetch routes={PREFETCH} />

            <header className="app-shell__top">
                <Link href="/admin/dashboard" className="app-shell__brand" prefetch>
                    <div className="app-shell__brand-icon">
                        <CalendarCheck size={16} color="white" />
                    </div>
                    <div>
                        <div className="app-shell__brand-title">DDW</div>
                        <div className="app-shell__brand-sub">Attendance</div>
                    </div>
                </Link>
                <div className="app-shell__top-actions">
                    <Link href="/admin/appearance" className="btn btn--ghost" aria-label="Appearance" prefetch
                        style={{ width: 36, height: 36, padding: 0 }}>
                        <Palette size={16} />
                    </Link>
                    <Link href="/admin/settings" className="btn btn--ghost" aria-label="Settings" prefetch
                        style={{ width: 36, height: 36, padding: 0 }}
                        aria-current={pathname.startsWith('/admin/settings') ? 'page' : undefined}>
                        <Settings size={16} />
                    </Link>
                    <button type="button" onClick={handleLogout} disabled={loggingOut}
                        className="btn btn--danger" aria-label="Log out"
                        style={{ padding: '7px 10px', minHeight: 36 }}>
                        <LogOut size={13} /> Out
                    </button>
                </div>
            </header>

            <div className="app-shell__body">
                <aside className="app-shell__sidebar" aria-label="Admin sidebar">
                    <Link href="/admin/dashboard" className="app-shell__sidebar-brand" prefetch>
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
                                <Link key={href} href={href} prefetch
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
                        <Link href="/admin/organization" prefetch
                            className={`app-shell__side-link${isActive('/admin/organization') ? ' is-active' : ''}`}
                            title="Organization">
                            <Building2 size={20} />
                            <span>Organization</span>
                        </Link>
                        <Link href="/admin/appearance" prefetch
                            className={`app-shell__side-link${isActive('/admin/appearance') ? ' is-active' : ''}`}
                            title="Appearance">
                            <Palette size={20} />
                            <span>Appearance</span>
                        </Link>
                        <Link href="/admin/settings" prefetch
                            className={`app-shell__side-link${isActive('/admin/settings') ? ' is-active' : ''}`}
                            title="Settings">
                            <Settings size={20} />
                            <span>Settings</span>
                        </Link>
                        <button type="button" onClick={handleLogout} disabled={loggingOut}
                            className="app-shell__side-link" title="Log out"
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', width: '100%' }}>
                            <LogOut size={20} color="#EF4444" />
                            <span style={{ color: '#EF4444' }}>{loggingOut ? '…' : 'Log out'}</span>
                        </button>
                    </div>
                </aside>

                <main className="app-shell__content page-enter">{children}</main>
            </div>

            {moreOpen && (
                <div className="more-sheet" role="dialog" aria-label="More">
                    <button type="button" className="more-sheet__backdrop" aria-label="Close" onClick={() => setMoreOpen(false)} />
                    <div className="more-sheet__panel">
                        <div className="more-sheet__head">
                            <span>More</span>
                            <button type="button" className="btn btn--ghost" style={{ width: 36, height: 36, padding: 0 }}
                                onClick={() => setMoreOpen(false)} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="more-sheet__grid">
                            {MORE_LINKS.map(({ href, icon: Icon, label }) => (
                                <Link key={href} href={href} prefetch
                                    className={`more-sheet__item${isActive(href) ? ' is-active' : ''}`}
                                    onClick={() => setMoreOpen(false)}>
                                    <Icon size={20} />
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <nav className="app-shell__bottom" aria-label="Admin navigation">
                {NAV.slice(0, 4).map(({ href, icon: Icon, label }) => {
                    const active = isActive(href)
                    return (
                        <Link key={href} href={href} prefetch
                            className={`app-shell__tab${active ? ' is-active' : ''}`}
                            aria-current={active ? 'page' : undefined}
                            aria-label={label}
                        >
                            <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                            {label}
                        </Link>
                    )
                })}
                <button
                    type="button"
                    className={`app-shell__tab${moreActive || moreOpen ? ' is-active' : ''}`}
                    onClick={() => setMoreOpen(v => !v)}
                    aria-expanded={moreOpen}
                    aria-label={pendingCount > 0 ? `More, ${pendingCount} pending requests` : 'More'}
                >
                    <span style={{ position: 'relative' }}>
                        <MoreHorizontal size={21} strokeWidth={moreActive || moreOpen ? 2.5 : 1.8} />
                        {pendingCount > 0 && (
                            <span className="app-shell__badge">{pendingCount > 99 ? '99+' : pendingCount}</span>
                        )}
                    </span>
                    More
                </button>
            </nav>
        </div>
    )
}
