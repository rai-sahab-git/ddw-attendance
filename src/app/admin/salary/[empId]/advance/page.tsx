import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import AdvanceForm from './AdvanceForm'

export default async function AdvancePage({
    params,
    searchParams,
}: {
    params: Promise<{ empId: string }>
    searchParams: Promise<{ month?: string; year?: string }>
}) {
    const { empId } = await params
    const sp = await searchParams
    const supabase = await createClient()
    const { data: employee } = await supabase.from('employees').select('*').eq('id', empId).single()
    if (!employee) notFound()

    const today = new Date()
    const month = parseInt(sp.month ?? String(today.getMonth() + 1))
    const year = parseInt(sp.year ?? String(today.getFullYear()))

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link href={`/admin/salary/${empId}?month=${month}&year=${year}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', color: '#374151',
                }}>
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 style={{ fontWeight: 800, fontSize: '20px', color: '#111827', margin: 0 }}>Add Advance</h1>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '1px' }}>{employee.name}</p>
                </div>
            </div>

            <AdvanceForm employeeId={empId} employeeName={employee.name} month={month} year={year} />
        </div>
    )
}