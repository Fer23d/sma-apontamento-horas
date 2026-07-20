import type { AssignmentSnapshot, Squad, Supervisor } from '../features/squads/types'
import type { WorkloadVersion } from '../features/workloads/types'
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
  { id: 'activity-other', name: 'Outros', active: true },
]

export const demoSupervisors: Supervisor[] = [
  { id: 'supervisor-demo-001', name: 'Supervisora Demonstração', email: 'supervisao.demo@sma.local', active: true },
]

export const demoSquads: Squad[] = [
  { id: 'squad-automation', name: 'Engenharia de Automação', supervisorId: 'supervisor-demo-001', active: true },
  { id: 'squad-electrical', name: 'Engenharia Elétrica', supervisorId: 'supervisor-demo-001', active: true },
]

export const demoAssignmentSnapshot: AssignmentSnapshot = {
  squadId: 'squad-automation',
  squadName: 'Engenharia de Automação',
  supervisorId: 'supervisor-demo-001',
  supervisorName: 'Supervisora Demonstração',
}

export const demoWorkloadVersions: WorkloadVersion[] = [{
  id: 'workload-demo-001',
  collaboratorId: demoCollaborator.id,
  dailyMinutes: weekdayMinutes,
  effectiveFrom: '2020-01-01',
  status: 'APPROVED',
  createdAt: '2020-01-01T12:00:00.000Z',
  approvedAt: '2020-01-01T12:00:00.000Z',
}]
