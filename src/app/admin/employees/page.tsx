import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { UserPlus, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function EmployeesPage() {
    const supabase = await createClient()
    const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .order('emp_code', { ascending: true })

    const active = employees?.filter(e => e.is_active).length ?? 0
    const inactive = employees?.filter(e => !e.is_active).length ?? 0

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontWeight: 800, fontSize: '22px', color: '#111827', margin: 0 }}>Employees</h1>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>{employees?.length ?? 0} total</p>
                </div>
                <Link href="/admin/employees/new" style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg,#00A651,#059669)', color: 'white',
                    padding: '10px 16px', borderRadius: '12px', textDecoration: 'none',
                    fontWeight: 700, fontSize: '13px', boxShadow: '0 2px 8px rgba(0,166,81,0.3)',
                }}>
                    <UserPlus size={16} /> Add
                </Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#F0FDF4', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: '#059669' }}>{active}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>Active</div>
                </div>
                <div style={{ background: '#FEF2F2', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: '#EF4444' }}>{inactive}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>Inactive</div>
                </div>
            </div>

            {/* Employee List */}
            {!employees?.length ? (
                <div style={{ background: 'white', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>👤</div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#111827', marginBottom: '6px' }}>No employees yet</div>
                    <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>Add your first employee to get started</div>
                    <Link href="/admin/employees/new" style={{
                        display: 'inline-block', background: '#00A651', color: 'white',
                        padding: '10px 20px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '14px',
                    }}>
                        Add Employee
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {employees.map(emp => (
                        <Link key={emp.id} href={`/admin/employees/${emp.id}`} style={{
                            display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none',
                            background: 'white', borderRadius: '14px', padding: '14px',
                            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                        }}>
                            {/* Avatar */}
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                                background: emp.is_active
                                    ? 'linear-gradient(135deg,#00A651,#059669)'
                                    : 'linear-gradient(135deg,#9CA3AF,#6B7280)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 800, fontSize: '16px',
                            }}>
                                {emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{emp.name}</span>
                                    {!emp.is_active && (
                                        <span style={{ background: '#FEE2E2', color: '#EF4444', borderRadius: '6px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>
                                            Inactive
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{emp.emp_code}</div>
                            </div>

                            {/* Salary */}
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: '14px', color: '#00A651' }}>{formatCurrency(emp.monthly_salary)}</div>
                                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>per month</div>
                            </div>

                            <ChevronRight size={16} color="#D1D5DB" />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}