'use client'

import { useEffect, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/**
 * Prefetch all primary admin routes so tab switches feel instant.
 */
export function NavigationPrefetch({ routes }: { routes: string[] }) {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        routes.forEach(href => {
            if (href !== pathname) router.prefetch(href)
        })
    }, [routes, pathname, router])

    return null
}

export function useSoftNavigate() {
    const router = useRouter()
    const [pending, startTransition] = useTransition()

    function navigate(href: string) {
        startTransition(() => {
            router.push(href)
        })
    }

    return { navigate, pending }
}
