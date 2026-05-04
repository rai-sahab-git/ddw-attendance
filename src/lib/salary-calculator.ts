import type { Employee } from '@/types'

export interface AttendanceTypeSetting {
    code: string
    calc_type: string   // present | absent | half | ot_fixed | per_day_multiply | no_effect
    fixed_amount: number
    multiplier: number
}

export interface EmployeeOverride {
    type_code: string
    override_amount: number | null
    override_multiplier: number | null
}

export interface SalaryCalculation {
    employee: Employee
    month: number
    year: number
    totalWorkingDays: number
    perDay: number
    presentDays: number
    absentDays: number
    halfDays: number
    // Per-type breakdown
    typeBreakdown: { code: string; label: string; count: number; amount: number }[]
    absentDeduction: number
    halfdayDeduction: number
    bonusTotal: number   // OT + 2P + all extras
    grossEarning: number
    advanceTotal: number
    otherDeductions: number
    payableAmount: number
    paidAmount: number
    balanceAmount: number
    overpaidAmount: number
}

export function calculateSalaryV2(
    employee: Employee,
    records: { status: string }[],
    settings: AttendanceTypeSetting[],
    overrides: EmployeeOverride[],
    advanceTotal: number,
    otherDeductions: number,
    paidAmount: number,
    month = 0,
    year = 0,
): SalaryCalculation {
    const WORKING_DAYS = 26
    const perDay = employee.monthly_salary / WORKING_DAYS

    // Helper — get effective rate for this employee
    function getEffectiveAmount(code: string, setting: AttendanceTypeSetting): number {
        const ov = overrides.find(o => o.type_code === code)
        if (ov?.override_amount != null) return ov.override_amount
        return setting.fixed_amount
    }

    function getEffectiveMultiplier(code: string, setting: AttendanceTypeSetting): number {
        const ov = overrides.find(o => o.type_code === code)
        if (ov?.override_multiplier != null) return ov.override_multiplier
        return setting.multiplier
    }

    // Count each status code
    const countMap: Record<string, number> = {}
    records.forEach(r => {
        countMap[r.status] = (countMap[r.status] ?? 0) + 1
    })

    let presentDays = 0
    let absentDays = 0
    let halfDays = 0
    let absentDeduction = 0
    let halfdayDeduction = 0
    let bonusTotal = 0
    const typeBreakdown: SalaryCalculation['typeBreakdown'] = []

    Object.entries(countMap).forEach(([code, count]) => {
        const setting = settings.find(s => s.code === code)
        if (!setting) return  // unknown code — skip

        let amount = 0

        switch (setting.calc_type) {
            case 'present':
                // Normal present — no change to salary
                presentDays += count
                amount = 0
                break

            case 'absent':
                // Deduct perDay per occurrence
                absentDays += count
                absentDeduction += count * perDay
                amount = -(count * perDay)
                break

            case 'half':
                // Deduct half perDay
                halfDays += count
                halfdayDeduction += count * (perDay / 2)
                amount = -(count * (perDay / 2))
                break

            case 'ot_fixed': {
                // Add flat fixed_amount per occurrence (employee override respected)
                const rate = getEffectiveAmount(code, setting)
                const bonus = count * rate
                bonusTotal += bonus
                presentDays += count  // OT day = present
                amount = bonus
                break
            }

            case 'per_day_multiply': {
                // e.g. 2P → employee worked extra, bonus = (multiplier - 1) * perDay
                // multiplier=2 means: full day pay + 1 bonus day = perDay extra
                const mult = getEffectiveMultiplier(code, setting)
                const bonus = count * (mult - 1) * perDay
                bonusTotal += bonus
                presentDays += count
                amount = bonus
                break
            }

            case 'no_effect':
            default:
                // WO, HD — no change
                break
        }

        if (count > 0) {
            typeBreakdown.push({
                code,
                label: setting.code,
                count,
                amount,
            })
        }
    })

    const grossEarning = Math.max(
        0,
        employee.monthly_salary
        - absentDeduction
        - halfdayDeduction
        + bonusTotal
    )

    const payableAmount = Math.max(0, grossEarning - advanceTotal - otherDeductions)
    const diff = payableAmount - paidAmount
    const balanceAmount = Math.max(0, diff)
    const overpaidAmount = Math.max(0, -diff)

    return {
        employee,
        month, year,
        totalWorkingDays: WORKING_DAYS,
        perDay,
        presentDays,
        absentDays,
        halfDays,
        typeBreakdown,
        absentDeduction,
        halfdayDeduction,
        bonusTotal,
        grossEarning,
        advanceTotal,
        otherDeductions,
        payableAmount,
        paidAmount,
        balanceAmount,
        overpaidAmount,
    }
}

// ── Backward-compatible fields on SalaryCalculation ──
// Purani pages otAmount, extraDays use karti hain
declare module '@/lib/salary-calculator' { }

// ── Backward-compatible wrapper ──
// Old call: calculateSalary(emp, records, advance, otAmt, extraAmt, paidAmt)
export function calculateSalary(
    employee: Employee,
    records: { status: string }[],
    advanceTotal: number,
    _otAmount = 0,
    _extraWork = 0,
    paidAmount = 0,
    month = 0,
    year = 0,
): SalaryCalculation & { otAmount: number; extraDays: number } {
    const result = calculateSalaryV2(
        employee, records, [], [], advanceTotal, 0, paidAmount, month, year
    )
    return {
        ...result,
        // bonusTotal = OT+extras combined — map to old field names
        otAmount: result.bonusTotal,
        extraDays: result.typeBreakdown.filter(t => t.amount > 0).reduce((s, t) => s + t.count, 0),
    }
}