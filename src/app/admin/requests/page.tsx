import { createClient } from '@/lib/supabase/server'
import RequestsClient from './client'

export default async function RequestsPage() {
    const supabase = await createClient()

    const { data: requests } = await supabase
        .from('attendance_requests')
        .select(`
      *,
      employees ( id, name, emp_code )
    `)
        .order('created_at', { ascending: false })

    return <RequestsClient initialRequests={requests ?? []} />
}