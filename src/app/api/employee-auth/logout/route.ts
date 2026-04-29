import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST() {
    const cookieStore = await cookies()
    const token = cookieStore.get('emp_session')?.value

    if (token) {
        const supabase = await createClient()
        await supabase.from('employee_sessions').delete().eq('token', token)
        cookieStore.delete('emp_session')
    }

    return NextResponse.json({ success: true })
}