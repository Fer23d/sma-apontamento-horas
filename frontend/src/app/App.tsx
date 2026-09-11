import { HashRouter } from 'react-router-dom'
import { AppRoutes } from './AppRoutes'
import { OnboardingTour } from '../components/OnboardingTour'
import { OfflineSyncProvider } from '../features/offline/useOfflineSync'

export function App() {
  return (
    <HashRouter>
      <OfflineSyncProvider>
        <OnboardingTour>
          <AppRoutes />
        </OnboardingTour>
      </OfflineSyncProvider>
    </HashRouter>
  )
}
