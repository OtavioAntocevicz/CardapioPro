import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark' | 'system'

export function resolveIsDark(theme: ThemePreference): boolean {
  if (typeof window === 'undefined') return false
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyThemeToDocument(theme: ThemePreference) {
  document.documentElement.classList.toggle('dark', resolveIsDark(theme))
}

export const useThemeStore = create(
  persist<{
    theme: ThemePreference
    setTheme: (t: ThemePreference) => void
  }>(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => {
        set({ theme })
        applyThemeToDocument(theme)
      },
    }),
    {
      name: 'cardapiopro-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyThemeToDocument(state.theme)
      },
    },
  ),
)
