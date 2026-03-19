import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assetService } from '../services/assetService';
import { reportService } from '../services/reportService';
import { DashboardSummary } from '../types/Report';
import ScrollToTop from '../components/ScrollToTop';
import './HomePage.css';

const HomePage = () => {
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [totalInvested, setTotalInvested] = useState<number | null>(null);
  const [contributionSummaries, setContributionSummaries] = useState<DashboardSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingContributions, setLoadingContributions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load contributions on mount
  useEffect(() => {
    loadContributions();
  }, []);

  const loadContributions = async () => {
    setLoadingContributions(true);
    try {
      const data = await reportService.getDashboardSummary();
      setContributionSummaries(data);
    } catch (err) {
      console.error('Failed to load contributions:', err);
    } finally {
      setLoadingContributions(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const assets = await assetService.getAll();
      
      // Calculate total invested (purchase cost + all fees)
      const invested = assets.reduce((sum, asset) => {
        const purchaseCost = asset.purchaseCost || 0;
        const renovationCosts = asset.renovationCosts || 0;
        const stampDuty = asset.stampDuty || 0;
        const legalFees = asset.legalFees || 0;
        const inspectionFees = asset.inspectionFees || 0;
        const agentFees = asset.agentFees || 0;
        const otherFees = asset.otherFees || 0;
        
        return sum + purchaseCost + renovationCosts + stampDuty + 
               legalFees + inspectionFees + agentFees + otherFees;
      }, 0);
      
      // For now, use invested as value (can be updated later with actual market values)
      setTotalValue(invested);
      setTotalInvested(invested);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load portfolio summary');
    } finally {
      setLoading(false);
    }
  };

  const totalGain = totalValue !== null && totalInvested !== null
    ? totalValue - totalInvested
    : null;

  const percentageGain = totalInvested !== null && totalInvested > 0 && totalGain !== null
    ? ((totalGain / totalInvested) * 100).toFixed(2)
    : null;

  return (
    <div className="home-page">
      <ScrollToTop />
      <h1>Portfolio Dashboard</h1>
      
      <div className="card">
        <h2>Portfolio Summary</h2>
        {!totalValue && !loading && (
          <button onClick={loadSummary} className="primary-button">
            Load Portfolio Summary
          </button>
        )}
        
        {loading && <div className="spinner"></div>}
        
        {error && <div className="error">{error}</div>}
        
        {totalValue !== null && !loading && (
          <div className="summary-stats">
            <div className="stat-card">
              <h3>Total Value</h3>
              <p className="stat-value">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="stat-card">
              <h3>Total Invested</h3>
              <p className="stat-value">${totalInvested!.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="stat-card">
              <h3>Total Gain/Loss</h3>
              <p className={`stat-value ${totalGain! >= 0 ? 'positive' : 'negative'}`}>
                ${totalGain!.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {percentageGain && (
                <p className={`stat-percentage ${totalGain! >= 0 ? 'positive' : 'negative'}`}>
                  {totalGain! >= 0 ? '+' : ''}{percentageGain}%
                </p>
              )}
            </div>
            <button onClick={loadSummary} className="secondary-button">
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Super Contributions Summary */}
      <div className="card">
        <div className="card-header-with-action">
          <h2>Super Contributions</h2>
          <Link to="/reports" className="view-report-link">
            View Full Report →
          </Link>
        </div>
        
        {loadingContributions && <div className="spinner"></div>}
        
        {!loadingContributions && contributionSummaries.length === 0 && (
          <p className="empty-state">No contribution data available</p>
        )}
        
        {!loadingContributions && contributionSummaries.length > 0 && (
          <div className="contributions-grid">
            {contributionSummaries.map(summary => (
              <div key={summary.legalEntityId} className="contribution-widget">
                <h3>{summary.legalEntityName}</h3>
                <div className="contribution-stats">
                  <div className="contribution-stat">
                    <span className="label">Year to Date</span>
                    <span className="value ytd">{formatCurrency(summary.contributionsYtd)}</span>
                  </div>
                  <div className="contribution-stat">
                    <span className="label">Total Contributions</span>
                    <span className="value total">{formatCurrency(summary.contributionsTotal)}</span>
                  </div>
                  {summary.lastContributionDate && (
                    <div className="contribution-stat last">
                      <span className="label">Last Contribution</span>
                      <span className="value">{formatCurrency(summary.lastContributionAmount || 0)}</span>
                      <span className="date">{formatDate(summary.lastContributionDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="grid grid-cols-3">
          <Link to="/legal-entities" className="action-card">
            <div className="action-icon">🏢</div>
            <h3>Legal Entities</h3>
            <p>Manage individuals and companies</p>
          </Link>
          <Link to="/bank-accounts" className="action-card">
            <div className="action-icon">🏦</div>
            <h3>Bank Accounts</h3>
            <p>Manage your bank accounts</p>
          </Link>
          <Link to="/assets" className="action-card">
            <div className="action-icon">📊</div>
            <h3>Manage Assets</h3>
            <p>View and manage your portfolio items</p>
          </Link>
          <Link to="/transactions" className="action-card">
            <div className="action-icon">💳</div>
            <h3>Transactions</h3>
            <p>View and reconcile transactions</p>
          </Link>
          <Link to="/documents" className="action-card">
            <div className="action-icon">📄</div>
            <h3>Documents</h3>
            <p>Upload bank statements and documents</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
