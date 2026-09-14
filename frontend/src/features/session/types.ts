export type DemoRole = 'COLLABORATOR' | 'SUPERVISOR' | 'DIRECTOR_ADMIN'

export type DemoSession = {
  id: string
  name: string
  role: DemoRole
  createdAt: string
  explicitLoginAt: string
  isDemo: boolean
  version: 2
  email?: string
  authProvider?: 'demo' | 'microsoft'
}
