/** App roles (profile-level) */
export type AppRole = 'super_admin' | 'admin' | 'manager' | 'viewer' | 'employee'

/** Role within a warehouse */
export type WarehouseRole = 'owner' | 'admin' | 'manager' | 'viewer'

export type Permission =
    | 'dashboard:view'
    | 'attendance:view'
    | 'attendance:edit'
    | 'salary:view'
    | 'salary:edit'
    | 'employees:view'
    | 'employees:edit'
    | 'requests:view'
    | 'requests:review'
    | 'settings:view'
    | 'settings:edit'
    | 'reports:export'
    | 'org:manage'
    | 'users:manage'

const ROLE_PERMS: Record<AppRole | WarehouseRole, Permission[]> = {
    super_admin: [
        'dashboard:view', 'attendance:view', 'attendance:edit',
        'salary:view', 'salary:edit', 'employees:view', 'employees:edit',
        'requests:view', 'requests:review', 'settings:view', 'settings:edit',
        'reports:export', 'org:manage', 'users:manage',
    ],
    owner: [
        'dashboard:view', 'attendance:view', 'attendance:edit',
        'salary:view', 'salary:edit', 'employees:view', 'employees:edit',
        'requests:view', 'requests:review', 'settings:view', 'settings:edit',
        'reports:export', 'org:manage', 'users:manage',
    ],
    admin: [
        'dashboard:view', 'attendance:view', 'attendance:edit',
        'salary:view', 'salary:edit', 'employees:view', 'employees:edit',
        'requests:view', 'requests:review', 'settings:view', 'settings:edit',
        'reports:export', 'users:manage',
    ],
    manager: [
        'dashboard:view', 'attendance:view', 'attendance:edit',
        'salary:view', 'employees:view',
        'requests:view', 'requests:review', 'reports:export',
    ],
    viewer: [
        'dashboard:view', 'attendance:view', 'salary:view',
        'employees:view', 'requests:view', 'reports:export',
    ],
    employee: [],
}

export function permissionsFor(role: string | null | undefined): Permission[] {
    if (!role) return ROLE_PERMS.admin
    if (role === 'super_admin') return ROLE_PERMS.super_admin
    return ROLE_PERMS[role as AppRole | WarehouseRole] ?? ROLE_PERMS.viewer
}

export function can(role: string | null | undefined, permission: Permission): boolean {
    return permissionsFor(role).includes(permission)
}

export function canAny(role: string | null | undefined, perms: Permission[]): boolean {
    return perms.some(p => can(role, p))
}
