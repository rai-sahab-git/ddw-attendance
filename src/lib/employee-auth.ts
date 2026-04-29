import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function getEmployeeSession() {
    const cookieStore = await cookies()
    const token = cookieStore.get('emp_session')?.value
    if (!token) return null

    const supabase = await createClient()

    const { data: session } = await supabase
        .from('employee_sessions')
        .select(`
      employee_id,
      expires_at,
      employees ( id, name, emp_code, monthly_salary, per_day_rate, is_active )
    `)
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single()

    if (!session) return null
    return session.employees as any
}