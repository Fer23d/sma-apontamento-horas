import type { NavigationItem } from '../types/navigation'

export const collaboratorNavigation: NavigationItem[] = [
  { label: 'Visão geral', shortLabel: 'VG', path: '/colaborador' },
  { label: 'Novo apontamento', shortLabel: 'NA', path: '/colaborador/apontamentos/novo' },
  { label: 'Histórico', shortLabel: 'HI', path: '/colaborador/historico' },
  { label: 'Folgas', shortLabel: 'FO', path: '/colaborador/folgas' },
  { label: 'Meu perfil', shortLabel: 'MP', path: '/colaborador/perfil' },
]
