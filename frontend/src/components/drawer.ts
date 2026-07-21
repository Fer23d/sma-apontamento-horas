export function shouldCloseDrawerForKey(key: string) {
  return key === 'Escape'
}

export function focusDrawerInitialElement(root: ParentNode = document) {
  const initialFocus = root.querySelector<HTMLElement>('[data-drawer-initial-focus]')
  if (!initialFocus) return false
  initialFocus.focus()
  return true
}
