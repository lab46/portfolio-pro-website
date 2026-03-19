export type ReportType = 'contributions' | 'income_expense' | 'asset_performance' | 'tax_summary';

export interface ReportFilter {
  legalEntityId?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
}

export interface ContributionDetail {
  id: string;
  date: string;
  description: string;
  amount: number;
  source?: string;
  bankAccountName: string;
}

export interface ContributionSummary {
  legalEntityId: string;
  legalEntityName: string;
  totalContributions: number;
  transactionCount: number;
  contributions: ContributionDetail[];
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  transactionCount: number;
  percentage: number;
}

export interface IncomeExpenseSummary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  incomeByCategory: CategoryBreakdown[];
  expenseByCategory: CategoryBreakdown[];
  totalTransfersIn: number;
  totalTransfersOut: number;
  transferCount: number;
}

export interface AssetPerformanceSummary {
  assetId: string;
  assetName: string;
  assetType: string;
  purchaseCost: number;
  currentValue: number;
  totalGain: number;
  percentageGain: number;
  transactionCount: number;
}

export interface DashboardSummary {
  legalEntityId: string;
  legalEntityName: string;
  contributionsYtd: number;
  contributionsTotal: number;
  lastContributionDate?: string;
  lastContributionAmount?: number;
}
