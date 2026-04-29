import type { AttendanceRecord, Employee } from '@/types'

export interface SalaryCalculation {
    employee: Employee
    month: number
    year: number
    totalWorkingDays: number
    presentDays: number
    absentDays: number
    halfDays: number
    extraDays: number  // 2P days
    otAmount: number
    absentDeduction: number
    halfdayDeduction: number
    grossEarning: number
    advanceTotal: number
    payableAmount: number
    paidAmount: number
    balanceAmount: number
}

export function calculateSalary(
    employee: Employee,
    records: AttendanceRecord[],
    advanceTotal: number,
    otAmount: number,
    extraWorkAmount: number,
    paidAmount: number,
    totalWorkingDays: number = 26
): SalaryCalculation {
    const perDay = employee.per_day_rate

    let presentDays = 0
    let absentDays = 0
    let halfDays = 0
    let extraDays = 0 // double present

    records.forEach(r => {
        switch (r.status) {
            case 'P': presentDays += 1; break
            case '2P': presentDays += 1; extraDays += 1; break
            case 'OT': presentDays += 1; break
            case '2OT': presentDays += 1; extraDays += 1; break
            case 'A': absentDays += 1; break
            case 'H': halfDays += 1; break
            case 'L': absentDays += 1; break
            case 'HD': break // holiday — no deduction
            case 'WO': break // week off — no deduction
        }
    })

    const absentDeduction = absentDays * perDay
    const halfdayDeduction = halfDays * (perDay / 2)
    const extraDayPay = extraDays * perDay

    const grossEarning = (presentDays * perDay)
        + otAmount
        + extraWorkAmount
        + extraDayPay
        - absentDeduction
        - halfdayDeduction

    const payableAmount = Math.max(0, grossEarning - advanceTotal)
    const balanceAmount = payableAmount - paidAmount

    return {
        employee,
        month: 0,
        year: 0,
        totalWorkingDays,
        presentDays,
        absentDays,
        halfDays,
        extraDays,
        otAmount,
        absentDeduction,
        halfdayDeduction,
        grossEarning,
        advanceTotal,
        payableAmount,
        paidAmount,
        balanceAmount,
    }
}