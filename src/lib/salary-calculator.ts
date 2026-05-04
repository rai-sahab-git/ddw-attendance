import type { AttendanceRecord, Employee } from '@/types'

export interface SalaryCalculation {
    employee: Employee
    month: number
    year: number
    totalWorkingDays: number
    presentDays: number
    absentDays: number
    halfDays: number
    extraDays: number   // 2P / 2OT days
    otAmount: number
    extraWorkAmount: number
    absentDeduction: number
    halfdayDeduction: number
    extraDayPay: number
    grossEarning: number
    advanceTotal: number
    payableAmount: number
    paidAmount: number
    balanceAmount: number
    overpaidAmount: number   // agar paid > payable
}

export function calculateSalary(
    employee: Employee,
    records: AttendanceRecord[],
    advanceTotal: number,
    otAmount: number,
    extraWorkAmount: number,
    paidAmount: number,
    totalWorkingDays: number = 26,
    month: number = 0,
    year: number = 0,
): SalaryCalculation {

    const perDay = employee.per_day_rate ?? (employee.monthly_salary / totalWorkingDays)

    let presentDays = 0
    let absentDays = 0
    let halfDays = 0
    let extraDays = 0  // 2P / 2OT bonus days

    records.forEach(r => {
        switch (r.status) {
            case 'P':
                presentDays += 1
                break
            case '2P':
                presentDays += 1
                extraDays += 1   // 1 bonus day
                break
            case 'OT':
                presentDays += 1   // present — OT amount alag milta hai
                break
            case '2OT':
                presentDays += 1
                extraDays += 1   // 1 bonus day
                break
            case 'A':
            case 'L':
                absentDays += 1
                break
            case 'H':
                halfDays += 1
                break
            case 'HD': break  // holiday — no deduction, no addition
            case 'WO': break  // week off — no deduction, no addition
        }
    })

    // ─── CORRECT FORMULA ───────────────────────────────────────────
    // Base = full monthly salary
    // Deduct absent days (full day) and half days (half day)
    // Add bonus for extra days (2P/2OT) — employee zyada kaam kiya
    // Add OT amount (manual entry from salary edit)
    // Add extra work amount (manual entry)
    //
    // NOTE: presentDays * perDay is NOT used directly because
    // monthly salary already assumes full attendance.
    // We only deduct for absences and add for extras.
    // ───────────────────────────────────────────────────────────────

    const absentDeduction = absentDays * perDay
    const halfdayDeduction = halfDays * (perDay / 2)
    const extraDayPay = extraDays * perDay   // bonus for 2P/2OT

    const grossEarning =
        employee.monthly_salary
        - absentDeduction
        - halfdayDeduction
        + extraDayPay
        + otAmount
        + extraWorkAmount

    // Gross can't be negative
    const safeGross = Math.max(0, grossEarning)

    // Payable = gross - advance
    const payableAmount = Math.max(0, safeGross - advanceTotal)

    // Balance / overpaid
    const diff = payableAmount - paidAmount
    const balanceAmount = Math.max(0, diff)   // still to pay
    const overpaidAmount = Math.max(0, -diff)   // paid more than payable

    return {
        employee,
        month,
        year,
        totalWorkingDays,
        presentDays,
        absentDays,
        halfDays,
        extraDays,
        otAmount,
        extraWorkAmount,
        absentDeduction,
        halfdayDeduction,
        extraDayPay,
        grossEarning: safeGross,
        advanceTotal,
        payableAmount,
        paidAmount,
        balanceAmount,
        overpaidAmount,
    }
}