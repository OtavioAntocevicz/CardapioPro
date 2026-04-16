import { applyThemeToDocument, useThemeStore } from '@/store/themeStore'
import { useEffect } from 'react'

export function useThemeSync() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    applyThemeToDocument(theme)
  }, [theme])
}
