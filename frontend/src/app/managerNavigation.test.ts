import { describe, expect, it } from 'vitest'
import appRoutesSource from './AppRoutes.tsx?raw'
import supervisorSource from '../pages/SupervisorPage.tsx?raw'
import directorSource from '../pages/DiretoriaPage.tsx?raw'
import teamsSource from '../pages/EquipesPage.tsx?raw'
import reportsSource from '../pages/RelatoriosPage.tsx?raw'
import sidebarSource from '../components/DirectorSidebar.tsx?raw'

describe('navegação da gestão', () => {
  it('mantém Avisos dentro da shell do perfil que está autenticado', () => {
    expect(appRoutesSource).toContain('<ManagerNoticesRedirect />')
    expect(appRoutesSource).not.toContain('<GestorLayout />')
    expect(supervisorSource).toContain("id: 'announcements'")
    expect(sidebarSource).toContain('/administracao?view=avisos')
  })

  it('mantém somente uma opção ativa e impede que cards vizinhos expandam na edição', () => {
    expect(directorSource).toContain("import { DirectorSidebar } from '../components/DirectorSidebar'")
    expect(teamsSource).toContain("import { DirectorSidebar } from '../components/DirectorSidebar'")
    expect(reportsSource).toContain("import { DirectorSidebar } from '../components/DirectorSidebar'")
    expect(sidebarSource).toContain('aria-current={isActive ? \'page\' : undefined}')
    expect(teamsSource).toContain('items-start')
    expect(teamsSource).toContain('text-white')
    expect(teamsSource).not.toContain('text-[#06241f]')
  })
})
