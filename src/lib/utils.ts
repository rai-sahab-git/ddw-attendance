import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { AttendanceStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const ATTENDANCE_COLORS: Record<AttendanceStatus, string> = {
    'P': 'bg-green-500 text-white',
    '2P': 'bg-blue-500 text-white',
    'A': 'bg-red-500 text-white',
    'H': 'bg-yellow-500 text-white',
    'OT': 'bg-orange-500 text-white',
    '2OT': 'bg-purple-500 text-white',
    'L': 'bg-pink-500 text-white',
    'HD': 'bg-gray-400 text-white',
    'WO': 'bg-gray-300 text-gray-700',
}

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
    'P': 'Present',
    '2P': 'Double Present',
    'A': 'Absent',
    'H': 'Half Day',
    'OT': 'Overtime',
    '2OT': 'Double OT',
    'L': 'Leave',
    'HD': 'Holiday',
    'WO': 'Week Off',
}

export function getMonthName(month: number): string {
    return new Date(2024, month - 1, 1).toLocaleString('default', { month: 'long' })
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount)
}

export function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}