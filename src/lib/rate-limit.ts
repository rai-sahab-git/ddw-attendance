/**
 * Simple in-memory rate limiter (per-process).
 * Suitable for single-instance deployments; for multi-instance use Redis/Upstash.
 */

type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()

export type RateLimitResult = {
    allowed: boolean
    remaining: number
    retryAfterSec: number
}

export function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number,
): RateLimitResult {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now >= entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs })
        return { allowed: true, remaining: limit - 1, retryAfterSec: Math.ceil(windowMs / 1000) }
    }

    if (entry.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
        }
    }

    entry.count += 1
    return {
        allowed: true,
        remaining: limit - entry.count,
        retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    }
}

/** Clear rate limit after successful auth */
export function resetRateLimit(key: string): void {
    store.delete(key)
}
