import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { legalEntityService } from '../services/legalEntityService';
import { ContributionSummary, IncomeExpenseSummary, ReportFilter } from '../types/Report';
import { LegalEntity } from '../types/LegalEntity';
import ScrollToTop from '../components/ScrollToTop';
import './ReportsPage.css';

type ReportTab = 'contributions' | 'income_expense';

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('contributions');
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [contributionsData, setContributionsData] = useState<ContributionSummary[]>([]);
  const [incomeExpenseData, setIncomeExpenseData] = useState<IncomeExpenseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ReportFilter>({
    legalEntityId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadLegalEntities();
  }, []);

  useEffect(() => {
    loadReportData();
  }, [activeTab, filters]);

  const loadLegalEntities = async () => {
    try {
      const data = await legalEntityService.getAll();
      setLegalEntities(data);
    } catch (err) {
      console.error('Failed to load legal entities:', err);
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'contributions') {
        const data = await reportService.getContributionsReport(filters);
        setContributionsData(data);
      } else if (activeTab === 'income_expense') {
        const data = await reportService.getIncomeExpenseReport(filters);
        setIncomeExpenseData(data);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportContributions = () => {
    const exportData = contributionsData.flatMap(entity =>
      entity.contributions.map(c => ({
        'Legal Entity': entity.legalEntityName,
        'Date': c.date,
        'Description': c.description,
        'Amount': c.amount,
        'Source': c.source || '',
        'Bank Account': c.bankAccountName
      }))
    );
    exportToCSV(exportData, 'contributions_report.csv');
  };

  return (
    <div className="reports-page">
      <ScrollToTop />
      <div className="page-header">
        <h1>Reports</h1>
      </div>

      {/* Filters */}
      <div className="filters-card card">
        <div className="filters-row">
          <div className="filter-group">
            <label>Legal Entity</label>
            <select
              value={filters.legalEntityId || ''}
              onChange={(e) => setFilters({ ...filters, legalEntityId: e.target.value })}
            >
              <option value="">All Entities</option>
              {legalEntities.map(entity => (
                <option key={entity.id} value={entity.id}>
                  {entity.legalName}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>

          <button 
            className="btn btn-secondary"
            onClick={() => setFilters({ legalEntityId: '', startDate: '', endDate: '' })}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="report-tabs">
        <button
          className={`tab ${activeTab === 'contributions' ? 'active' : ''}`}
          onClick={() => setActiveTab('contributions')}
        >
          Super Contributions
        </button>
        <button
          className={`tab ${activeTab === 'income_expense' ? 'active' : ''}`}
          onClick={() => setActiveTab('income_expense')}
        >
          Income & Expense
        </button>
      </div>

      {/* Report Content */}
      <div className="report-content">
        {loading && <div className="loading">Loading report data...</div>}
        {error && <div className="error-message">{error}</div>}

        {/* Contributions Report */}
        {activeTab === 'contributions' && !loading && (
          <div className="contributions-report">
            <div className="report-actions">
              <button className="btn btn-secondary" onClick={handleExportContributions}>
                Export to CSV
              </button>
            </div>

            {contributionsData.length === 0 ? (
              <div className="empty-state card">
                <p>No contribution data found for the selected filters.</p>
              </div>
            ) : (
              contributionsData.map(entity => (
                <div key={entity.legalEntityId} className="entity-report card">
                  <div className="entity-header">
                    <h2>{entity.legalEntityName}</h2>
                    <div className="entity-summary">
                      <div className="summary-item">
                        <span className="label">Total Contributions:</span>
                        <span className="value amount-positive">{formatCurrency(entity.totalContributions)}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Number of Transactions:</span>
                        <span className="value">{entity.transactionCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="contributions-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Source</th>
                          <th>Bank Account</th>
                          <th className="amount-col">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entity.contributions.map(contribution => (
                          <tr key={contribution.id}>
                            <td>{formatDate(contribution.date)}</td>
                            <td>{contribution.description}</td>
                            <td>{contribution.source || '-'}</td>
                            <td>{contribution.bankAccountName}</td>
                            <td className="amount-col amount-positive">
                              {formatCurrency(contribution.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Income & Expense Report */}
        {activeTab === 'income_expense' && !loading && incomeExpenseData && (
          <div className="income-expense-report">
            <div className="summary-cards">
              <div className="summary-card card income">
                <h3>Total Income</h3>
                <p className="amount amount-positive">{formatCurrency(incomeExpenseData.totalIncome)}</p>
              </div>
              <div className="summary-card card expense">
                <h3>Total Expense</h3>
                <p className="amount amount-negative">{formatCurrency(incomeExpenseData.totalExpense)}</p>
              </div>
              <div className="summary-card card net">
                <h3>Net Amount</h3>
                <p className={`amount ${incomeExpenseData.netAmount >= 0 ? 'amount-positive' : 'amount-negative'}`}>
                  {formatCurrency(incomeExpenseData.netAmount)}
                </p>
              </div>
            </div>

            {/* Internal Transfers Section */}
            {incomeExpenseData.transferCount > 0 && (
              <div className="transfers-section card">
                <h3>Internal Transfers</h3>
                <div className="transfers-summary">
                  <div className="transfer-stat">
                    <span className="label">Transfers In:</span>
                    <span className="value amount-positive">{formatCurrency(incomeExpenseData.totalTransfersIn)}</span>
                  </div>
                  <div className="transfer-stat">
                    <span className="label">Transfers Out:</span>
                    <span className="value amount-negative">{formatCurrency(incomeExpenseData.totalTransfersOut)}</span>
                  </div>
                  <div className="transfer-stat">
                    <span className="label">Total Transactions:</span>
                    <span className="value">{incomeExpenseData.transferCount}</span>
                  </div>
                </div>
                <p className="transfers-note">
                  <em>Note: Internal transfers are excluded from income and expense calculations to avoid double-counting.</em>
                </p>
              </div>
            )}

            <div className="category-breakdown">
              <div className="breakdown-section card">
                <h3>Income by Category</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Transactions</th>
                      <th className="amount-col">Amount</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeExpenseData.incomeByCategory.map((cat, idx) => (
                      <tr key={idx}>
                        <td>{cat.category}</td>
                        <td>{cat.transactionCount}</td>
                        <td className="amount-col">{formatCurrency(cat.amount)}</td>
                        <td>{cat.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="breakdown-section card">
                <h3>Expense by Category</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Transactions</th>
                      <th className="amount-col">Amount</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeExpenseData.expenseByCategory.map((cat, idx) => (
                      <tr key={idx}>
                        <td>{cat.category}</td>
                        <td>{cat.transactionCount}</td>
                        <td className="amount-col">{formatCurrency(cat.amount)}</td>
                        <td>{cat.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
