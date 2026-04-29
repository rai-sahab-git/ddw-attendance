import { NextResponse } from 'next/server'
import { getEmployeeSession } from '@/lib/employee-auth'

export async function GET() {
    const emp = await getEmployeeSession()
    if (!emp) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    return NextResponse.json(emp)
}