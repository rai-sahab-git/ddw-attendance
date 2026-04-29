import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export type EmployeeSession = {
    id: string
    name: string
    emp_code: string
    monthly_salary: number
    per_day_rate: number
    is_active: boolean
    phone?: string
    joining_date?: string
    login_pin?: string
}

export async function getEmployeeSession(): Promise<EmployeeSession | null> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('emp_session')?.value
        if (!token) return null

        // ✅ Service role client — bypasses RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: session } = await supabase
            .from('employee_sessions')
            .select(`
        expires_at,
        employees (
          id, name, emp_code, monthly_salary,
          per_day_rate, is_active, phone, joining_date, login_pin
        )
      `)
            .eq('token', token)
            .gt('expires_at', new Date().toISOString())
            .single()

        if (!session?.employees) return null
        return session.employees as unknown as EmployeeSession
    } catch {
        return null
    }
}