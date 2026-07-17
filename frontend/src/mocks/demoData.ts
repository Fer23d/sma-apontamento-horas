import type { Activity, Client, CollaboratorProfile } from '../shared/types/domain'

const weekdayMinutes = 480

export const demoCollaborator: CollaboratorProfile = {
  id: 'demo-collaborator-001',
  name: 'Colaborador Demonstração',
  email: 'colaborador.demo@sma.local',
  jobTitle: 'Projetista',
  squadName: 'Engenharia',
  workSchedule: {
    mondayMinutes: weekdayMinutes,
    tuesdayMinutes: weekdayMinutes,
    wednesdayMinutes: weekdayMinutes,
    thursdayMinutes: weekdayMinutes,
    fridayMinutes: weekdayMinutes,
    saturdayMinutes: 0,
    sundayMinutes: 0,
  },
}

export const demoClients: Client[] = [
  { id: 'client-industrial-alpha', name: 'Cliente Industrial Alfa', active: true },
  { id: 'client-energy-beta', name: 'Cliente Energia Beta', active: true },
]

export const demoActivities: Activity[] = [
  { id: 'activity-project-design', name: 'Elaboração de projeto', active: true },
  { id: 'activity-document-analysis', name: 'Análise de documento', active: true },
  { id: 'activity-internal-meeting', name: 'Reunião interna', active: true },
  { id: 'activity-client-meeting', name: 'Reunião com cliente', active: true },
  { id: 'activity-collaborator-support', name: 'Apoio a colaborador', active: true },
]
