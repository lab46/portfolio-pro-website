export interface LegalEntity {
  id: string; // UUID
  legalName: string;
  type: string; // Type value from backend
  otherTypeDescription?: string;
  abn?: string; // Australian Business Number
  acn?: string; // Australian Company Number
  tfn?: string; // Tax File Number
  bankAccountsCount?: number;
  assetsCount?: number;
  membersCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LegalEntityInput {
  legalName: string;
  type: string; // Type value from backend
  otherTypeDescription?: string;
  abn?: string;
  acn?: string;
  tfn?: string;
}
