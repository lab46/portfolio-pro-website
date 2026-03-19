export interface JointOwner {
  id?: string;
  legalEntityId: string;
  ownershipPercentage: number;
  legalEntity?: {
    id: string;
    legalName: string;
    type: string;
  };
}

export interface Asset {
  id: string; // UUID from backend
  name: string;
  description?: string;
  category?: string;
  purchaseCost: number;
  attributes?: string;
  legalEntityId?: string;
  legalEntity?: {
    id: string;
    legalName: string;
    type: string;
  };
  isJointOwnership: boolean;
  owners?: JointOwner[];
  
  // Real Estate specific fields
  renovationCosts?: number;
  stampDuty?: number;
  legalFees?: number;
  inspectionFees?: number;
  agentFees?: number;
  otherFees?: number;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetInput {
  name: string;
  description?: string;
  category?: string;
  purchaseCost: number;
  attributes?: string;
  legalEntityId?: string;
  isJointOwnership: boolean;
  owners?: { legalEntityId: string; ownershipPercentage: number }[];
  
  // Real Estate specific fields
  renovationCosts?: number;
  stampDuty?: number;
  legalFees?: number;
  inspectionFees?: number;
  agentFees?: number;
  otherFees?: number;
}

