'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard, CalendarCheck, IndianRupee, ClipboardList, LogOut,
} from 'lucide-react'

const NAV = [
    { href: '/employee/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/employee/attendance', icon: CalendarCheck, label: 'Attendance' },
    { href: '/employee/salary', icon: IndianRupee, label: 'Salary' },
    { href: '/employee/requests', icon: ClipboardList, label: 'Requests' },
]

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()

    async function handleLogout() {
        await fetch('/api/employee-auth/logout', { method: 'POST' })
        router.push('/login')
        router.refresh()
    }

    function isActive(href: string) {
        return pathname === href || pathname.startsWith(href + '/')
    }

    return (
        <div className="app-shell app-shell--employee">
            <header className="app-shell__top" style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderBottom: 'none',
            }}>
                <div className="app-shell__brand">
                    <div className="app-shell__brand-icon" style={{ background: 'rgba(255,255,255,0.15)' }}>
                        <span aria-hidden style={{ fontSize: 16 }}>👤</span>
                    </div>
                    <div>
                        <div className="app-shell__brand-title" style={{ color: '#fff' }}>My Attendance</div>
                        <div className="app-shell__brand-sub" style={{ color: 'rgba(255,255,255,0.65)' }}>Employee Portal</div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleLogout}
                    aria-label="Log out"
                    className="btn"
                    style={{
                        width: 36, height: 36, padding: 0,
                        background: 'rgba(255,255,255,0.1)', color: '#fff',
                    }}
                >
                    <LogOut size={18} />
                </button>
            </header>

            <div className="app-shell__body">
                <aside className="app-shell__sidebar" aria-label="Employee sidebar">
                    <Link href="/employee/dashboard" className="app-shell__sidebar-brand">
                        <div className="app-shell__brand-icon">
                            <CalendarCheck size={16} color="white" />
                        </div>
                        <div className="app-shell__sidebar-brand-text">
                            <div className="title" style={{ fontWeight: 900, fontSize: 15 }}>My Attendance</div>
                            <div className="sub" style={{ fontSize: 11 }}>Employee portal</div>
                        </div>
                    </Link>

                    <nav className="app-shell__sidebar-nav">
                        {NAV.map(({ href, icon: Icon, label }) => {
                            const active = isActive(href)
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`app-shell__side-link${active ? ' is-active' : ''}`}
                                    aria-current={active ? 'page' : undefined}
                                    title={label}
                                >
                                    <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                                    <span>{label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="app-shell__sidebar-footer">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="app-shell__side-link"
                            title="Log out"
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', width: '100%' }}
                        >
                            <LogOut size={20} color="#FCA5A5" />
                            <span style={{ color: '#FCA5A5' }}>Log out</span>
                        </button>
                    </div>
                </aside>

                <main className="app-shell__content">{children}</main>
            </div>

            <nav className="app-shell__bottom" aria-label="Employee navigation">
                {NAV.map(({ href, icon: Icon, label }) => {
                    const active = isActive(href)
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`app-shell__tab${active ? ' is-active' : ''}`}
                            aria-current={active ? 'page' : undefined}
                            aria-label={label}
                            style={active ? { color: '#1a1a2e' } : undefined}
                        >
                            <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                            {label}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
