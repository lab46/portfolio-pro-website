export interface Transaction {
  id: string; // UUID
  date: string;
  description: string;
  amount: number;
  merchant?: string;
  category?: string;
  status: 'pending' | 'categorized' | 'verified' | 'rejected';
  transactionType?: 'income' | 'expense' | 'internal_transfer' | 'investment' | 'withdrawal';
  bankAccountId?: string; // UUID
  legalEntityId?: string; // UUID
  assetIds?: string[]; // UUIDs
  createdAt?: string;
  updatedAt?: string;
}

export interface TransactionFilter {
  assetId?: string; // UUID
  bankAccountId?: string; // UUID
  fromDate?: string;
  toDate?: string;
  status?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  description?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionInput {
  date: string;
  description: string;
  amount: number;
  merchant?: string;
  category?: string;
  status: 'pending' | 'categorized' | 'verified' | 'rejected';
  bankAccountId?: string; // UUID
  legalEntityId?: string; // UUID
  assetIds?: string[]; // UUIDs
  transactionType?: 'income' | 'expense';
}

