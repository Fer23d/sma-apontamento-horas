export type SupervisorApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type SupervisorPendingEntry = {
  id: string
  collaboratorId: string
  collaboratorName: string
  entryDate: string
  projectCode: string
  durationMinutes: number
  status: SupervisorApprovalStatus
  activityName?: string
  rejectionReason?: string
  decidedAt?: string
  decidedBy?: string
}

export type SupervisorDashboardSummary = {
  pending: number
  approved: number
  rejected: number
}
