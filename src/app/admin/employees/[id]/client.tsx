'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft, Edit3, Save, X, Trash2,
    Calendar, IndianRupee, Phone, User,
    TrendingUp, Clock, CheckCircle, AlertCircle,
    ChevronRight,
} from 'lucide-react'

type Employee = {
    id: string; name: string; emp_code: string; phone?: string
    monthly_salary: number; per_day_rate: number
    joining_date?: string; is_active: boolean
    login_pin?: string
}

type Props = {
    emp: Employee
    presentDays: number; absentDays: number; halfDays: number
    totalAdvance: number
    salaryRecord: any
    recentAdvances: any[]
    currentMonth: number; currentYear: number
}

function formatCurrency(n: number) {
    return '₹' + n.toLocaleString('en-IN')
}

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function EmployeeDetailClient({
    emp, presentDays, absentDays, halfDays,
    totalAdvance, salaryRecord, recentAdvances,
    currentMonth, currentYear,
}: Props) {
    const router = useRouter()
    const supabase = createClient()

    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showDelete, setShowDelete] = useState(false)

    const [form, setForm] = useState({
        name: emp.name,
        emp_code: emp.emp_code,
        phone: emp.phone ?? '',
        monthly_salary: emp.monthly_salary,
        per_day_rate: emp.per_day_rate,
        joining_date: emp.joining_date ?? '',
        login_pin: emp.login_pin ?? '',
        is_active: emp.is_active,
    })

    const initials = emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    const joinDate = emp.joining_date
        ? new Date(emp.joining_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—'

    async function handleSave() {
        setSaving(true)
        await supabase.from('employees').update({
            name: form.name,
            emp_code: form.emp_code,
            phone: form.phone || null,
            monthly_salary: Number(form.monthly_salary),
            per_day_rate: Number(form.per_day_rate),
            joining_date: form.joining_date || null,
            login_pin: form.login_pin || null,
            is_active: form.is_active,
        }).eq('id', emp.id)
        setSaving(false)
        setEditing(false)
        router.refresh()
    }

    async function handleDelete() {
        setDeleting(true)
        await supabase.from('employees').update({ is_active: false }).eq('id', emp.id)
        router.push('/admin/employees')
        router.refresh()
    }

    // ─── READ VIEW ──────────────────────────────────────────────────────────────
    if (!editing) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Back + actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link href="/admin/employees" style={{
                    width: '38px', height: '38px', background: 'white',
                    borderRadius: '12px', border: '1px solid #E5E7EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none', flexShrink: 0,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                    <ArrowLeft size={18} color="#374151" />
                </Link>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '18px', color: '#111827' }}>Employee Details</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{MONTH_NAMES[currentMonth]} {currentYear} stats</div>
                </div>
                <button onClick={() => setEditing(true)} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
                    color: 'white', fontWeight: 700, fontSize: '13px',
                    padding: '9px 16px', borderRadius: '12px',
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                }}>
                    <Edit3 size={15} /> Edit
                </button>
            </div>

            {/* Profile hero card */}
            <div style={{
                background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',
                borderRadius: '22px', padding: '20px', color: 'white',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    {/* Avatar */}
                    <div style={{
                        width: '64px', height: '64px', flexShrink: 0,
                        background: 'rgba(255,255,255,0.15)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: '22px',
                        border: '3px solid rgba(255,255,255,0.2)',
                    }}>
                        {initials}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '-0.3px' }}>{emp.name}</div>
                        <div style={{ opacity: 0.6, fontSize: '13px', marginTop: '2px' }}>{emp.emp_code}</div>
                        <div style={{ marginTop: '8px' }}>
                            <span style={{
                                background: emp.is_active ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)',
                                color: emp.is_active ? '#34D399' : '#F87171',
                                fontWeight: 700, fontSize: '11px',
                                padding: '3px 10px', borderRadius: '999px',
                                border: `1px solid ${emp.is_active ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            }}>
                                {emp.is_active ? '● Active' : '● Inactive'}
                            </span>
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(0,166,81,0.2)', borderRadius: '14px',
                        padding: '10px 14px', textAlign: 'center',
                        border: '1px solid rgba(0,166,81,0.3)',
                    }}>
                        <div style={{ fontWeight: 900, fontSize: '18px', color: '#34D399' }}>
                            {formatCurrency(emp.monthly_salary)}
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '2px' }}>/ month</div>
                    </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                    {[
                        { label: 'Present', value: presentDays, color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
                        { label: 'Absent', value: absentDays, color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
                        { label: 'Half Day', value: halfDays, color: '#FCD34D', bg: 'rgba(252,211,77,0.15)' },
                        { label: 'Advance', value: formatCurrency(totalAdvance), color: '#C4B5FD', bg: 'rgba(196,181,253,0.15)' },
                    ].map(({ label, value, color, bg }) => (
                        <div key={label} style={{
                            background: bg, borderRadius: '12px',
                            padding: '10px 6px', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: typeof value === 'number' ? '20px' : '13px', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                            <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info cards */}
            <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', fontWeight: 700, fontSize: '13px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Employee Info
                </div>
                {[
                    { icon: User, label: 'Full Name', value: emp.name, color: '#6366F1' },
                    { icon: Calendar, label: 'Joining Date', value: joinDate, color: '#F59E0B' },
                    { icon: IndianRupee, label: 'Salary', value: `${formatCurrency(emp.monthly_salary)}/mo • ${formatCurrency(emp.per_day_rate)}/day`, color: '#10B981' },
                    { icon: Phone, label: 'Phone', value: emp.phone || '—', color: '#3B82F6' },
                ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '14px 16px', borderBottom: '1px solid #F9FAFB',
                    }}>
                        <div style={{
                            width: '38px', height: '38px', flexShrink: 0,
                            background: color + '15', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Icon size={18} color={color} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>{label}</div>
                            <div style={{ fontSize: '14px', color: '#111827', fontWeight: 600, marginTop: '1px' }}>{value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Login credentials */}
            <div style={{
                background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)',
                borderRadius: '20px', padding: '16px',
                border: '1px solid #BBF7D0',
                boxShadow: '0 2px 8px rgba(0,166,81,0.08)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ width: '32px', height: '32px', background: '#00A651', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={16} color="white" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#065F46' }}>Employee Login Credentials</div>
                        <div style={{ fontSize: '11px', color: '#6EE7B7', fontWeight: 500 }}>Share with employee for app access</div>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                        { label: 'Employee ID', value: emp.emp_code, mono: true },
                        { label: 'Login PIN', value: emp.login_pin ?? '—', mono: true },
                    ].map(({ label, value, mono }) => (
                        <div key={label} style={{
                            background: 'white', borderRadius: '14px', padding: '12px 14px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        }}>
                            <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginBottom: '4px' }}>{label}</div>
                            <div style={{
                                fontSize: '18px', fontWeight: 900, color: '#00A651',
                                fontFamily: mono ? 'monospace' : 'inherit',
                                letterSpacing: mono ? '2px' : 'normal',
                            }}>{value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Link href={`/admin/salary?emp=${emp.id}&month=${currentMonth}&year=${currentYear}`} style={{
                    background: 'white', borderRadius: '16px', padding: '14px',
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6',
                }}>
                    <div style={{ width: '38px', height: '38px', background: '#FFFBEB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IndianRupee size={18} color="#F59E0B" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>View Salary</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>This month</div>
                    </div>
                    <ChevronRight size={16} color="#D1D5DB" style={{ marginLeft: 'auto' }} />
                </Link>
                <Link href={`/admin/attendance?emp=${emp.id}`} style={{
                    background: 'white', borderRadius: '16px', padding: '14px',
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6',
                }}>
                    <div style={{ width: '38px', height: '38px', background: '#EFF6FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar size={18} color="#3B82F6" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>Attendance</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{MONTH_NAMES[currentMonth]} {currentYear}</div>
                    </div>
                    <ChevronRight size={16} color="#D1D5DB" style={{ marginLeft: 'auto' }} />
                </Link>
            </div>

            {/* Recent advances */}
            {recentAdvances.length > 0 && (
                <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>💳 Recent Advances</div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#8B5CF6' }}>{formatCurrency(totalAdvance)}</div>
                    </div>
                    {recentAdvances.map(adv => (
                        <div key={adv.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 16px', borderBottom: '1px solid #F9FAFB',
                        }}>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{adv.description || 'Advance'}</div>
                                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>
                                    {new Date(adv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '15px', color: '#8B5CF6' }}>
                                -{formatCurrency(adv.amount)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Danger zone */}
            <div style={{
                background: 'white', borderRadius: '20px', padding: '16px',
                border: '1px solid #FEE2E2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <AlertCircle size={16} color="#EF4444" />
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#EF4444' }}>Danger Zone</div>
                </div>
                <button onClick={() => setShowDelete(true)} style={{
                    width: '100%', padding: '11px',
                    background: '#FEF2F2', color: '#DC2626',
                    fontWeight: 700, fontSize: '13px',
                    border: '1px solid #FECACA', borderRadius: '12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                    <Trash2 size={15} /> Deactivate Employee
                </button>
            </div>

            {/* Delete confirmation modal */}
            {showDelete && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    zIndex: 1000, padding: '16px',
                }}
                    onClick={() => setShowDelete(false)}
                >
                    <div style={{
                        background: 'white', borderRadius: '24px', padding: '24px',
                        width: '100%', maxWidth: '400px',
                    }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
                            <div style={{ fontWeight: 800, fontSize: '18px', color: '#111827', marginBottom: '6px' }}>Deactivate {emp.name}?</div>
                            <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Employee will be marked inactive. All records will be preserved.</div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowDelete(false)} style={{
                                flex: 1, padding: '13px', background: '#F3F4F6',
                                color: '#374151', fontWeight: 700, fontSize: '14px',
                                border: 'none', borderRadius: '14px', cursor: 'pointer',
                            }}>
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting} style={{
                                flex: 1, padding: '13px', background: '#EF4444',
                                color: 'white', fontWeight: 700, fontSize: '14px',
                                border: 'none', borderRadius: '14px', cursor: 'pointer',
                            }}>
                                {deleting ? 'Processing...' : 'Deactivate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    // ─── EDIT VIEW ──────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setEditing(false)} style={{
                    width: '38px', height: '38px', background: 'white',
                    borderRadius: '12px', border: '1px solid #E5E7EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                    <X size={18} color="#374151" />
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '18px', color: '#111827' }}>Edit Employee</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Update employee details</div>
                </div>
                <button onClick={handleSave} disabled={saving} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg,#00A651,#007A3D)',
                    color: 'white', fontWeight: 700, fontSize: '13px',
                    padding: '9px 18px', borderRadius: '12px',
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,166,81,0.35)',
                    opacity: saving ? 0.7 : 1,
                }}>
                    <Save size={15} /> {saving ? 'Saving...' : 'Save'}
                </button>
            </div>

            {/* Form card */}
            <div style={{ background: 'white', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

                {/* Avatar preview */}
                <div style={{
                    background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
                    padding: '20px', display: 'flex', alignItems: 'center', gap: '14px',
                }}>
                    <div style={{
                        width: '56px', height: '56px',
                        background: 'rgba(255,255,255,0.15)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: '20px', color: 'white',
                        border: '2px solid rgba(255,255,255,0.2)',
                    }}>
                        {form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                    </div>
                    <div>
                        <div style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>{form.name || 'Employee Name'}</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '2px' }}>{form.emp_code}</div>
                    </div>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Name */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Full Name *
                        </label>
                        <input
                            value={form.name}
                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            placeholder="Employee full name"
                            style={inputStyle}
                        />
                    </div>

                    {/* Emp Code + Phone */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={labelStyle}>Employee Code *</label>
                            <input value={form.emp_code}
                                onChange={e => setForm(p => ({ ...p, emp_code: e.target.value }))}
                                placeholder="EMP001"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Phone</label>
                            <input value={form.phone}
                                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                placeholder="9876543210"
                                type="tel"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* Salary + Per Day */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={labelStyle}>Monthly Salary (₹) *</label>
                            <input value={form.monthly_salary}
                                onChange={e => setForm(p => ({
                                    ...p,
                                    monthly_salary: Number(e.target.value),
                                    per_day_rate: Math.round(Number(e.target.value) / 26),
                                }))}
                                type="number"
                                placeholder="12000"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Per Day Rate (₹)</label>
                            <input value={form.per_day_rate}
                                onChange={e => setForm(p => ({ ...p, per_day_rate: Number(e.target.value) }))}
                                type="number"
                                placeholder="462"
                                style={{ ...inputStyle, background: '#F9FAFB' }}
                            />
                            <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '3px' }}>
                                Auto: ÷26 = ₹{Math.round(Number(form.monthly_salary) / 26)}/day
                            </div>
                        </div>
                    </div>

                    {/* Joining Date */}
                    <div>
                        <label style={labelStyle}>Joining Date</label>
                        <input value={form.joining_date}
                            onChange={e => setForm(p => ({ ...p, joining_date: e.target.value }))}
                            type="date"
                            style={inputStyle}
                        />
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', background: '#F3F4F6', margin: '4px 0' }} />

                    {/* Login credentials */}
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ background: '#D1FAE5', color: '#059669', padding: '2px 8px', borderRadius: '6px', fontSize: '11px' }}>Login</span>
                            App Credentials
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>Login ID (Emp Code)</label>
                                <input value={form.emp_code} disabled
                                    style={{ ...inputStyle, background: '#F9FAFB', color: '#9CA3AF' }}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Login PIN</label>
                                <input value={form.login_pin}
                                    onChange={e => setForm(p => ({ ...p, login_pin: e.target.value }))}
                                    placeholder="e.g. 1001"
                                    maxLength={6}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Active status */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: form.is_active ? '#F0FDF4' : '#FEF2F2',
                        borderRadius: '14px', padding: '14px 16px',
                        border: `1px solid ${form.is_active ? '#BBF7D0' : '#FECACA'}`,
                    }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: form.is_active ? '#065F46' : '#991B1B' }}>
                                {form.is_active ? '✅ Employee Active' : '❌ Employee Inactive'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                                Inactive employees won't appear in daily marking
                            </div>
                        </div>
                        <button
                            onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                            style={{
                                width: '48px', height: '26px',
                                background: form.is_active ? '#00A651' : '#D1D5DB',
                                borderRadius: '999px', border: 'none', cursor: 'pointer',
                                position: 'relative', transition: 'background 0.2s',
                            }}
                        >
                            <div style={{
                                width: '20px', height: '20px', background: 'white',
                                borderRadius: '50%', position: 'absolute',
                                top: '3px', transition: 'left 0.2s',
                                left: form.is_active ? '25px' : '3px',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                            }} />
                        </button>
                    </div>

                </div>
            </div>

            {/* Save button (bottom) */}
            <button onClick={handleSave} disabled={saving} style={{
                width: '100%', padding: '16px',
                background: saving ? '#9CA3AF' : 'linear-gradient(135deg,#00A651,#007A3D)',
                color: 'white', fontWeight: 800, fontSize: '15px',
                border: 'none', borderRadius: '18px', cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 8px 24px rgba(0,166,81,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
                {saving ? (
                    <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
                            style={{ animation: 'spin 1s linear infinite' }}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        Saving changes...
                    </>
                ) : (
                    <><Save size={18} /> Save Changes</>
                )}
            </button>

            <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
        </div>
    )
}

const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 700, color: '#6B7280',
    display: 'block', marginBottom: '6px',
    textTransform: 'uppercase', letterSpacing: '0.5px',
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    border: '2px solid #E5E7EB', borderRadius: '12px',
    fontSize: '14px', fontWeight: 500, color: '#111827',
    outline: 'none', background: 'white',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.15s ease',
    boxSizing: 'border-box',
}