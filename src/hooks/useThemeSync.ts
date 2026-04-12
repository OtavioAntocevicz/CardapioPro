import { applyThemeToDocument, useThemeStore } from '@/store/themeStore'
import { useEffect } from 'react'

export function useThemeSync() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    applyThemeToDocument(theme)
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (useThemeStore.getState().theme === 'system') {
        applyThemeToDocument('system')
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
}
