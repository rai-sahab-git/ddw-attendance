'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard,
    CalendarCheck,
    Users,
    IndianRupee,
    ClipboardList,
    LogOut,
    Bell,
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

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <div style={{ minHeight: '100dvh', background: '#F4F6F9', fontFamily: 'Inter, sans-serif' }}>

            {/* ── Header ── */}
            <header style={{
                background: 'linear-gradient(135deg, #00A651 0%, #007A3D 100%)',
                position: 'sticky', top: 0, zIndex: 50,
                boxShadow: '0 2px 20px rgba(0,166,81,0.3)',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 16px', height: '56px', maxWidth: '640px', margin: '0 auto',
                }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '34px', height: '34px',
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                        }}>
                            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                                <path d="M5 8h22v3.5H5zM5 14.5h15v3H5zM5 21h22v3.5H5z" fill="white" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ color: 'white', fontWeight: 800, fontSize: '15px', lineHeight: 1 }}>
                                DDW Attendance
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginTop: '2px' }}>
                                Admin Panel
                            </div>
                        </div>
                    </div>

                    {/* Right actions */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <Link href="/admin/requests" style={{
                            width: '36px', height: '36px',
                            background: 'rgba(255,255,255,0.15)',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', textDecoration: 'none',
                        }}>
                            <Bell size={18} />
                        </Link>
                        <button onClick={handleLogout} style={{
                            width: '36px', height: '36px',
                            background: 'rgba(255,255,255,0.15)',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', border: 'none', cursor: 'pointer',
                        }}>
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Content ── */}
            <main style={{
                maxWidth: '640px', margin: '0 auto',
                padding: '16px 16px 90px',
            }}>
                {children}
            </main>

            {/* ── Bottom Nav ── */}
            <nav style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                background: 'white',
                borderTop: '1px solid #E5E7EB',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
                zIndex: 50,
                paddingBottom: 'env(safe-area-inset-bottom)',
            }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-around',
                    maxWidth: '640px', margin: '0 auto',
                }}>
                    {navItems.map(({ href, icon: Icon, label }) => {
                        const active = pathname === href || pathname.startsWith(href + '/')
                        return (
                            <Link key={href} href={href} style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: '3px',
                                padding: '10px 12px',
                                color: active ? '#00A651' : '#9CA3AF',
                                textDecoration: 'none',
                                minWidth: '60px',
                                position: 'relative',
                            }}>
                                {active && (
                                    <span style={{
                                        position: 'absolute', top: 0, left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '24px', height: '3px',
                                        background: '#00A651',
                                        borderRadius: '0 0 4px 4px',
                                    }} />
                                )}
                                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: active ? 700 : 500,
                                }}>
                                    {label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}