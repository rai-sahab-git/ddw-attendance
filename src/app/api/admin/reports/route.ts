import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requirePermission } from '@/lib/api-auth'
import { calculateSalary } from '@/lib/salary-calculator'

const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

export async function GET(request: NextRequest) {
    const result = await requirePermission('reports:export')
    if ('error' in result) return result.error

    try {
        const sp = request.nextUrl.searchParams
        const type = sp.get('type') ?? 'salary' // salary | attendance | advances | full
        const month = parseInt(sp.get('month') ?? String(new Date().getMonth() + 1))
        const year = parseInt(sp.get('year') ?? String(new Date().getFullYear()))
        const warehouseId = sp.get('warehouse_id')

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        let empQuery = supabase.from('employees').select('*').eq('is_active', true).order('emp_code')
        if (warehouseId) empQuery = empQuery.eq('warehouse_id', warehouseId)

        const [
            { data: employees },
            { data: attendance },
            { data: advances },
            { data: salaryRecords },
            { data: settings },
            { data: allOverrides },
            { data: allAdvances },
        ] = await Promise.all([
            empQuery,
            supabase.from('attendance_records').select('*').eq('month', month).eq('year', year),
            supabase.from('advance_payments').select('*').eq('deduct_month', month).eq('deduct_year', year),
            supabase.from('monthly_salary').select('*').eq('month', month).eq('year', year),
            supabase.from('attendance_settings').select('*').eq('is_active', true),
            supabase.from('employee_type_overrides').select('*'),
            supabase.from('advance_payments').select('*, employees(name, emp_code)').order('date', { ascending: false }),
        ])

        const empIds = new Set((employees ?? []).map(e => e.id))
        const attFiltered = (attendance ?? []).filter(a => empIds.has(a.employee_id))
        const advFiltered = (advances ?? []).filter(a => empIds.has(a.employee_id))

        const settingsList = (settings ?? []).map(s => ({
            code: s.code,
            calc_type: s.calc_type,
            fixed_amount: s.fixed_amount ?? 0,
            multiplier: s.multiplier ?? 1,
        }))

        const XLSX = await import('xlsx')
        const wb = XLSX.utils.book_new()
        const monthLabel = `${MONTH_NAMES[month]} ${year}`
        const daysInMonth = new Date(year, month, 0).getDate()

        if (type === 'salary' || type === 'full') {
            const salaryRows: (string | number)[][] = [
                [`DDW SALARY — ${monthLabel}`],
                [`Generated: ${new Date().toLocaleString('en-IN')}`],
                [],
                [
                    'S.No', 'Emp Code', 'Name', 'Monthly Salary', 'Per Day',
                    'Present', 'Absent', 'Half', 'Bonus Days',
                    'Absent Deduction', 'Half Deduction', 'OT/Bonus', 'Advance',
                    'Gross', 'Payable', 'Paid', 'Balance',
                ],
            ]
            employees?.forEach((emp, i) => {
                const empAtt = attFiltered.filter(a => a.employee_id === emp.id)
                const empAdv = advFiltered.filter(a => a.employee_id === emp.id).reduce((s, a) => s + a.amount, 0)
                const saved = salaryRecords?.find(s => s.employee_id === emp.id)
                const overrides = (allOverrides ?? [])
                    .filter(o => o.employee_id === emp.id)
                    .map(o => ({
                        type_code: o.type_code,
                        override_amount: o.override_amount,
                        override_multiplier: o.override_multiplier,
                    }))
                const s = calculateSalary(
                    emp, empAtt, empAdv, settingsList, overrides,
                    saved?.paid_amount ?? 0, month, year, saved?.other_deductions ?? 0,
                )
                salaryRows.push([
                    i + 1, emp.emp_code, emp.name, emp.monthly_salary, Math.round(s.perDay * 100) / 100,
                    s.presentDays, s.absentDays, s.halfDays, s.extraDays,
                    Math.round(s.absentDeduction), Math.round(s.halfdayDeduction),
                    Math.round(s.otAmount), s.advanceTotal,
                    Math.round(s.grossEarning), Math.round(s.payableAmount),
                    s.paidAmount, Math.round(s.balanceAmount),
                ])
            })
            const ws = XLSX.utils.aoa_to_sheet(salaryRows)
            XLSX.utils.book_append_sheet(wb, ws, 'Salary')
        }

        if (type === 'attendance' || type === 'full') {
            const attRows: (string | number)[][] = [[`DDW ATTENDANCE — ${monthLabel}`], []]
            const header: (string | number)[] = ['Name', 'Emp Code']
            for (let d = 1; d <= daysInMonth; d++) header.push(String(d))
            header.push('Present', 'Absent', 'Half', 'Extra')
            attRows.push(header)

            employees?.forEach(emp => {
                const row: (string | number)[] = [emp.name, emp.emp_code]
                let P = 0, A = 0, H = 0, Ex = 0
                for (let d = 1; d <= daysInMonth; d++) {
                    const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                    const rec = attFiltered.find(a => a.employee_id === emp.id && a.date === ds)
                    const st = rec?.status ?? ''
                    row.push(st)
                    if (['P', 'OT'].includes(st)) P++
                    else if (['2P', '2OT'].includes(st)) { P++; Ex++ }
                    else if (['A', 'L'].includes(st)) A++
                    else if (st === 'H') H++
                }
                row.push(P, A, H, Ex)
                attRows.push(row)
            })
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(attRows), 'Attendance')
        }

        if (type === 'amounts' || type === 'full') {
            const amtRows: (string | number)[][] = [
                [`DDW DAY AMOUNTS — ${monthLabel}`],
                ['Positive = earning / bonus · Negative = deduction'],
                [],
            ]
            const header: (string | number)[] = ['Name', 'Emp Code', 'Per Day']
            for (let d = 1; d <= daysInMonth; d++) header.push(String(d))
            header.push('Month Total')
            amtRows.push(header)

            const settingByCode = new Map((settings ?? []).map(s => [s.code, s]))

            employees?.forEach(emp => {
                const perDay = (emp.monthly_salary || 0) / 26
                const overrides = (allOverrides ?? []).filter(o => o.employee_id === emp.id)
                const row: (string | number)[] = [emp.name, emp.emp_code, Math.round(perDay * 100) / 100]
                let monthTotal = 0

                for (let d = 1; d <= daysInMonth; d++) {
                    const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                    const rec = attFiltered.find(a => a.employee_id === emp.id && a.date === ds)
                    const code = rec?.status ?? ''
                    let dayAmt = 0
                    if (code) {
                        const setting = settingByCode.get(code)
                        const ov = overrides.find(o => o.type_code === code)
                        if (setting) {
                            const fixed = ov?.override_amount ?? setting.fixed_amount ?? 0
                            const mult = ov?.override_multiplier ?? setting.multiplier ?? 1
                            switch (setting.calc_type) {
                                case 'present':
                                    dayAmt = perDay
                                    break
                                case 'absent':
                                    dayAmt = -perDay
                                    break
                                case 'half':
                                    dayAmt = -(perDay / 2)
                                    break
                                case 'ot_fixed':
                                    dayAmt = perDay + Number(fixed)
                                    break
                                case 'per_day_multiply':
                                    dayAmt = perDay * Number(mult)
                                    break
                                case 'no_effect':
                                    dayAmt = 0
                                    break
                                default:
                                    dayAmt = 0
                            }
                        }
                    }
                    dayAmt = Math.round(dayAmt * 100) / 100
                    monthTotal += dayAmt
                    row.push(code ? dayAmt : '')
                }
                row.push(Math.round(monthTotal * 100) / 100)
                amtRows.push(row)
            })
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(amtRows), 'Day Amounts')
        }

        if (type === 'advances' || type === 'full') {
            const advRows: (string | number)[][] = [
                ['DDW ADVANCES'],
                [],
                ['Date', 'Emp Code', 'Name', 'Amount', 'Description', 'Deduct Month', 'Year', 'Status'],
            ]
            type Adv = {
                date: string; amount: number; description?: string | null
                deduct_month?: number | null; deduct_year?: number | null; is_deducted?: boolean
                employees?: { name?: string; emp_code?: string } | null
                employee_id?: string
            }
            ;(allAdvances as Adv[] | null)?.forEach(a => {
                if (a.employee_id && !empIds.has(a.employee_id)) return
                advRows.push([
                    a.date, a.employees?.emp_code ?? '', a.employees?.name ?? '',
                    a.amount, a.description ?? '',
                    a.deduct_month ? MONTH_NAMES[a.deduct_month] : 'Not set',
                    a.deduct_year ?? '',
                    a.is_deducted ? 'Deducted' : 'Pending',
                ])
            })
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(advRows), 'Advances')
        }

        if (type === 'settings' || type === 'full') {
            const setRows: (string | number)[][] = [
                ['ATTENDANCE TYPES'],
                [],
                ['Code', 'Label', 'Calc Type', 'Fixed Amount', 'Multiplier', 'Active'],
            ]
            ;(settings ?? []).forEach(s => {
                setRows.push([
                    s.code, s.label, s.calc_type,
                    s.fixed_amount ?? 0, s.multiplier ?? 1,
                    s.is_active ? 'Yes' : 'No',
                ])
            })
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(setRows), 'Attendance Types')
        }

        const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
        const buf = Buffer.from(base64, 'base64')
        const filename = `DDW_${type}_${monthLabel.replace(' ', '_')}.xlsx`

        return new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': String(buf.length),
            },
        })
    } catch (err) {
        console.error('Report export error:', err)
        return NextResponse.json({ error: 'Export failed: ' + String(err) }, { status: 500 })
    }
}
