'use client'

import {
    createContext, useCallback, useContext, useEffect, useState,
    type ReactNode,
} from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

type ThemeContextValue = {
    theme: ThemeMode
    resolved: 'light' | 'dark'
    setTheme: (t: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'ddw-theme'

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
    if (theme === 'system') {
        if (typeof window === 'undefined') return 'light'
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
}

function applyDom(resolved: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', resolved)
    document.documentElement.style.colorScheme = resolved
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>('system')
    const [resolved, setResolved] = useState<'light' | 'dark'>('light')

    useEffect(() => {
        const stored = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'system'
        setThemeState(stored)
        const r = resolveTheme(stored)
        setResolved(r)
        applyDom(r)
    }, [])

    useEffect(() => {
        if (theme !== 'system') return
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const onChange = () => {
            const r = resolveTheme('system')
            setResolved(r)
            applyDom(r)
        }
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
    }, [theme])

    const setTheme = useCallback((t: ThemeMode) => {
        setThemeState(t)
        localStorage.setItem(STORAGE_KEY, t)
        const r = resolveTheme(t)
        setResolved(r)
        applyDom(r)
        // Persist for logged-in admins (best-effort)
        fetch('/api/admin/preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme: t }),
        }).catch(() => {})
    }, [])

    return (
        <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
    return ctx
}
