import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function EmployeesPage() {
    const supabase = await createClient()

    const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .order('emp_code', { ascending: true })

    return (
        <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Employees</h1>
                    <p className="text-sm text-gray-500">{employees?.length ?? 0} total</p>
                </div>
                <Link
                    href="/admin/employees/add"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                    <UserPlus size={16} />
                    Add
                </Link>
            </div>

            {/* Employee List */}
            {!employees?.length ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <UserPlus size={24} className="text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-medium">No employees yet</p>
                    <p className="text-sm text-gray-500 mt-1">Add your first employee to get started</p>
                    <Link
                        href="/admin/employees/add"
                        className="inline-block mt-4 bg-green-600 text-white text-sm font-medium px-6 py-2 rounded-xl"
                    >
                        Add Employee
                    </Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {employees.map(emp => (
                        <Link
                            key={emp.id}
                            href={`/admin/employees/${emp.id}`}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-green-200 transition-colors"
                        >
                            {/* Avatar */}
                            <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-green-700 font-bold text-sm">
                                    {emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900 truncate">{emp.name}</p>
                                    {!emp.is_active && (
                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">{emp.emp_code}</p>
                            </div>

                            {/* Salary */}
                            <div className="text-right flex-shrink-0">
                                <p className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(emp.monthly_salary)}
                                </p>
                                <p className="text-xs text-gray-400">per month</p>
                            </div>

                            {/* Arrow */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" className="text-gray-400 flex-shrink-0">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}