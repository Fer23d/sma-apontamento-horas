import type { AssignmentSnapshot } from '../squads/types'

export type TimeOffRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface TimeOffRequest {
  id: string
  collaboratorId: string
  date: string
  reason: string
  status: TimeOffRequestStatus
  assignmentSnapshot: AssignmentSnapshot | null
  createdAt: string
  updatedAt: string
  decidedAt?: string
  cancellationReason?: string
  cancelledAt?: string
}
