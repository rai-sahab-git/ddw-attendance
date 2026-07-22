import { redirect } from 'next/navigation'

/** Legacy route — redirects to the active monthly attendance grid */
export default async function MonthlyAttendanceRedirect({
    searchParams,
}: {
    searchParams: Promise<{ month?: string; year?: string }>
}) {
    const sp = await searchParams
    const qs = new URLSearchParams()
    if (sp.month) qs.set('month', sp.month)
    if (sp.year) qs.set('year', sp.year)
    const q = qs.toString()
    redirect(`/admin/attendance${q ? `?${q}` : ''}`)
}
