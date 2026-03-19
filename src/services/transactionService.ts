import api from './api';
import { Transaction, TransactionFilter, TransactionInput } from '../types/Transaction';

// Transform camelCase frontend data to snake_case backend format
const toSnakeCase = (data: any): any => {
  if (!data) return data;
  
  const snakeData: any = { ...data };
  
  if (data.bankAccountId !== undefined) {
    snakeData.bank_account_id = data.bankAccountId;
    delete snakeData.bankAccountId;
  }
  if (data.legalEntityId !== undefined) {
    snakeData.legal_entity_id = data.legalEntityId;
    delete snakeData.legalEntityId;
  }
  if (data.assetIds !== undefined) {
    snakeData.asset_ids = data.assetIds;
    delete snakeData.assetIds;
  }
  if (data.assetId !== undefined) {
    snakeData.asset_id = data.assetId;
    delete snakeData.assetId;
  }
  if (data.transactionType !== undefined) {
    snakeData.transaction_type = data.transactionType;
    delete snakeData.transactionType;
  }
  if (data.fromDate !== undefined) {
    snakeData.from_date = data.fromDate;
    delete snakeData.fromDate;
  }
  if (data.toDate !== undefined) {
    snakeData.to_date = data.toDate;
    delete snakeData.toDate;
  }
  if (data.minAmount !== undefined) {
    snakeData.min_amount = data.minAmount;
    delete snakeData.minAmount;
  }
  if (data.maxAmount !== undefined) {
    snakeData.max_amount = data.maxAmount;
    delete snakeData.maxAmount;
  }
  
  return snakeData;
};

// Transform snake_case backend data to camelCase frontend format
const toCamelCase = (data: any): any => {
  if (!data) return data;
  
  const camelData: any = { ...data };
  
  if (data.bank_account_id !== undefined) {
    camelData.bankAccountId = data.bank_account_id;
    delete camelData.bank_account_id;
  }
  if (data.legal_entity_id !== undefined) {
    camelData.legalEntityId = data.legal_entity_id;
    delete camelData.legal_entity_id;
  }
  if (data.asset_ids !== undefined) {
    camelData.assetIds = data.asset_ids;
    delete camelData.asset_ids;
  }
  if (data.transaction_type !== undefined) {
    camelData.transactionType = data.transaction_type;
    delete camelData.transaction_type;
  }
  if (data.created_at !== undefined) {
    camelData.createdAt = data.created_at;
    delete camelData.created_at;
  }
  if (data.updated_at !== undefined) {
    camelData.updatedAt = data.updated_at;
    delete camelData.updated_at;
  }
  
  return camelData;
};

export const transactionService = {
  getAll: async (filter?: TransactionFilter): Promise<Transaction[]> => {
    const snakeFilter = filter ? toSnakeCase(filter) : undefined;
    const response = await api.get('/transactions', { params: snakeFilter });
    return Array.isArray(response.data) 
      ? response.data.map(toCamelCase) 
      : [];
  },

  getById: async (id: string): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`);
    return toCamelCase(response.data);
  },

  getCount: async (filter?: TransactionFilter): Promise<number> => {
    const snakeFilter = filter ? toSnakeCase(filter) : undefined;
    const response = await api.get('/transactions/count', { params: snakeFilter });
    return response.data.count;
  },

  create: async (transaction: TransactionInput): Promise<Transaction> => {
    const snakeTransaction = toSnakeCase(transaction);
    const response = await api.post('/transactions', snakeTransaction);
    return toCamelCase(response.data);
  },

  update: async (id: string, transaction: Partial<TransactionInput>): Promise<Transaction> => {
    const snakeTransaction = toSnakeCase(transaction);
    const response = await api.patch(`/transactions/${id}`, snakeTransaction);
    return toCamelCase(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },

  bulkDelete: async (bankAccountIds?: string[], assetIds?: string[]): Promise<{ count: number }> => {
    const params = new URLSearchParams();
    if (bankAccountIds) {
      bankAccountIds.forEach(id => params.append('bank_account_ids', id));
    }
    if (assetIds) {
      assetIds.forEach(id => params.append('asset_ids', id));
    }
    const response = await api.post(`/transactions/bulk-delete?${params.toString()}`);
    return response.data;
  },

  linkToAsset: async (transactionId: string, assetId: string): Promise<void> => {
    await api.post('/asset-transactions', { 
      transaction_id: transactionId, 
      asset_id: assetId 
    });
  },

  unlinkFromAsset: async (transactionId: string, assetId: string): Promise<void> => {
    await api.delete(`/asset-transactions/${transactionId}/${assetId}`);
  },
};

