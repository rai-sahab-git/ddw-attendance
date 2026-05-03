import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import EmployeeForm from '../EmployeeForm'

export default function NewEmployeePage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link href="/admin/employees" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', color: '#374151',
                }}>
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 style={{ fontWeight: 800, fontSize: '20px', color: '#111827', margin: 0 }}>Add Employee</h1>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '1px' }}>Fill in the details below</p>
                </div>
            </div>

            <EmployeeForm isNew />
        </div>
    )
}