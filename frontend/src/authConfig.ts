import type { Configuration, PopupRequest } from '@azure/msal-browser'

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID?.trim() ?? '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID?.trim() ?? ''}`,
    redirectUri: typeof window === 'undefined'
      ? '/'
      : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? '/'
        : new URL(import.meta.env.BASE_URL || '/sma-apontamento-horas/', window.location.origin).toString(),
  },
  cache: {
    cacheLocation: 'localStorage',
  },
}

export const loginRequest: PopupRequest = {
  scopes: ['User.Read'],
}
