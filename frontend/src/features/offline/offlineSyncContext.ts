import { createContext, useContext } from 'react'

export type OfflineSyncContextValue = {
  isOnline: boolean
  pendingCount: number
  syncNow: () => Promise<void>
}

export const OfflineSyncContext = createContext<OfflineSyncContextValue>({
  isOnline: true,
  pendingCount: 0,
  syncNow: async () => undefined,
})

export function useOfflineSync() {
  return useContext(OfflineSyncContext)
}
