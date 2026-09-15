import { describe, expect, it } from 'vitest'
import appRoutesSource from './AppRoutes.tsx?raw'
import supervisorSource from '../pages/SupervisorPage.tsx?raw'
import directorSource from '../pages/DiretoriaPage.tsx?raw'
import teamsSource from '../pages/EquipesPage.tsx?raw'
import reportsSource from '../pages/RelatoriosPage.tsx?raw'

describe('navegação da gestão', () => {
  it('mantém Avisos dentro da shell do perfil que está autenticado', () => {
    expect(appRoutesSource).toContain('<ManagerNoticesRedirect />')
    expect(appRoutesSource).not.toContain('<GestorLayout />')
    expect(supervisorSource).toContain("id: 'announcements'")
    expect(directorSource).toContain('/administracao?view=avisos')
    expect(teamsSource).toContain('/administracao?view=avisos')
    expect(reportsSource).toContain('/administracao?view=avisos')
  })
})
