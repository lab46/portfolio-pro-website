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

export interface BankAccount {
  id: string; // UUID
  bankName: string;
  accountName: string;
  accountNickName?: string;
  accountNumber: string; // Can include BSB, hyphens, and spaces
  accountType: 'checking' | 'savings' | 'credit' | 'investment';
  currency: string;
  isActive: boolean;
  isJointAccount: boolean;
  notes?: string;
  legalEntityId?: string;
  legalEntity?: {
    id: string;
    legalName: string;
    type: string;
  };
  owners?: JointOwner[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BankAccountInput {
  bankName: string;
  accountName: string;
  accountNickName?: string;
  accountNumber: string; // Can include BSB, hyphens, and spaces
  accountType: 'checking' | 'savings' | 'credit' | 'investment';
  currency: string;
  isActive: boolean;
  isJointAccount: boolean;
  notes?: string;
  legalEntityId?: string;
  owners?: { legalEntityId: string; ownershipPercentage: number }[];
}

