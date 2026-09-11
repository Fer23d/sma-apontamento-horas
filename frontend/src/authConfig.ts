import type { Configuration, PopupRequest } from '@azure/msal-browser'

const clientId = import.meta.env.VITE_MSAL_CLIENT_ID?.trim() ?? ''
const tenantId = import.meta.env.VITE_MSAL_TENANT_ID?.trim() ?? ''

export const isMsalConfigured = Boolean(clientId && tenantId)

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: typeof window === 'undefined'
      ? '/'
      : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? `${window.location.origin}/`
        : 'https://fer23d.github.io/sma-apontamento-horas/',
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
