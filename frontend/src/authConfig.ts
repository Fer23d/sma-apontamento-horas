import type { Configuration, PopupRequest } from '@azure/msal-browser'

const clientId = import.meta.env.VITE_MSAL_CLIENT_ID?.trim() ?? ''
const tenantId = import.meta.env.VITE_MSAL_TENANT_ID?.trim() ?? ''

export const isMsalConfigured = Boolean(clientId && tenantId)

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: typeof window === 'undefined'
      ? '/auth.html'
      : new URL(`${import.meta.env.BASE_URL || '/'}auth.html`, window.location.origin).toString(),
    // Compatibilidade explícita com o retorno do HashRouter.
    navigateToLoginRequestUrl: false,
  } as Configuration['auth'] & { navigateToLoginRequestUrl: false },
  cache: {
    cacheLocation: 'localStorage',
  },
}

export const loginRequest: PopupRequest = {
  scopes: ['User.Read'],
}
