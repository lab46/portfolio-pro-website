import api from './api';
import { Asset, AssetInput } from '../types/Asset';

// Transform camelCase to snake_case for backend
const toSnakeCase = (asset: AssetInput | Partial<AssetInput>) => ({
  name: asset.name,
  description: asset.description,
  category: asset.category,
  purchase_cost: asset.purchaseCost,
  attributes: asset.attributes,
  legal_entity_id: asset.legalEntityId,
  is_joint_ownership: asset.isJointOwnership,
  owners: asset.owners?.map(owner => ({
    legal_entity_id: owner.legalEntityId,
    ownership_percentage: owner.ownershipPercentage,
  })),
  renovation_costs: asset.renovationCosts,
  stamp_duty: asset.stampDuty,
  legal_fees: asset.legalFees,
  inspection_fees: asset.inspectionFees,
  agent_fees: asset.agentFees,
  other_fees: asset.otherFees,
});

// Transform snake_case to camelCase from backend
const toCamelCase = (asset: any): Asset => ({
  id: asset.id,
  name: asset.name,
  description: asset.description,
  category: asset.category,
  purchaseCost: asset.purchase_cost,
  attributes: asset.attributes,
  legalEntityId: asset.legal_entity_id,
  legalEntity: asset.legal_entity ? {
    id: asset.legal_entity.id,
    legalName: asset.legal_entity.legal_name,
    type: asset.legal_entity.type,
  } : undefined,
  isJointOwnership: asset.is_joint_ownership || false,
  owners: asset.owners?.map((owner: any) => ({
    id: owner.id,
    legalEntityId: owner.legal_entity_id,
    ownershipPercentage: owner.ownership_percentage,
    legalEntity: owner.legal_entity ? {
      id: owner.legal_entity.id,
      legalName: owner.legal_entity.legal_name,
      type: owner.legal_entity.type,
    } : undefined,
  })) || [],
  renovationCosts: asset.renovation_costs,
  stampDuty: asset.stamp_duty,
  legalFees: asset.legal_fees,
  inspectionFees: asset.inspection_fees,
  agentFees: asset.agent_fees,
  otherFees: asset.other_fees,
  createdAt: asset.created_at,
  updatedAt: asset.updated_at,
});

export const assetService = {
  getAll: async (): Promise<Asset[]> => {
    const response = await api.get('/assets');
    return response.data.map(toCamelCase);
  },

  getById: async (id: string): Promise<Asset> => {
    const response = await api.get(`/assets/${id}`);
    return toCamelCase(response.data);
  },

  create: async (asset: AssetInput): Promise<Asset> => {
    const response = await api.post('/assets', toSnakeCase(asset));
    return toCamelCase(response.data);
  },

  update: async (id: string, asset: Partial<AssetInput>): Promise<Asset> => {
    const response = await api.put(`/assets/${id}`, toSnakeCase(asset));
    return toCamelCase(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/assets/${id}`);
  },
};

