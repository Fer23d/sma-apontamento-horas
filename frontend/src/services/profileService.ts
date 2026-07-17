import { demoCollaborator } from '../mocks/demoData'
import type { CollaboratorProfile } from '../shared/types/domain'

export interface ProfileService {
  getById(collaboratorId: string): Promise<CollaboratorProfile | null>
}

export const profileService: ProfileService = {
  async getById(collaboratorId) {
    return collaboratorId === demoCollaborator.id ? demoCollaborator : null
  },
}
