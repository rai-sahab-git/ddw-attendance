'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

export default function AddEmployeePage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        emp_code: '',
        name: '',
        phone: '',
        monthly_salary: '',
        per_day_rate: '',
        pin: '',
        joining_date: new Date().toISOString().split('T')[0],
    })

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target
        setForm(prev => {
            const updated = { ...prev, [name]: value }
            // Auto calculate per_day_rate from monthly_salary
            if (name === 'monthly_salary' && value) {
                updated.per_day_rate = (parseFloat(value) / 26).toFixed(2)
            }
            return updated
        })
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (form.pin.length !== 4) {
            setError('PIN must be exactly 4 digits')
            setLoading(false)
            return
        }

        // Insert employee
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .insert({
                emp_code: form.emp_code.toUpperCase(),
                name: form.name,
                phone: form.phone || null,
                monthly_salary: parseFloat(form.monthly_salary),
                per_day_rate: parseFloat(form.per_day_rate),
                pin: form.pin,
                joining_date: form.joining_date,
            })
            .select()
            .single()

        if (empError) {
            setError(empError.message.includes('unique')
                ? 'Employee ID already exists'
                : empError.message)
            setLoading(false)
            return
        }

        // Create Supabase auth user for employee
        // Email format: empcode@ddwattendance.com
        const empEmail = `${form.emp_code.toLowerCase()}@ddwattendance.com`

        const { data: authUser, error: authError } = await supabase.auth.admin
            ? // Try service role if available
            { data: null, error: { message: 'use_client' } }
            : { data: null, error: { message: 'use_client' } }

        // Create user_profile linking employee
        // Note: Auth user creation handled via API route
        const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
                id: crypto.randomUUID(), // temp, will be replaced
                employee_id: employee.id,
                role: 'employee',
                name: form.name,
                email: empEmail,
            })

        router.push('/admin/employees')
        router.refresh()
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Add Employee</h1>
                    <p className="text-sm text-gray-500">Create new employee account</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-700">Basic Info</h2>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Employee ID *
                            </label>
                            <input
                                name="emp_code"
                                value={form.emp_code}
                                onChange={handleChange}
                                placeholder="EMP014"
                                required
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 uppercase"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                4-Digit PIN *
                            </label>
                            <input
                                name="pin"
                                value={form.pin}
                                onChange={e => setForm(prev => ({
                                    ...prev,
                                    pin: e.target.value.replace(/\D/g, '').slice(0, 4)
                                }))}
                                placeholder="1234"
                                maxLength={4}
                                inputMode="numeric"
                                required
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Full Name *
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Farhan Ahmed"
                            required
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Phone Number
                        </label>
                        <input
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="9876543210"
                            inputMode="numeric"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Joining Date
                        </label>
                        <input
                            name="joining_date"
                            type="date"
                            value={form.joining_date}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-700">Salary Details</h2>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Monthly Salary (₹) *
                        </label>
                        <input
                            name="monthly_salary"
                            value={form.monthly_salary}
                            onChange={handleChange}
                            placeholder="15000"
                            inputMode="numeric"
                            required
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Per Day Rate (₹)
                            <span className="text-gray-400 font-normal ml-1">— auto calculated</span>
                        </label>
                        <input
                            name="per_day_rate"
                            value={form.per_day_rate}
                            onChange={handleChange}
                            placeholder="576.92"
                            inputMode="decimal"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Based on 26 working days/month
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60 text-sm"
                >
                    {loading ? 'Adding Employee...' : 'Add Employee'}
                </button>
            </form>
        </div>
    )
}
