/**
 * Automation Rule Types
 * 
 * Defines structures for automation rules that can categorize transactions
 * and assign legal entities based on text patterns
 */

export interface RulePattern {
  field: 'description' | 'category' | 'amount';
  contains?: string;
  caseInsensitive?: boolean;
  regex?: string;
  minAmount?: number;
  maxAmount?: number;
  operator?: 'AND' | 'OR'; // Operator to combine with NEXT pattern (not used for last pattern)
}

export interface CategorizationRules {
  patterns: RulePattern[];
  category?: string;
}

export interface AutomationRule {
  id: string;
  categorizationRules: CategorizationRules | null;
  enabled: boolean;
  transactionType: 'income' | 'expense' | 'internal_transfer' | 'investment' | 'withdrawal' | null;
  bankAccountId: string | null;
  assetId: string | null;
  assetTransactionType: string | null;
  legalEntityId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface AutomationRuleCreate {
  categorizationRules: CategorizationRules | null;
  enabled?: boolean;
  transactionType?: 'income' | 'expense' | 'internal_transfer' | 'investment' | 'withdrawal' | null;
  bankAccountId?: string | null;
  assetId?: string | null;
  assetTransactionType?: string | null;
  legalEntityId?: string | null;
}

export interface AutomationRuleUpdate extends AutomationRuleCreate {}

export interface RuleTestResult {
  matches: boolean;
  reason?: string;
  patternResults?: Array<{
    patternIndex: number;
    pattern: RulePattern;
    matches: boolean;
  }>;
  wouldApplyCategory?: string | null;
  wouldAssignLegalEntity?: string | null;
  wouldLinkAsset?: string | null;
}

export interface ApplyRulesResult {
  message: string;
  totalTransactions: number;
  rulesAvailable: number;
  processed: number;
  skipped: number;
  categorized: number;
}
