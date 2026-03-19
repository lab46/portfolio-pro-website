/**
 * Service for managing automation rules
 */

import api from './api';
import type { AutomationRule, AutomationRuleCreate, AutomationRuleUpdate, RuleTestResult, ApplyRulesResult } from '../types/AutomationRule';

/**
 * Convert snake_case from API to camelCase for frontend
 */
function transformRuleFromAPI(data: any): AutomationRule {
  // Transform categorization rules patterns if present
  let categorizationRules = data.categorization_rules;
  if (categorizationRules?.patterns) {
    categorizationRules = {
      ...categorizationRules,
      patterns: categorizationRules.patterns.map((p: any) => ({
        field: p.field,
        contains: p.contains,
        caseInsensitive: p.case_insensitive !== undefined ? p.case_insensitive : p.caseInsensitive,
        regex: p.regex,
        minAmount: p.min_amount !== undefined ? p.min_amount : p.minAmount,
        maxAmount: p.max_amount !== undefined ? p.max_amount : p.maxAmount,
      })),
    };
  }

  return {
    id: data.id,
    categorizationRules,
    enabled: data.enabled,
    bankAccountId: data.bank_account_id,
    assetId: data.asset_id,
    assetTransactionType: data.asset_transaction_type,
    legalEntityId: data.legal_entity_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Convert camelCase from frontend to snake_case for API
 */
function transformRuleToAPI(data: AutomationRuleCreate | AutomationRuleUpdate): any {
  // Transform categorization rules patterns if present
  let categorization_rules = data.categorizationRules;
  if (categorization_rules?.patterns) {
    categorization_rules = {
      ...categorization_rules,
      patterns: categorization_rules.patterns.map((p: any) => ({
        field: p.field,
        contains: p.contains,
        case_insensitive: p.caseInsensitive,
        regex: p.regex,
        min_amount: p.minAmount,
        max_amount: p.maxAmount,
      })),
    };
  }

  return {
    categorization_rules,
    enabled: data.enabled,
    bank_account_id: data.bankAccountId,
    asset_id: data.assetId,
    asset_transaction_type: data.assetTransactionType,
    legal_entity_id: data.legalEntityId,
  };
}

/**
 * Get all automation rules
 */
export async function getAllRules(params?: {
  enabled?: boolean;
  bankAccountId?: string;
  assetId?: string;
}): Promise<AutomationRule[]> {
  const queryParams: any = {};
  if (params?.enabled !== undefined) queryParams.enabled = params.enabled;
  if (params?.bankAccountId) queryParams.bank_account_id = params.bankAccountId;
  if (params?.assetId) queryParams.asset_id = params.assetId;

  const response = await api.get('/automation-rules/', { params: queryParams });
  return response.data.map(transformRuleFromAPI);
}

/**
 * Get a single automation rule by ID
 */
export async function getRule(id: string): Promise<AutomationRule> {
  const response = await api.get(`/automation-rules/${id}`);
  return transformRuleFromAPI(response.data);
}

/**
 * Create a new automation rule
 */
export async function createRule(rule: AutomationRuleCreate): Promise<AutomationRule> {
  const response = await api.post('/automation-rules/', transformRuleToAPI(rule));
  return transformRuleFromAPI(response.data);
}

/**
 * Update an existing automation rule
 */
export async function updateRule(id: string, rule: AutomationRuleUpdate): Promise<AutomationRule> {
  const response = await api.put(`/automation-rules/${id}`, transformRuleToAPI(rule));
  return transformRuleFromAPI(response.data);
}

/**
 * Delete an automation rule
 */
export async function deleteRule(id: string): Promise<void> {
  await api.delete(`/automation-rules/${id}`);
}

/**
 * Enable an automation rule
 */
export async function enableRule(id: string): Promise<{ message: string; rule: AutomationRule }> {
  const response = await api.post(`/automation-rules/${id}/enable`);
  return {
    message: response.data.message,
    rule: transformRuleFromAPI(response.data.rule),
  };
}

/**
 * Disable an automation rule
 */
export async function disableRule(id: string): Promise<{ message: string; rule: AutomationRule }> {
  const response = await api.post(`/automation-rules/${id}/disable`);
  return {
    message: response.data.message,
    rule: transformRuleFromAPI(response.data.rule),
  };
}

/**
 * Test a rule against a specific transaction
 */
export async function testRule(ruleId: string, transactionId: string): Promise<RuleTestResult> {
  const response = await api.post(`/automation-rules/${ruleId}/test/${transactionId}`);
  const data = response.data;
  return {
    matches: data.matches,
    reason: data.reason,
    patternResults: data.pattern_results,
    wouldApplyCategory: data.would_apply_category,
    wouldAssignLegalEntity: data.would_assign_legal_entity,
    wouldLinkAsset: data.would_link_asset,
  };
}

/**
 * Apply all enabled rules to pending transactions
 */
export async function applyRulesToPending(): Promise<ApplyRulesResult> {
  const response = await api.post('/automation-rules/apply-to-pending');
  const data = response.data;
  return {
    message: data.message,
    totalTransactions: data.total_transactions,
    rulesAvailable: data.rules_available,
    processed: data.processed,
    skipped: data.skipped,
    categorized: data.categorized,
  };
}

/**
 * Apply all enabled rules to all transactions (or filtered subset)
 */
export async function applyRulesToAll(params?: {
  bankAccountId?: string;
  legalEntityId?: string;
}): Promise<ApplyRulesResult> {
  const queryParams: any = {};
  if (params?.bankAccountId) queryParams.bank_account_id = params.bankAccountId;
  if (params?.legalEntityId) queryParams.legal_entity_id = params.legalEntityId;

  const response = await api.post('/automation-rules/apply-to-all', null, { params: queryParams });
  const data = response.data;
  return {
    message: data.message,
    totalTransactions: data.total_transactions,
    rulesAvailable: data.rules_available,
    processed: data.processed,
    skipped: data.skipped,
    categorized: data.categorized,
  };
}
