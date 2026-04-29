export type UserRole = 'admin' | 'employee'

export type AttendanceStatus =
    | 'P'   // Present
    | '2P'  // Double Present
    | 'A'   // Absent
    | 'H'   // Half Day
    | 'OT'  // Overtime
    | '2OT' // Double OT
    | 'L'   // Leave
    | 'HD'  // Holiday
    | 'WO'  // Week Off

export interface Employee {
    id: string
    emp_code: string
    name: string
    phone?: string
    monthly_salary: number
    per_day_rate: number
    pin?: string   // ✅ optional — renamed to login_pin in DB
    login_pin?: string   // ✅ actual DB column name
    joining_date: string
    is_active: boolean
}

export interface UserProfile {
    id: string
    employee_id?: string
    role: UserRole
    name?: string
    email?: string
    is_active: boolean
}

export interface AttendanceRecord {
    id: string
    employee_id: string
    date: string
    month: number
    year: number
    status: AttendanceStatus
    ot_hours?: number
    notes?: string
}

export interface MonthlySalary {
    id: string
    employee_id: string
    month: number
    year: number
    total_working_days: number
    present_days: number
    absent_days: number
    half_days: number
    extra_days: number
    base_salary: number
    per_day_rate: number
    absent_deduction: number
    halfday_deduction: number
    ot_amount: number
    extra_work_amount: number
    advance_total: number
    other_deductions: number
    payable_amount: number
    paid_amount: number
    balance_amount: number
    is_finalized: boolean
}

export interface AdvancePayment {
    id: string
    employee_id: string
    date: string
    amount: number
    description?: string
    deduct_month?: number
    deduct_year?: number
    is_deducted: boolean
}

export interface AttendanceRequest {
    id: string
    employee_id: string
    request_type: 'leave' | 'half_day' | 'ot_claim' | 'correction'
    date_from: string
    date_to?: string
    requested_status?: AttendanceStatus
    ot_hours?: number
    reason?: string
    status: 'pending' | 'approved' | 'rejected'
    review_note?: string
    reviewed_at?: string
}