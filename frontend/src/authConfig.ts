import { PublicClientApplication, type Configuration, type PopupRequest } from '@azure/msal-browser'

const clientId = import.meta.env.VITE_MSAL_CLIENT_ID?.trim() ?? ''
const tenantId = import.meta.env.VITE_MSAL_TENANT_ID?.trim() ?? ''

export const isMsalConfigured = Boolean(clientId && tenantId)

export function getMsalRedirectUri() {
  if (typeof window === 'undefined') return '/'
  return new URL(import.meta.env.BASE_URL || '/', window.location.origin).toString()
}

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: getMsalRedirectUri(),
    postLogoutRedirectUri: getMsalRedirectUri(),
    // Compatibilidade explícita com o retorno do HashRouter.
    navigateToLoginRequestUrl: false,
  } as Configuration['auth'] & { navigateToLoginRequestUrl: false },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  } as Configuration['cache'] & { storeAuthStateInCookie: false },
}

export const msalInstance = new PublicClientApplication(msalConfig)

export const loginRequest: PopupRequest = {
  scopes: ['User.Read'],
}
