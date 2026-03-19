import api from './api';
import type { EntityMember, EntityMemberInput, EntityMemberUpdate } from '../types/EntityMember';

// Transform camelCase to snake_case for backend
const toSnakeCase = (data: EntityMemberInput | EntityMemberUpdate): any => {
  const result: any = {};
  
  // Note: entity_id comes from URL path, not payload
  if ('memberEntityId' in data && data.memberEntityId !== undefined) result.member_entity_id = data.memberEntityId;
  if ('role' in data && data.role !== undefined) result.role = data.role;
  if ('ownershipPercentage' in data && data.ownershipPercentage !== undefined) result.ownership_percentage = data.ownershipPercentage;
  if ('notes' in data && data.notes !== undefined) result.notes = data.notes;
  
  return result;
};

// Transform snake_case to camelCase for frontend
const toCamelCase = (member: any): EntityMember => ({
  id: member.id,
  entityId: member.entity_id,
  memberEntityId: member.member_entity_id,
  role: member.role,
  ownershipPercentage: member.ownership_percentage,
  notes: member.notes,
  createdAt: member.created_at,
  updatedAt: member.updated_at,
  memberName: member.member_name,
});

export const entityMemberService = {
  /**
   * Get all members for a legal entity
   */
  getMembers: async (entityId: string): Promise<EntityMember[]> => {
    const response = await api.get(`/legal-entities/${entityId}/members`);
    return response.data.map(toCamelCase);
  },

  /**
   * Add a new member to a legal entity
   */
  addMember: async (entityId: string, member: EntityMemberInput): Promise<EntityMember> => {
    const response = await api.post(`/legal-entities/${entityId}/members`, toSnakeCase(member));
    return toCamelCase(response.data);
  },

  /**
   * Update an existing entity member
   */
  updateMember: async (entityId: string, memberId: string, member: EntityMemberUpdate): Promise<EntityMember> => {
    const response = await api.put(`/legal-entities/${entityId}/members/${memberId}`, toSnakeCase(member));
    return toCamelCase(response.data);
  },

  /**
   * Remove a member from a legal entity
   */
  deleteMember: async (entityId: string, memberId: string): Promise<void> => {
    await api.delete(`/legal-entities/${entityId}/members/${memberId}`);
  },
};
