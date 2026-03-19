export interface EntityMember {
  id: string;
  entityId: string;
  memberEntityId: string;
  role: string;
  ownershipPercentage?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  memberName?: string;
}

export interface EntityMemberInput {
  entityId: string;
  memberEntityId: string;
  role: string;
  ownershipPercentage?: number;
  notes?: string;
}

export interface EntityMemberUpdate {
  role?: string;
  ownershipPercentage?: number;
  notes?: string;
}
