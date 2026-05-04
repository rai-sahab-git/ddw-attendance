'use client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { LayoutDashboard, CalendarCheck, Users, IndianRupee, ClipboardList, LogOut, Settings } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const [navLoading, setNavLoading] = useState(false)
    const [activeNav, setActiveNav] = useState<string | null>(null)
    const [loggingOut, setLoggingOut] = useState(false)
    const [pendingCount, setPendingCount] = useState(0)

    // Reset loading on route change
    useEffect(() => {
        setNavLoading(false)
        setActiveNav(null)
    }, [pathname])

    // Fetch pending requests count
    useEffect(() => {
        async function fetchPending() {
            const { count } = await supabase
                .from('attendance_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')
            setPendingCount(count ?? 0)
        }
        fetchPending()
        // Refresh every 60 seconds
        const timer = setInterval(fetchPending, 60000)
        return () => clearInterval(timer)
    }, [])

    function handleNavClick(href: string) {
        if (pathname === href) return
        setNavLoading(true)
        setActiveNav(href)
    }

    async function handleLogout() {
        setLoggingOut(true)
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const navItems = [
        { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Home', badge: 0 },
        { href: '/admin/attendance', icon: CalendarCheck, label: 'Attendance', badge: 0 },
        { href: '/admin/salary', icon: IndianRupee, label: 'Salary', badge: 0 },
        { href: '/admin/employees', icon: Users, label: 'Employees', badge: 0 },
        { href: '/admin/requests', icon: ClipboardList, label: 'Requests', badge: pendingCount },
    ]

    return (
        <div style={{ minHeight: '100dvh', background: '#F4F6F9', display: 'flex', flexDirection: 'column' }}>

            {/* Top loading bar */}
            {navLoading && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, height: '3px', zIndex: 9999,
                    background: 'linear-gradient(90deg,#00A651,#34D399,#00A651)',
                    backgroundSize: '200% 100%',
                    animation: 'loadingBar 1s linear infinite',
                }} />
            )}

            <style>{`
        @keyframes loadingBar { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-height: 500px) { .bottom-nav { display: none !important; } }
      `}</style>

            {/* Header */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'white', borderBottom: '1px solid #E5E7EB',
                padding: '10px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '9px',
                        background: 'linear-gradient(135deg,#00A651,#059669)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <CalendarCheck size={16} color="white" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: '15px', color: '#111827', lineHeight: 1 }}>DDW</div>
                        <div style={{ fontSize: '10px', color: '#9CA3AF', lineHeight: 1 }}>Attendance</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Settings */}
                    <Link href="/admin/settings"
                        style={{
                            width: '34px', height: '34px', borderRadius: '9px',
                            background: pathname.startsWith('/admin/settings') ? '#F0FDF4' : '#F9FAFB',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: pathname.startsWith('/admin/settings') ? '#00A651' : '#9CA3AF',
                            border: '1px solid #E5E7EB',
                        }}>
                        <Settings size={16} />
                    </Link>

                    {/* Logout */}
                    <button onClick={handleLogout} disabled={loggingOut}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            background: '#FEF2F2', color: '#EF4444',
                            border: 'none', borderRadius: '9px',
                            padding: '7px 11px', cursor: loggingOut ? 'not-allowed' : 'pointer',
                            fontWeight: 700, fontSize: '12px',
                        }}>
                        {loggingOut
                            ? <span style={{ width: '13px', height: '13px', border: '2px solid #FECACA', borderTopColor: '#EF4444', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                            : <LogOut size={13} />
                        }
                        {loggingOut ? '...' : 'Out'}
                    </button>
                </div>
            </header>

            {/* Content */}
            <main style={{
                flex: 1, padding: '14px', paddingBottom: '80px',
                maxWidth: '500px', width: '100%', margin: '0 auto',
                opacity: navLoading ? 0.55 : 1,
                transition: 'opacity 0.15s ease',
            }}>
                {children}
            </main>

            {/* Bottom nav */}
            <nav className="bottom-nav" style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
                background: 'white', borderTop: '1px solid #E5E7EB',
                display: 'flex',
                padding: '6px 0',
                paddingBottom: 'calc(6px + env(safe-area-inset-bottom))',
            }}>
                {navItems.map(({ href, icon: Icon, label, badge }) => {
                    const isActive = pathname === href || pathname.startsWith(href + '/')
                    const isLoading = activeNav === href

                    return (
                        <Link key={href} href={href} onClick={() => handleNavClick(href)}
                            style={{
                                flex: 1, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                gap: '2px', textDecoration: 'none', padding: '4px 2px',
                                color: isActive ? '#00A651' : '#9CA3AF',
                                position: 'relative',
                            }}
                        >
                            {/* Active top indicator */}
                            {isActive && (
                                <div style={{
                                    position: 'absolute', top: '-6px',
                                    width: '18px', height: '3px', borderRadius: '0 0 3px 3px',
                                    background: '#00A651',
                                }} />
                            )}

                            {/* Icon or spinner */}
                            <div style={{ position: 'relative' }}>
                                {isLoading ? (
                                    <span style={{
                                        width: '22px', height: '22px',
                                        border: '2px solid #E5E7EB', borderTopColor: '#00A651',
                                        borderRadius: '50%', display: 'inline-block',
                                        animation: 'spin 0.7s linear infinite',
                                    }} />
                                ) : (
                                    <Icon size={21} strokeWidth={isActive ? 2.5 : 1.8} />
                                )}

                                {/* Pending badge */}
                                {badge > 0 && !isLoading && (
                                    <div style={{
                                        position: 'absolute', top: '-5px', right: '-7px',
                                        background: '#EF4444', color: 'white',
                                        borderRadius: '99px', fontSize: '9px', fontWeight: 900,
                                        minWidth: '16px', height: '16px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '0 3px', border: '2px solid white',
                                        lineHeight: 1,
                                    }}>
                                        {badge > 99 ? '99+' : badge}
                                    </div>
                                )}
                            </div>

                            <span style={{ fontSize: '10px', fontWeight: isActive ? 800 : 500, lineHeight: 1 }}>
                                {label}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}