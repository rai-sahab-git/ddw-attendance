import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { calculateSalaryV2 } from '@/lib/salary-calculator'
import SalaryEditForm from './SalaryEditForm'

function getMonthName(m: number) {
    return ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m] ?? ''
}
function formatCurrency(n: number) {
    return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export default async function SalaryDetailPage({
    params, searchParams,
}: {
    params: Promise<{ empId: string }>
    searchParams: Promise<{ month?: string; year?: string }>
}) {
    const { empId } = await params
    const sp = await searchParams
    const supabase = await createClient()
    const today = new Date()
    const month = parseInt(sp.month ?? String(today.getMonth() + 1))
    const year = parseInt(sp.year ?? String(today.getFullYear()))

    const [
        { data: employee },
        { data: attendance },
        { data: advances },
        { data: savedRecord },
        { data: settings },
        { data: overrides },
    ] = await Promise.all([
        supabase.from('employees').select('*').eq('id', empId).single(),
        supabase.from('attendance_records').select('status').eq('employee_id', empId).eq('month', month).eq('year', year),
        supabase.from('advance_payments').select('*').eq('employee_id', empId).order('date', { ascending: false }),
        supabase.from('monthly_salary').select('*').eq('employee_id', empId).eq('month', month).eq('year', year).maybeSingle(),
        supabase.from('attendance_settings').select('*').eq('is_active', true),
        supabase.from('employee_type_overrides').select('*').eq('employee_id', empId),
    ])

    if (!employee) notFound()

    const monthlyAdvance = (advances ?? [])
        .filter((a: any) => a.deduct_month === month && a.deduct_year === year)
        .reduce((s: number, a: any) => s + (a.amount ?? 0), 0)

    const salary = calculateSalaryV2(
        employee as any,
        (attendance ?? []) as any,
        (settings ?? []) as any,
        (overrides ?? []) as any,
        monthlyAdvance,
        savedRecord?.other_deductions ?? 0,
        savedRecord?.paid_amount ?? 0,
        month, year,
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link href="/admin/salary" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: '#F3F4F6', color: '#374151',
                }}>
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 style={{ fontWeight: 900, fontSize: '20px', color: '#111827', margin: 0 }}>{employee.name}</h1>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                        {getMonthName(month)} {year} · {employee.emp_code}
                    </p>
                </div>
            </div>

            {/* Attendance summary pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {salary.presentDays > 0 &&
                    <Pill label={`${salary.presentDays} Present`} color="#00A651" bg="#F0FDF4" />}
                {salary.absentDays > 0 &&
                    <Pill label={`${salary.absentDays} Absent`} color="#EF4444" bg="#FEF2F2" />}
                {salary.halfDays > 0 &&
                    <Pill label={`${salary.halfDays} Half Day`} color="#F59E0B" bg="#FFFBEB" />}
                {salary.typeBreakdown
                    .filter(t => t.amount > 0)
                    .map(t => (
                        <Pill key={t.code} label={`${t.count}× ${t.code}`} color="#8B5CF6" bg="#F5F3FF" />
                    ))}
            </div>

            {/* Salary form */}
            <SalaryEditForm
                employee={employee as any}
                month={month}
                year={year}
                savedRecord={savedRecord}
                currentSalary={salary as any}
                monthlyAdvance={monthlyAdvance}
            />

            {/* Advance History */}
            <div style={{
                background: 'white', borderRadius: '16px', padding: '16px',
                border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>Advance History</div>
                    <Link href={`/admin/salary/${empId}/advance`} style={{
                        fontSize: '12px', fontWeight: 700, color: '#00A651',
                        textDecoration: 'none', background: '#F0FDF4',
                        padding: '6px 12px', borderRadius: '8px',
                    }}>+ Add</Link>
                </div>

                {!(advances?.length) ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF', fontSize: '13px' }}>
                        No advance records
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {advances.map((adv: any) => (
                            <div key={adv.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 12px', borderRadius: '10px', background: '#F9FAFB',
                            }}>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>
                                        {formatCurrency(adv.amount)}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                        {adv.date} · {adv.description || 'Advance'}
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '99px',
                                    color: adv.is_deducted ? '#059669' : '#F59E0B',
                                    background: adv.is_deducted ? '#F0FDF4' : '#FFFBEB',
                                }}>
                                    {adv.is_deducted
                                        ? `Deducted${adv.deduct_month ? ` (${getMonthName(adv.deduct_month).slice(0, 3)})` : ''}`
                                        : 'Pending'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
    return (
        <div style={{
            padding: '5px 12px', borderRadius: '99px',
            fontWeight: 800, fontSize: '12px', background: bg, color,
        }}>
            {label}
        </div>
    )
}