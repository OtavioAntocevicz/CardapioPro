import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark'

export function applyThemeToDocument(theme: ThemePreference) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useThemeStore = create(
  persist<{
    theme: ThemePreference
    setTheme: (t: ThemePreference) => void
  }>(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme })
        applyThemeToDocument(theme)
      },
    }),
    {
      name: 'cardapiopro-theme',
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const raw = state.theme as string
        if (raw === 'system') {
          const prefersDark =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
          const next: ThemePreference = prefersDark ? 'dark' : 'light'
          useThemeStore.setState({ theme: next })
          applyThemeToDocument(next)
        } else {
          applyThemeToDocument(state.theme)
        }
      },
    },
  ),
)
