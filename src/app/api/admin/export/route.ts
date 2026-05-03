import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { calculateSalary } from '@/lib/salary-calculator'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

const STATUS_FULL: Record<string, string> = {
    P: 'Present', '2P': 'Double Present', A: 'Absent',
    H: 'Half Day', OT: 'OT', '2OT': 'Double OT',
    L: 'Leave', HD: 'Holiday', WO: 'Week Off',
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
        const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
        const type = searchParams.get('type') ?? 'salary'   // 'salary' | 'attendance'

        const [
            { data: employees },
            { data: attendance },
            { data: advances },
            { data: salaryRecords },
        ] = await Promise.all([
            supabase.from('employees').select('*').eq('is_active', true).order('emp_code'),
            supabase.from('attendance_records').select('*').eq('month', month).eq('year', year),
            supabase.from('advance_payments').select('*').eq('deduct_month', month).eq('deduct_year', year),
            supabase.from('monthly_salary').select('*').eq('month', month).eq('year', year),
        ])

        const wb = XLSX.utils.book_new()
        const monthLabel = `${MONTH_NAMES[month]} ${year}`

        // ─────────────────────────────────────────
        // SHEET 1 — Salary Sheet
        // ─────────────────────────────────────────
        const salaryRows: any[][] = []

        // Title rows
        salaryRows.push([`DDW SALARY SHEET — ${monthLabel}`])
        salaryRows.push([`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`])
        salaryRows.push([]) // blank

        // Header
        salaryRows.push([
            'S.No', 'Emp Code', 'Name',
            'Monthly Salary', 'Per Day Rate',
            'Present', 'Absent', 'Half Day', 'Double (2P/2OT)',
            'Absent Deduction', 'Halfday Deduction',
            'OT Amount', 'Extra Work',
            'Advance', 'Gross Earning',
            'Payable Amount', 'Paid Amount', 'Balance',
        ])

        let totalPayable = 0, totalPaid = 0, totalBalance = 0

        employees?.forEach((emp, i) => {
            const empAttendance = attendance?.filter(a => a.employee_id === emp.id) ?? []
            const empAdvance = advances?.filter(a => a.employee_id === emp.id).reduce((s, a) => s + a.amount, 0) ?? 0
            const savedRecord = salaryRecords?.find(s => s.employee_id === emp.id)

            const s = calculateSalary(
                emp,
                empAttendance as any,
                empAdvance,
                savedRecord?.ot_amount ?? 0,
                savedRecord?.extra_work_amount ?? 0,
                savedRecord?.paid_amount ?? 0,
            )

            totalPayable += s.payableAmount
            totalPaid += s.paidAmount
            totalBalance += s.balanceAmount

            salaryRows.push([
                i + 1,
                emp.emp_code,
                emp.name,
                emp.monthly_salary,
                emp.per_day_rate,
                s.presentDays,
                s.absentDays,
                s.halfDays,
                s.extraDays,
                s.absentDeduction,
                s.halfdayDeduction,
                s.otAmount,
                savedRecord?.extra_work_amount ?? 0,
                s.advanceTotal,
                s.grossEarning,
                s.payableAmount,
                s.paidAmount,
                s.balanceAmount,
            ])
        })

        // Totals row
        salaryRows.push([])
        salaryRows.push([
            '', '', 'TOTAL',
            '', '', '', '', '', '', '', '', '', '', '',
            '',
            totalPayable,
            totalPaid,
            totalBalance,
        ])

        const wsSalary = XLSX.utils.aoa_to_sheet(salaryRows)

        // Column widths
        wsSalary['!cols'] = [
            { wch: 5 }, { wch: 10 }, { wch: 20 },
            { wch: 14 }, { wch: 12 },
            { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 },
            { wch: 16 }, { wch: 16 },
            { wch: 10 }, { wch: 10 },
            { wch: 10 }, { wch: 14 },
            { wch: 14 }, { wch: 12 }, { wch: 10 },
        ]

        XLSX.utils.book_append_sheet(wb, wsSalary, 'Salary Sheet')

        // ─────────────────────────────────────────
        // SHEET 2 — Monthly Attendance Grid
        // ─────────────────────────────────────────
        const daysInMonth = new Date(year, month, 0).getDate()
        const attRows: any[][] = []

        attRows.push([`DDW ATTENDANCE — ${monthLabel}`])
        attRows.push([])

        // Header row: Name | Code | D1 | D2 ... | P | A | H | OT
        const attHeader = ['Name', 'Emp Code']
        for (let d = 1; d <= daysInMonth; d++) attHeader.push(String(d))
        attHeader.push('Present', 'Absent', 'Half Day', 'Extra(2P)')
        attRows.push(attHeader)

        employees?.forEach(emp => {
            const row: any[] = [emp.name, emp.emp_code]
            let P = 0, A = 0, H = 0, Ex = 0

            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const rec = attendance?.find(a => a.employee_id === emp.id && a.date === dateStr)
                const status = rec?.status ?? ''
                row.push(status)
                if (['P', 'OT'].includes(status)) P++
                else if (['2P', '2OT'].includes(status)) { P++; Ex++ }
                else if (['A', 'L'].includes(status)) A++
                else if (status === 'H') H++
            }

            row.push(P, A, H, Ex)
            attRows.push(row)
        })

        const wsAtt = XLSX.utils.aoa_to_sheet(attRows)
        wsAtt['!cols'] = [
            { wch: 20 }, { wch: 10 },
            ...Array(daysInMonth).fill({ wch: 4 }),
            { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
        ]
        XLSX.utils.book_append_sheet(wb, wsAtt, 'Attendance Grid')

        // ─────────────────────────────────────────
        // SHEET 3 — Advance Summary
        // ─────────────────────────────────────────
        const { data: allAdvances } = await supabase
            .from('advance_payments')
            .select(`*, employees(name, emp_code)`)
            .order('date', { ascending: false })

        const advRows: any[][] = []
        advRows.push(['DDW ADVANCE RECORDS'])
        advRows.push([])
        advRows.push(['Date', 'Emp Code', 'Name', 'Amount', 'Description', 'Deduct Month', 'Deduct Year', 'Status'])

        allAdvances?.forEach((a: any) => {
            advRows.push([
                a.date,
                a.employees?.emp_code ?? '',
                a.employees?.name ?? '',
                a.amount,
                a.description ?? '',
                a.deduct_month ? MONTH_NAMES[a.deduct_month] : 'Not set',
                a.deduct_year ?? '',
                a.is_deducted ? 'Deducted' : 'Pending',
            ])
        })

        const wsAdv = XLSX.utils.aoa_to_sheet(advRows)
        wsAdv['!cols'] = [
            { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 10 },
            { wch: 22 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
        ]
        XLSX.utils.book_append_sheet(wb, wsAdv, 'Advances')

        // ─────────────────────────────────────────
        // Generate buffer & return
        // ─────────────────────────────────────────
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        const filename = `DDW_${monthLabel.replace(' ', '_')}.xlsx`

        return new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': String(buf.length),
            },
        })
    } catch (err) {
        console.error('Excel export error:', err)
        return NextResponse.json({ error: 'Export failed' }, { status: 500 })
    }
}