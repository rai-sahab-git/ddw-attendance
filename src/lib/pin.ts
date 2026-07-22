import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

/** True if value looks like a bcrypt hash */
export function isPinHashed(value: string | null | undefined): boolean {
    if (!value) return false
    return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$')
}

export async function hashPin(pin: string): Promise<string> {
    return bcrypt.hash(String(pin).trim(), SALT_ROUNDS)
}

/**
 * Verify PIN against stored value.
 * Supports legacy plaintext PINs (migrates transparently on next successful login if rehash callback used).
 */
export async function verifyPin(
    pin: string,
    stored: string | null | undefined,
): Promise<boolean> {
    if (!stored) return false
    const trimmed = String(pin).trim()
    if (isPinHashed(stored)) {
        return bcrypt.compare(trimmed, stored)
    }
    // Legacy plaintext comparison
    return String(stored).trim() === trimmed
}
