export type AttendanceStatusOption = {
    code: string
    label: string
    color: string
    text_color: string
    calc_type?: string
    sort_order?: number
}

/** Fallback when settings haven't loaded / DB empty */
export const DEFAULT_ATTENDANCE_STATUSES: AttendanceStatusOption[] = [
    { code: 'P', label: 'Present', color: '#00A651', text_color: '#FFFFFF', calc_type: 'present', sort_order: 1 },
    { code: 'A', label: 'Absent', color: '#EF4444', text_color: '#FFFFFF', calc_type: 'absent', sort_order: 2 },
    { code: 'H', label: 'Half Day', color: '#F59E0B', text_color: '#FFFFFF', calc_type: 'half', sort_order: 3 },
    { code: 'L', label: 'Leave', color: '#EC4899', text_color: '#FFFFFF', calc_type: 'absent', sort_order: 4 },
    { code: 'OT', label: 'Overtime', color: '#F97316', text_color: '#FFFFFF', calc_type: 'ot_fixed', sort_order: 5 },
    { code: '2OT', label: 'Double OT', color: '#8B5CF6', text_color: '#FFFFFF', calc_type: 'ot_fixed', sort_order: 6 },
    { code: '2P', label: 'Double Present', color: '#3B82F6', text_color: '#FFFFFF', calc_type: 'per_day_multiply', sort_order: 8 },
    { code: 'HD', label: 'Holiday', color: '#9CA3AF', text_color: '#111827', calc_type: 'no_effect', sort_order: 9 },
    { code: 'WO', label: 'Week Off', color: '#E5E7EB', text_color: '#374151', calc_type: 'no_effect', sort_order: 10 },
]

export function buildStatusCycle(settings: AttendanceStatusOption[]): string[] {
    const codes = settings.map(s => s.code)
    return ['', ...codes]
}

export function buildStatusStyles(
    settings: AttendanceStatusOption[],
): Record<string, { bg: string; color: string; label: string }> {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
        '': { bg: 'transparent', color: 'var(--text-muted)', label: 'Empty' },
    }
    for (const s of settings) {
        styles[s.code] = {
            bg: s.color || '#6B7280',
            color: s.text_color || '#FFFFFF',
            label: s.label || s.code,
        }
    }
    return styles
}

export function normalizeSettings(
    rows: Partial<AttendanceStatusOption>[] | null | undefined,
): AttendanceStatusOption[] {
    if (!rows || rows.length === 0) return DEFAULT_ATTENDANCE_STATUSES
    return [...rows]
        .filter(r => r.code)
        .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))
        .map(r => ({
            code: String(r.code),
            label: r.label || String(r.code),
            color: r.color || '#6B7280',
            text_color: r.text_color || '#FFFFFF',
            calc_type: r.calc_type,
            sort_order: r.sort_order,
        }))
}
