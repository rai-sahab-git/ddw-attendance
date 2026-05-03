'use client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import {
    LayoutDashboard, CalendarCheck, Users,
    IndianRupee, ClipboardList, LogOut,
} from 'lucide-react'

const navItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/admin/attendance', icon: CalendarCheck, label: 'Attendance' },
    { href: '/admin/employees', icon: Users, label: 'Employees' },
    { href: '/admin/salary', icon: IndianRupee, label: 'Salary' },
    { href: '/admin/requests', icon: ClipboardList, label: 'Requests' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    // ── Global navigation loading state ──
    const [navLoading, setNavLoading] = useState(false)
    const [activeNav, setActiveNav] = useState<string | null>(null)
    const [loggingOut, setLoggingOut] = useState(false)

    // Reset loading when pathname changes (navigation completed)
    useEffect(() => {
        setNavLoading(false)
        setActiveNav(null)
    }, [pathname])

    function handleNavClick(href: string) {
        if (pathname === href) return   // already here
        setNavLoading(true)
        setActiveNav(href)
    }

    async function handleLogout() {
        setLoggingOut(true)
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <div style={{ minHeight: '100dvh', background: '#F4F6F9', display: 'flex', flexDirection: 'column' }}>

            {/* ── Global Loading Bar (top) ── */}
            {navLoading && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, height: '3px', zIndex: 9999,
                    background: 'linear-gradient(90deg, #00A651, #34D399, #00A651)',
                    backgroundSize: '200% 100%',
                    animation: 'loadingBar 1s linear infinite',
                }} />
            )}

            {/* ── CSS for loading bar animation ── */}
            <style>{`
        @keyframes loadingBar {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

            {/* ── Header ── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'white', borderBottom: '1px solid #E5E7EB',
                padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div>
                    <div style={{ fontWeight: 900, fontSize: '16px', color: '#00A651', lineHeight: 1 }}>DDW Attendance</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>Admin Panel</div>
                </div>

                {/* Logout */}
                <button onClick={handleLogout} disabled={loggingOut}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        background: loggingOut ? '#F3F4F6' : '#FEF2F2',
                        color: loggingOut ? '#9CA3AF' : '#EF4444',
                        border: 'none', borderRadius: '10px',
                        padding: '8px 12px', cursor: loggingOut ? 'not-allowed' : 'pointer',
                        fontWeight: 700, fontSize: '13px',
                    }}>
                    {loggingOut
                        ? <span style={{ width: '14px', height: '14px', border: '2px solid #D1D5DB', borderTopColor: '#9CA3AF', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                        : <LogOut size={14} />
                    }
                    {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
            </header>

            {/* ── Page Content ── */}
            <main style={{
                flex: 1, padding: '16px', paddingBottom: '80px',
                maxWidth: '480px', width: '100%', margin: '0 auto',
                // Dim content slightly while navigating
                opacity: navLoading ? 0.6 : 1,
                transition: 'opacity 0.15s ease',
            }}>
                {children}
            </main>

            {/* ── Bottom Navigation ── */}
            <nav style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
                background: 'white', borderTop: '1px solid #E5E7EB',
                display: 'flex', padding: '8px 0 calc(8px + env(safe-area-inset-bottom))',
            }}>
                {navItems.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname === href || pathname.startsWith(href + '/')
                    const isLoading = activeNav === href

                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => handleNavClick(href)}
                            style={{
                                flex: 1, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                gap: '3px', textDecoration: 'none',
                                padding: '4px 2px',
                                color: isActive ? '#00A651' : '#9CA3AF',
                                position: 'relative',
                            }}
                        >
                            {/* Active indicator dot */}
                            {isActive && (
                                <div style={{
                                    position: 'absolute', top: '-1px',
                                    width: '20px', height: '3px',
                                    borderRadius: '0 0 3px 3px',
                                    background: '#00A651',
                                }} />
                            )}

                            {/* Icon — spinner if loading, icon if not */}
                            {isLoading ? (
                                <span style={{
                                    width: '22px', height: '22px',
                                    border: '2px solid #E5E7EB',
                                    borderTopColor: '#00A651',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'spin 0.7s linear infinite',
                                }} />
                            ) : (
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                            )}

                            <span style={{
                                fontSize: '10px', fontWeight: isActive ? 800 : 500,
                                lineHeight: 1,
                            }}>
                                {label}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}