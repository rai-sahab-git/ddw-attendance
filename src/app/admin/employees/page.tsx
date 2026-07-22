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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="page-head">
                <div>
                    <h1>Employees</h1>
                    <p>{employees?.length ?? 0} total · {active} active</p>
                </div>
                <div className="page-head__actions">
                    <Link href="/admin/employees/new" className="btn btn--primary">
                        <UserPlus size={16} /> Add Employee
                    </Link>
                </div>
            </div>

            <div className="kpi-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="kpi-card" style={{ background: '#F0FDF4' }}>
                    <div className="kpi-card__value" style={{ color: '#059669' }}>{active}</div>
                    <div className="kpi-card__label">Active</div>
                </div>
                <div className="kpi-card" style={{ background: '#FEF2F2' }}>
                    <div className="kpi-card__value" style={{ color: '#EF4444' }}>{inactive}</div>
                    <div className="kpi-card__label">Inactive</div>
                </div>
            </div>

            {!employees?.length ? (
                <div className="panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 6 }}>No employees yet</div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Add your first employee to get started</div>
                    <Link href="/admin/employees/new" className="btn btn--primary">Add Employee</Link>
                </div>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Monthly salary</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map(emp => (
                                    <tr key={emp.id}>
                                        <td style={{ fontWeight: 700, color: '#64748B' }}>{emp.emp_code}</td>
                                        <td>
                                            <Link href={`/admin/employees/${emp.id}`} className="row-link">
                                                {emp.name}
                                            </Link>
                                        </td>
                                        <td style={{ color: '#64748B' }}>{emp.phone || '—'}</td>
                                        <td style={{ fontWeight: 800, color: '#00A651' }}>{formatCurrency(emp.monthly_salary)}</td>
                                        <td>
                                            <span style={{
                                                fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '3px 10px',
                                                background: emp.is_active ? '#DCFCE7' : '#FEE2E2',
                                                color: emp.is_active ? '#059669' : '#DC2626',
                                            }}>
                                                {emp.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <Link href={`/admin/employees/${emp.id}`} style={{ color: '#94A3B8' }}>
                                                <ChevronRight size={16} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="card-list card-list--desktop-hide">
                        {employees.map(emp => (
                            <Link key={emp.id} href={`/admin/employees/${emp.id}`} style={{
                                display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
                                background: 'white', borderRadius: 14, padding: 14,
                                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                            }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                    background: emp.is_active
                                        ? 'linear-gradient(135deg,#00A651,#059669)'
                                        : 'linear-gradient(135deg,#9CA3AF,#6B7280)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontWeight: 800, fontSize: 16,
                                }}>
                                    {emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{emp.name}</div>
                                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{emp.emp_code}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 800, fontSize: 14, color: '#00A651' }}>{formatCurrency(emp.monthly_salary)}</div>
                                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>per month</div>
                                </div>
                                <ChevronRight size={16} color="#D1D5DB" />
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
