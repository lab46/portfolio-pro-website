import api from './api';
import { BankAccount, BankAccountInput } from '../types/BankAccount';

// Transform camelCase to snake_case for backend
const toSnakeCase = (account: BankAccountInput | Partial<BankAccountInput>) => ({
  account_name: account.accountName,
  account_nick_name: account.accountNickName,
  account_number: account.accountNumber,
  bank_name: account.bankName,
  account_type: account.accountType,
  currency: account.currency,
  is_active: account.isActive,
  is_joint_account: account.isJointAccount,
  notes: account.notes,
  legal_entity_id: account.legalEntityId,
  owners: account.owners?.map(owner => ({
    legal_entity_id: owner.legalEntityId,
    ownership_percentage: owner.ownershipPercentage,
  })),
});

// Transform snake_case to camelCase from backend
const toCamelCase = (account: any): BankAccount => ({
  id: account.id,
  accountName: account.account_name,
  accountNickName: account.account_nick_name,
  accountNumber: account.account_number,
  bankName: account.bank_name,
  accountType: account.account_type,
  currency: account.currency,
  isActive: account.is_active,
  isJointAccount: account.is_joint_account || false,
  notes: account.notes,
  legalEntityId: account.legal_entity_id,
  legalEntity: account.legal_entity ? {
    id: account.legal_entity.id,
    legalName: account.legal_entity.legal_name,
    type: account.legal_entity.type,
  } : undefined,
  owners: account.owners?.map((owner: any) => ({
    id: owner.id,
    legalEntityId: owner.legal_entity_id,
    ownershipPercentage: owner.ownership_percentage,
    legalEntity: owner.legal_entity ? {
      id: owner.legal_entity.id,
      legalName: owner.legal_entity.legal_name,
      type: owner.legal_entity.type,
    } : undefined,
  })) || [],
  createdAt: account.created_at,
  updatedAt: account.updated_at,
});

export const bankAccountService = {
  getAll: async (): Promise<BankAccount[]> => {
    const response = await api.get('/bank-accounts');
    return response.data.map(toCamelCase);
  },

  getById: async (id: number): Promise<BankAccount> => {
    const response = await api.get(`/bank-accounts/${id}`);
    return toCamelCase(response.data);
  },

  create: async (account: BankAccountInput): Promise<BankAccount> => {
    const response = await api.post('/bank-accounts', toSnakeCase(account));
    return toCamelCase(response.data);
  },

  update: async (id: string, account: Partial<BankAccountInput>): Promise<BankAccount> => {
    const response = await api.put(`/bank-accounts/${id}`, toSnakeCase(account));
    return toCamelCase(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/bank-accounts/${id}`);
  },
};

