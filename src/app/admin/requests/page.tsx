import { createClient } from '@/lib/supabase/server'
import RequestsClient from './RequestsClient'

export default async function RequestsPage() {
    const supabase = await createClient()

    const { data: requests } = await supabase
        .from('attendance_requests')
        .select(`
      *,
      employees (
        id,
        name,
        emp_code
      )
    `)
        .order('created_at', { ascending: false })

    const pending = requests?.filter(r => r.status === 'pending').length ?? 0
    const approved = requests?.filter(r => r.status === 'approved').length ?? 0
    const rejected = requests?.filter(r => r.status === 'rejected').length ?? 0

    return (
        <RequestsClient
            requests={requests ?? []}
            counts={{ pending, approved, rejected }}
        />
    )
}