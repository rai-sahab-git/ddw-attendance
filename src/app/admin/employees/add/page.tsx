import { redirect } from 'next/navigation'

/** Legacy route — use /admin/employees/new */
export default function AddEmployeeRedirect() {
    redirect('/admin/employees/new')
}
