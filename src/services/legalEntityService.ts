import api from './api';
import { LegalEntity, LegalEntityInput } from '../types/LegalEntity';

export interface LegalEntityTypeOption {
  value: string;
  label: string;
}

// Transform camelCase to snake_case for backend
const toSnakeCase = (entity: LegalEntityInput | Partial<LegalEntityInput>) => ({
  legal_name: entity.legalName,
  type: entity.type,
  other_type_description: entity.otherTypeDescription,
  abn: entity.abn,
  acn: entity.acn,
  tfn: entity.tfn,
});

// Transform snake_case to camelCase from backend
const toCamelCase = (entity: any): LegalEntity => ({
  id: entity.id,
  legalName: entity.legal_name,
  type: entity.type,
  otherTypeDescription: entity.other_type_description,
  abn: entity.abn,
  acn: entity.acn,
  tfn: entity.tfn,
  bankAccountsCount: entity.bank_accounts_count,
  assetsCount: entity.assets_count,
  createdAt: entity.created_at,
  updatedAt: entity.updated_at,
});

export const legalEntityService = {
  getTypes: async (): Promise<LegalEntityTypeOption[]> => {
    const response = await api.get('/legal-entities/types');
    return response.data;
  },

  getAll: async (): Promise<LegalEntity[]> => {
    const response = await api.get('/legal-entities');
    return response.data.map(toCamelCase);
  },

  getById: async (id: string): Promise<LegalEntity> => {
    const response = await api.get(`/legal-entities/${id}`);
    return toCamelCase(response.data);
  },

  create: async (entity: LegalEntityInput): Promise<LegalEntity> => {
    const response = await api.post('/legal-entities', toSnakeCase(entity));
    return toCamelCase(response.data);
  },

  update: async (id: string, entity: Partial<LegalEntityInput>): Promise<LegalEntity> => {
    const response = await api.put(`/legal-entities/${id}`, toSnakeCase(entity));
    return toCamelCase(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/legal-entities/${id}`);
  },
};
