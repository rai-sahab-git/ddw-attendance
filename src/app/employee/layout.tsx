'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, CalendarCheck, IndianRupee, ClipboardList, LogOut } from 'lucide-react'

const navItems = [
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

    return (
        <div style={{ minHeight: '100dvh', background: '#F4F6F9', fontFamily: 'Inter, sans-serif' }}>
            <header style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                position: 'sticky', top: 0, zIndex: 50,
                boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 16px', height: '56px', maxWidth: '640px', margin: '0 auto',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '34px', height: '34px',
                            background: 'rgba(255,255,255,0.15)',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span style={{ fontSize: '18px' }}>👤</span>
                        </div>
                        <div>
                            <div style={{ color: 'white', fontWeight: 800, fontSize: '15px', lineHeight: 1 }}>
                                My Attendance
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '2px' }}>
                                Employee Portal
                            </div>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{
                        width: '36px', height: '36px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '10px', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white',
                    }}>
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <main style={{ maxWidth: '640px', margin: '0 auto', padding: '16px 16px 90px' }}>
                {children}
            </main>

            <nav style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                background: 'white', borderTop: '1px solid #E5E7EB',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
                zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: '640px', margin: '0 auto' }}>
                    {navItems.map(({ href, icon: Icon, label }) => {
                        const active = pathname === href || pathname.startsWith(href + '/')
                        return (
                            <Link key={href} href={href} style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: '3px',
                                padding: '10px 12px',
                                color: active ? '#1a1a2e' : '#9CA3AF',
                                textDecoration: 'none', minWidth: '60px',
                                position: 'relative',
                            }}>
                                {active && (
                                    <span style={{
                                        position: 'absolute', top: 0, left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '24px', height: '3px',
                                        background: '#1a1a2e', borderRadius: '0 0 4px 4px',
                                    }} />
                                )}
                                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                                <span style={{ fontSize: '10px', fontWeight: active ? 700 : 500 }}>{label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}