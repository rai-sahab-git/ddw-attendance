import { describe, it, expect } from 'vitest'
import { calculateSalaryV2, calculateSalary } from './salary-calculator'
import type { Employee } from '@/types'

const emp: Employee = {
    id: '1',
    emp_code: 'DDW001',
    name: 'Test',
    monthly_salary: 26000,
    per_day_rate: 1000,
    joining_date: '2024-01-01',
    is_active: true,
}

const settings = [
    { code: 'P', calc_type: 'present', fixed_amount: 0, multiplier: 1 },
    { code: 'A', calc_type: 'absent', fixed_amount: 0, multiplier: 1 },
    { code: 'H', calc_type: 'half', fixed_amount: 0, multiplier: 0.5 },
    { code: 'OT', calc_type: 'ot_fixed', fixed_amount: 300, multiplier: 1 },
    { code: '2P', calc_type: 'per_day_multiply', fixed_amount: 0, multiplier: 2 },
    { code: 'WO', calc_type: 'no_effect', fixed_amount: 0, multiplier: 1 },
]

describe('calculateSalaryV2', () => {
    it('deducts per-day for absents', () => {
        const result = calculateSalaryV2(
            emp,
            [{ status: 'P' }, { status: 'P' }, { status: 'A' }, { status: 'A' }],
            settings,
            [],
            0, 0, 0, 1, 2026,
        )
        expect(result.perDay).toBe(1000)
        expect(result.absentDays).toBe(2)
        expect(result.absentDeduction).toBe(2000)
        expect(result.grossEarning).toBe(24000)
        expect(result.payableAmount).toBe(24000)
    })

    it('adds OT fixed bonus and counts OT as present', () => {
        const result = calculateSalaryV2(
            emp,
            [{ status: 'OT' }, { status: 'OT' }],
            settings,
            [],
            0, 0, 0,
        )
        expect(result.bonusTotal).toBe(600)
        expect(result.presentDays).toBe(2)
        expect(result.grossEarning).toBe(26600)
    })

    it('respects employee OT override', () => {
        const result = calculateSalaryV2(
            emp,
            [{ status: 'OT' }],
            settings,
            [{ type_code: 'OT', override_amount: 500, override_multiplier: null }],
            0, 0, 0,
        )
        expect(result.bonusTotal).toBe(500)
    })

    it('applies 2P as extra per-day bonus', () => {
        const result = calculateSalaryV2(
            emp,
            [{ status: '2P' }],
            settings,
            [],
            0, 0, 0,
        )
        // multiplier 2 → (2-1)*perDay = 1000 bonus
        expect(result.bonusTotal).toBe(1000)
        expect(result.presentDays).toBe(1)
    })

    it('subtracts advances and tracks balance', () => {
        const result = calculateSalaryV2(
            emp,
            [{ status: 'P' }],
            settings,
            [],
            5000, 0, 10000,
        )
        expect(result.payableAmount).toBe(21000)
        expect(result.paidAmount).toBe(10000)
        expect(result.balanceAmount).toBe(11000)
    })

    it('skips unknown status codes without crashing', () => {
        const result = calculateSalaryV2(
            emp,
            [{ status: 'XYZ' }],
            settings,
            [],
            0, 0, 0,
        )
        expect(result.grossEarning).toBe(26000)
        expect(result.absentDays).toBe(0)
    })
})

describe('calculateSalary (legacy wrapper)', () => {
    it('requires settings and maps otAmount', () => {
        const result = calculateSalary(
            emp,
            [{ status: 'A' }, { status: 'OT' }],
            0,
            settings,
            [],
            0,
        )
        expect(result.absentDeduction).toBe(1000)
        expect(result.otAmount).toBe(300)
        expect(result.extraDays).toBe(1)
    })
})
