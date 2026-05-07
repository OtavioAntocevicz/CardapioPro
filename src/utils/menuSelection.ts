const KEY = 'cardapiopro.selected_menu_id'

export function getSelectedMenuId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(KEY)
}

export function setSelectedMenuId(menuId: string | null): void {
  if (typeof window === 'undefined') return
  if (!menuId) {
    window.localStorage.removeItem(KEY)
    return
  }
  window.localStorage.setItem(KEY, menuId)
}
