import api from './api';
import { 
  ReportFilter, 
  ContributionSummary, 
  IncomeExpenseSummary, 
  DashboardSummary 
} from '../types/Report';

const toSnakeCase = (data: any): any => {
  if (!data) return data;
  const snakeData: any = {};
  
  if (data.legalEntityId !== undefined) snakeData.legal_entity_id = data.legalEntityId;
  if (data.startDate !== undefined) snakeData.start_date = data.startDate;
  if (data.endDate !== undefined) snakeData.end_date = data.endDate;
  if (data.category !== undefined) snakeData.category = data.category;
  if (data.status !== undefined) snakeData.status = data.status;
  
  return snakeData;
};

const toCamelCase = (data: any): any => {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(toCamelCase);
  }
  
  const camelData: any = { ...data };
  
  if (data.legal_entity_id !== undefined) {
    camelData.legalEntityId = data.legal_entity_id;
    delete camelData.legal_entity_id;
  }
  if (data.legal_entity_name !== undefined) {
    camelData.legalEntityName = data.legal_entity_name;
    delete camelData.legal_entity_name;
  }
  if (data.total_contributions !== undefined) {
    camelData.totalContributions = data.total_contributions;
    delete camelData.total_contributions;
  }
  if (data.transaction_count !== undefined) {
    camelData.transactionCount = data.transaction_count;
    delete camelData.transaction_count;
  }
  if (data.bank_account_name !== undefined) {
    camelData.bankAccountName = data.bank_account_name;
    delete camelData.bank_account_name;
  }
  if (data.total_income !== undefined) {
    camelData.totalIncome = data.total_income;
    delete camelData.total_income;
  }
  if (data.total_expense !== undefined) {
    camelData.totalExpense = data.total_expense;
    delete camelData.total_expense;
  }
  if (data.net_amount !== undefined) {
    camelData.netAmount = data.net_amount;
    delete camelData.net_amount;
  }
  if (data.income_by_category !== undefined) {
    camelData.incomeByCategory = toCamelCase(data.income_by_category);
    delete camelData.income_by_category;
  }
  if (data.expense_by_category !== undefined) {
    camelData.expenseByCategory = toCamelCase(data.expense_by_category);
    delete camelData.expense_by_category;
  }
  if (data.contributions_ytd !== undefined) {
    camelData.contributionsYtd = data.contributions_ytd;
    delete camelData.contributions_ytd;
  }
  if (data.contributions_total !== undefined) {
    camelData.contributionsTotal = data.contributions_total;
    delete camelData.contributions_total;
  }
  if (data.last_contribution_date !== undefined) {
    camelData.lastContributionDate = data.last_contribution_date;
    delete camelData.last_contribution_date;
  }
  if (data.last_contribution_amount !== undefined) {
    camelData.lastContributionAmount = data.last_contribution_amount;
    delete camelData.last_contribution_amount;
  }
  if (data.total_transfers_in !== undefined) {
    camelData.totalTransfersIn = data.total_transfers_in;
    delete camelData.total_transfers_in;
  }
  if (data.total_transfers_out !== undefined) {
    camelData.totalTransfersOut = data.total_transfers_out;
    delete camelData.total_transfers_out;
  }
  if (data.transfer_count !== undefined) {
    camelData.transferCount = data.transfer_count;
    delete camelData.transfer_count;
  }
  
  // Handle nested arrays
  if (camelData.contributions && Array.isArray(camelData.contributions)) {
    camelData.contributions = camelData.contributions.map(toCamelCase);
  }
  
  return camelData;
};

export const reportService = {
  getContributionsReport: async (filter?: ReportFilter): Promise<ContributionSummary[]> => {
    const snakeFilter = filter ? toSnakeCase(filter) : undefined;
    const response = await api.get('/reports/contributions', { params: snakeFilter });
    return toCamelCase(response.data);
  },

  getIncomeExpenseReport: async (filter?: ReportFilter): Promise<IncomeExpenseSummary> => {
    const snakeFilter = filter ? toSnakeCase(filter) : undefined;
    const response = await api.get('/reports/income-expense', { params: snakeFilter });
    return toCamelCase(response.data);
  },

  getDashboardSummary: async (): Promise<DashboardSummary[]> => {
    const response = await api.get('/reports/dashboard-summary');
    return toCamelCase(response.data);
  },
};
