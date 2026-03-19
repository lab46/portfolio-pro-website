import React, { useState, useEffect } from 'react';
import { Transaction, TransactionFilter } from '../types/Transaction';
import { transactionService } from '../services/transactionService';
import { bankAccountService } from '../services/bankAccountService';
import { assetService } from '../services/assetService';
import { legalEntityService } from '../services/legalEntityService';
import { BankAccount } from '../types/BankAccount';
import { Asset } from '../types/Asset';
import { LegalEntity } from '../types/LegalEntity';
import ScrollToTop from '../components/ScrollToTop';
import './TransactionsPage.css';

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allBankAccounts, setAllBankAccounts] = useState<BankAccount[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [selectedLegalEntityId, setSelectedLegalEntityId] = useState<string>('');
  const [filteredBankAccounts, setFilteredBankAccounts] = useState<BankAccount[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
  const [isReassigning, setIsReassigning] = useState(false);
  const [targetLegalEntityId, setTargetLegalEntityId] = useState<string>('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryInputValue, setCategoryInputValue] = useState<string>('');

  const [filters, setFilters] = useState<TransactionFilter>({
    limit: 20,
    offset: 0,
  });

  const [activeFilters, setActiveFilters] = useState<{
    fromDate?: string;
    toDate?: string;
    status?: string;
    bankAccountId?: string;
    assetId?: string;
    minAmount?: number;
    maxAmount?: number;
    description?: string;
  }>({});

  const loadBankAccounts = async () => {
    try {
      const data = await bankAccountService.getAll();
      setAllBankAccounts(data);
    } catch (err) {
      console.error('Failed to load bank accounts:', err);
    }
  };

  const loadAssets = async () => {
    try {
      const data = await assetService.getAll();
      setAllAssets(data);
    } catch (err) {
      console.error('Failed to load assets:', err);
    }
  };

  const loadLegalEntities = async () => {
    try {
      const data = await legalEntityService.getAll();
      setLegalEntities(data);
    } catch (err) {
      console.error('Failed to load legal entities:', err);
    }
  };

  const loadAllData = async () => {
    await Promise.all([loadBankAccounts(), loadAssets(), loadLegalEntities()]);
    // Reload transactions if a legal entity is selected
    if (selectedLegalEntityId) {
      await loadTransactionsForEntity();
    }
  };

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Filter bank accounts and assets when legal entity changes
  useEffect(() => {
    if (!selectedLegalEntityId) {
      setFilteredBankAccounts([]);
      setFilteredAssets([]);
      setTransactions([]);
      setTotalCount(0);
      return;
    }

    // Filter bank accounts for selected legal entity
    const accounts = allBankAccounts.filter(account => {
      // Check if single ownership matches
      if (account.legalEntityId === selectedLegalEntityId) return true;
      // Check if joint ownership includes this entity
      if (account.isJointAccount && account.owners) {
        return account.owners.some(owner => owner.legalEntityId === selectedLegalEntityId);
      }
      return false;
    });
    setFilteredBankAccounts(accounts);

    // Filter assets for selected legal entity
    const entityAssets = allAssets.filter(asset => {
      // Check if single ownership matches
      if (asset.legalEntityId === selectedLegalEntityId) return true;
      // Check if joint ownership includes this entity
      if (asset.isJointOwnership && asset.owners) {
        return asset.owners.some(owner => owner.legalEntityId === selectedLegalEntityId);
      }
      return false;
    });
    setFilteredAssets(entityAssets);

    // Clear any bank account or asset filters that are no longer valid
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      if (prev.bankAccountId && !accounts.find(a => a.id === prev.bankAccountId)) {
        delete newFilters.bankAccountId;
      }
      if (prev.assetId && !entityAssets.find(a => a.id === prev.assetId)) {
        delete newFilters.assetId;
      }
      return newFilters;
    });

    // Load transactions for this entity
    loadTransactionsForEntity();
  }, [selectedLegalEntityId, allBankAccounts, allAssets]);

  const loadTransactionsForEntity = async () => {
    if (!selectedLegalEntityId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load ALL transactions without pagination for proper client-side filtering
      const data = await transactionService.getAll();
      // Filter transactions to only show those from accounts/assets owned by selected entity
      const accountIds = filteredBankAccounts.map(a => a.id);
      const assetIds = filteredAssets.map(a => a.id);
      
      const filtered = data.filter(t => {
        if (t.bankAccountId && accountIds.includes(t.bankAccountId)) return true;
        if (t.assetIds && t.assetIds.some(id => assetIds.includes(id))) return true;
        return false;
      });
      
      setTransactions(filtered);
      setTotalCount(filtered.length);
    } catch (err) {
      setError('Failed to load transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const newFilters: TransactionFilter = {
      ...filters,
      offset: 0,
    };

    if (activeFilters.fromDate) {
      newFilters.fromDate = activeFilters.fromDate;
    }
    if (activeFilters.toDate) {
      newFilters.toDate = activeFilters.toDate;
    }
    if (activeFilters.status) {
      newFilters.status = activeFilters.status as Transaction['status'];
    }
    if (activeFilters.bankAccountId) {
      newFilters.bankAccountId = activeFilters.bankAccountId;
    }
    if (activeFilters.assetId) {
      newFilters.assetId = activeFilters.assetId;
    }
    if (activeFilters.minAmount !== undefined) {
      newFilters.minAmount = activeFilters.minAmount;
    }
    if (activeFilters.maxAmount !== undefined) {
      newFilters.maxAmount = activeFilters.maxAmount;
    }
    if (activeFilters.description) {
      newFilters.description = activeFilters.description;
    }

    setFilters(newFilters);
  };

  // Reload transactions when filters change
  useEffect(() => {
    if (selectedLegalEntityId) {
      loadTransactionsForEntity();
    }
  }, [filters]);

  const clearFilters = () => {
    setActiveFilters({});
    setFilters({
      limit: 20,
      offset: 0,
    });
  };

  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTransactionIds.size === transactions.length) {
      setSelectedTransactionIds(new Set());
    } else {
      setSelectedTransactionIds(new Set(transactions.map(t => t.id)));
    }
  };

  const handleReassignTransactions = async () => {
    if (selectedTransactionIds.size === 0 || !targetLegalEntityId) return;

    const targetEntity = legalEntities.find(e => e.id === targetLegalEntityId);
    const targetEntityName = targetEntity ? targetEntity.legalName : 'selected entity';

    if (!window.confirm(
      `Are you sure you want to reassign ${selectedTransactionIds.size} transaction(s) to "${targetEntityName}"?\n\n` +
      `This will move the transactions by updating their bank account assignment.`
    )) {
      return;
    }

    setIsReassigning(true);
    try {
      // Get target entity's bank accounts
      const targetAccounts = allBankAccounts.filter(account => {
        if (account.legalEntityId === targetLegalEntityId) return true;
        if (account.isJointAccount && account.owners) {
          return account.owners.some(owner => owner.legalEntityId === targetLegalEntityId);
        }
        return false;
      });

      if (targetAccounts.length === 0) {
        alert(`Cannot reassign: "${targetEntityName}" has no bank accounts. Please create a bank account first.`);
        return;
      }

      // Use the first available bank account for the target entity
      const targetBankAccountId = targetAccounts[0].id;

      // Update each selected transaction
      const updates = Array.from(selectedTransactionIds).map(transactionId =>
        transactionService.update(transactionId, { bankAccountId: targetBankAccountId })
      );

      await Promise.all(updates);

      alert(`Successfully reassigned ${selectedTransactionIds.size} transaction(s) to "${targetEntityName}"`);

      // Clear selection and reload
      setSelectedTransactionIds(new Set());
      setTargetLegalEntityId('');
      await loadTransactionsForEntity();
    } catch (err) {
      console.error('Failed to reassign transactions:', err);
      alert('Failed to reassign transactions. Please try again.');
    } finally {
      setIsReassigning(false);
    }
  };

  const handleCategoryUpdate = async (transactionId: string, newCategory: string) => {
    try {
      await transactionService.update(transactionId, { category: newCategory });
      // Update local state
      setTransactions(prev => prev.map(t => 
        t.id === transactionId ? { ...t, category: newCategory } : t
      ));
      setEditingCategoryId(null);
      setCategoryInputValue('');
    } catch (err) {
      console.error('Failed to update category:', err);
      alert('Failed to update category. Please try again.');
    }
  };

  const startEditingCategory = (transactionId: string, currentCategory?: string) => {
    setEditingCategoryId(transactionId);
    setCategoryInputValue(currentCategory || '');
  };

  const cancelEditingCategory = () => {
    setEditingCategoryId(null);
    setCategoryInputValue('');
  };

  const handleCategoryKeyPress = (e: React.KeyboardEvent, transactionId: string) => {
    if (e.key === 'Enter') {
      handleCategoryUpdate(transactionId, categoryInputValue);
    } else if (e.key === 'Escape') {
      cancelEditingCategory();
    }
  };

  const handleDeleteAllTransactions = async () => {
    if (!selectedLegalEntityId) return;

    const entity = legalEntities.find(e => e.id === selectedLegalEntityId);
    const entityName = entity ? entity.legalName : 'this legal entity';

    if (!window.confirm(
      `Are you sure you want to delete ALL transactions for "${entityName}"?\n\n` +
      `This will delete ${totalCount} transaction(s) and cannot be undone.`
    )) {
      return;
    }

    setIsDeleting(true);
    try {
      const accountIds = filteredBankAccounts.map(a => a.id);
      const assetIds = filteredAssets.map(a => a.id);

      const result = await transactionService.bulkDelete(accountIds, assetIds);
      
      alert(`Successfully deleted ${result.count} transaction(s) for "${entityName}"`);
      
      // Reload transactions
      await loadTransactionsForEntity();
    } catch (err) {
      console.error('Failed to delete transactions:', err);
      alert('Failed to delete transactions. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const removeFilter = (key: keyof typeof activeFilters) => {
    const newActiveFilters = { ...activeFilters };
    delete newActiveFilters[key];
    setActiveFilters(newActiveFilters);

    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
  };

  const changePage = (direction: 'next' | 'prev') => {
    const newOffset = direction === 'next' 
      ? (filters.offset || 0) + (filters.limit || 20)
      : Math.max(0, (filters.offset || 0) - (filters.limit || 20));
    
    setFilters({ ...filters, offset: newOffset });
  };

  const changePageSize = (size: number) => {
    setFilters({ ...filters, limit: size, offset: 0 });
  };

  const getStatusBadgeClass = (status: Transaction['status']) => {
    switch (status) {
      case 'verified':
        return 'status-verified';
      case 'categorized':
        return 'status-categorized';
      case 'pending':
        return 'status-pending';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1;
  const totalPages = Math.ceil(totalCount / (filters.limit || 20));

  return (
    <div className="transactions-page">
      <ScrollToTop />
      <div className="page-header">
        <h1>Transactions</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={loadAllData}>
            Refresh Data
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="transactions-layout">
        {/* Left Column - Legal Entities List */}
        <div className="legal-entities-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-header-content">
              <h3>Legal Entities</h3>
              <span className="entity-count">{legalEntities.length}</span>
            </div>
            {selectedLegalEntityId && totalCount > 0 && (
              <button
                className="delete-all-btn"
                onClick={handleDeleteAllTransactions}
                disabled={isDeleting}
                title="Delete all transactions for selected legal entity"
              >
                {isDeleting ? '⏳' : '🗑️'}
              </button>
            )}
          </div>

          <div className="legal-entities-list">
            {legalEntities.length === 0 && (
              <div className="empty-state">
                <p>No legal entities found</p>
                <small>Create a legal entity first</small>
              </div>
            )}
            {legalEntities.map((entity) => (
              <div
                key={entity.id}
                className={`entity-item ${selectedLegalEntityId === entity.id ? 'selected' : ''}`}
                onClick={() => setSelectedLegalEntityId(entity.id)}
              >
                <div className="entity-info">
                  <div className="entity-name">{entity.legalName}</div>
                  <div className="entity-type">{entity.type}</div>
                </div>
                {selectedLegalEntityId === entity.id && (
                  <div className="entity-stats">
                    <span>{filteredBankAccounts.length} accounts</span>
                    <span>{filteredAssets.length} assets</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Transactions and Filters */}
        <div className="transactions-content">
          {!selectedLegalEntityId && (
            <div className="empty-state-card">
              <div className="empty-icon">📊</div>
              <h3>Select a Legal Entity</h3>
              <p>Choose a legal entity from the list on the left to view its transactions</p>
            </div>
          )}

          {selectedLegalEntityId && transactions.length === 0 && !loading && (
            <div className="empty-state-card">
              <div className="empty-icon">📭</div>
              <h3>No Transactions Found</h3>
              <p>This legal entity has no transactions yet</p>
              <small style={{ color: '#999', marginTop: '0.5rem', display: 'block' }}>
                Process bank statements to see transactions here
              </small>
            </div>
          )}

          {selectedLegalEntityId && transactions.length > 0 && (
        <>
          <div className="filters-section card">
            <div className="filter-header" onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}>
              <h3>Filter Transactions</h3>
              <button className="collapse-toggle">
                {isFilterCollapsed ? '▼' : '▲'}
              </button>
            </div>
            
            {!isFilterCollapsed && (
              <>
                <div className="filters-grid">
              <div className="form-group">
                <label>From Date</label>
                <input
                  type="date"
                  value={activeFilters.fromDate || ''}
                  onChange={(e) => setActiveFilters({ ...activeFilters, fromDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>To Date</label>
                <input
                  type="date"
                  value={activeFilters.toDate || ''}
                  onChange={(e) => setActiveFilters({ ...activeFilters, toDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={activeFilters.status || ''}
                  onChange={(e) => setActiveFilters({ ...activeFilters, status: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="categorized">Categorized</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="form-group">
                <label>Bank Account</label>
                <select
                  value={activeFilters.bankAccountId || ''}
                  onChange={(e) => setActiveFilters({ ...activeFilters, bankAccountId: e.target.value || undefined })}
                >
                  <option value="">All</option>
                  {filteredBankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountName} ({account.bankName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Asset</label>
                <select
                  value={activeFilters.assetId || ''}
                  onChange={(e) => setActiveFilters({ ...activeFilters, assetId: e.target.value || undefined })}
                >
                  <option value="">All</option>
                  {filteredAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Min Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={activeFilters.minAmount !== undefined ? activeFilters.minAmount : ''}
                  onChange={(e) => setActiveFilters({ ...activeFilters, minAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>

              <div className="form-group">
                <label>Max Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={activeFilters.maxAmount !== undefined ? activeFilters.maxAmount : ''}
                  onChange={(e) => setActiveFilters({ ...activeFilters, maxAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Search description..."
                  value={activeFilters.description || ''}
                  onChange={(e) => setActiveFilters({ ...activeFilters, description: e.target.value })}
                />
              </div>
            </div>

            <div className="filter-actions">
              <button className="btn btn-primary" onClick={applyFilters}>
                Apply Filters
              </button>
              <button className="btn btn-secondary" onClick={clearFilters}>
                Clear All
              </button>
            </div>

            {Object.keys(activeFilters).length > 0 && (
              <div className="active-filters">
                <span>Active Filters:</span>
                {activeFilters.fromDate && (
                  <span className="filter-chip">
                    From: {formatDate(activeFilters.fromDate)}
                    <button onClick={() => removeFilter('fromDate')}>×</button>
                  </span>
                )}
                {activeFilters.toDate && (
                  <span className="filter-chip">
                    To: {formatDate(activeFilters.toDate)}
                    <button onClick={() => removeFilter('toDate')}>×</button>
                  </span>
                )}
                {activeFilters.status && (
                  <span className="filter-chip">
                    Status: {activeFilters.status}
                    <button onClick={() => removeFilter('status')}>×</button>
                  </span>
                )}
                {activeFilters.bankAccountId && (
                  <span className="filter-chip">
                    Bank Account: {filteredBankAccounts.find(a => a.id === activeFilters.bankAccountId)?.accountName}
                    <button onClick={() => removeFilter('bankAccountId')}>×</button>
                  </span>
                )}
                {activeFilters.assetId && (
                  <span className="filter-chip">
                    Asset: {filteredAssets.find(a => a.id === activeFilters.assetId)?.name}
                    <button onClick={() => removeFilter('assetId')}>×</button>
                  </span>
                )}
                {activeFilters.minAmount !== undefined && (
                  <span className="filter-chip">
                    Min: ${activeFilters.minAmount}
                    <button onClick={() => removeFilter('minAmount')}>×</button>
                  </span>
                )}
                {activeFilters.maxAmount !== undefined && (
                  <span className="filter-chip">
                    Max: ${activeFilters.maxAmount}
                    <button onClick={() => removeFilter('maxAmount')}>×</button>
                  </span>
                )}
                {activeFilters.description && (
                  <span className="filter-chip">
                    Search: "{activeFilters.description}"
                    <button onClick={() => removeFilter('description')}>×</button>
                  </span>
                )}
              </div>
            )}
              </>
            )}
          </div>

          <div className="transactions-controls">
            <div className="selection-controls">
              <label className="select-all-checkbox">
                <input
                  type="checkbox"
                  checked={transactions.length > 0 && selectedTransactionIds.size === transactions.length}
                  onChange={toggleSelectAll}
                  disabled={transactions.length === 0}
                />
                <span>Select All</span>
              </label>
              {selectedTransactionIds.size > 0 && (
                <>
                  <span className="selected-count">{selectedTransactionIds.size} selected</span>
                  <select
                    value={targetLegalEntityId}
                    onChange={(e) => setTargetLegalEntityId(e.target.value)}
                    className="entity-selector"
                  >
                    <option value="">Reassign to...</option>
                    {legalEntities
                      .filter(e => e.id !== selectedLegalEntityId)
                      .map(entity => (
                        <option key={entity.id} value={entity.id}>
                          {entity.legalName}
                        </option>
                      ))}
                  </select>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={handleReassignTransactions}
                    disabled={!targetLegalEntityId || isReassigning}
                  >
                    {isReassigning ? 'Reassigning...' : 'Reassign'}
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => setSelectedTransactionIds(new Set())}
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-row">
                <input
                  type="checkbox"
                  className="transaction-checkbox"
                  checked={selectedTransactionIds.has(transaction.id)}
                  onChange={() => toggleTransactionSelection(transaction.id)}
                />
                <span className="transaction-date" title="Transaction Date">{formatDate(transaction.date)}</span>
                <span className="transaction-description" title={transaction.description}>{transaction.description}</span>
                
                {/* Category - Editable inline */}
                <span className="transaction-category-field" title="Category">
                  {editingCategoryId === transaction.id ? (
                    <div className="category-input-wrapper">
                      <input
                        type="text"
                        className="category-input"
                        value={categoryInputValue}
                        onChange={(e) => setCategoryInputValue(e.target.value)}
                        onKeyDown={(e) => handleCategoryKeyPress(e, transaction.id)}
                        onBlur={() => handleCategoryUpdate(transaction.id, categoryInputValue)}
                        autoFocus
                        placeholder="Enter category..."
                      />
                    </div>
                  ) : (
                    <div 
                      className="category-display"
                      onClick={() => startEditingCategory(transaction.id, transaction.category)}
                    >
                      {transaction.category ? (
                        <span className="transaction-category">{transaction.category}</span>
                      ) : (
                        <span className="category-placeholder">+ Add category</span>
                      )}
                    </div>
                  )}
                </span>

                {transaction.bankAccountId && (
                  <span className="transaction-account" title="Bank Account">
                    Account: {filteredBankAccounts.find(a => a.id === transaction.bankAccountId)?.accountName || 'Unknown'}
                  </span>
                )}
                {transaction.assetIds && transaction.assetIds.length > 0 && (
                  <span className="transaction-assets" title="Linked Assets">Assets: {transaction.assetIds.length}</span>
                )}
                <span 
                  className={`transaction-status ${getStatusBadgeClass(transaction.status)}`}
                  title={`Status: ${transaction.status === 'pending' ? 'Awaiting categorization' : transaction.status === 'categorized' ? 'Categorized, awaiting verification' : transaction.status === 'verified' ? 'Verified and confirmed' : 'Rejected'}`}
                >
                  {transaction.status}
                </span>
                <span className={`transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}`} title="Transaction Amount">
                  {transaction.amount >= 0 ? '+' : ''}${transaction.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="pagination-footer">
            <div className="pagination-info-bottom">
              <span className="count-info">
                Showing {Math.min((filters.offset || 0) + 1, totalCount)} - {Math.min((filters.offset || 0) + (filters.limit || 20), totalCount)} of {totalCount} transactions
              </span>
            </div>
            <div className="pagination-controls">
              <button 
                className="btn btn-secondary" 
                onClick={() => changePage('prev')}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                className="btn btn-secondary" 
                onClick={() => changePage('next')}
                disabled={currentPage >= totalPages}
              >
                Next
              </button>
            </div>
            <div className="page-size-selector">
              <label>Per page:</label>
              <select value={filters.limit || 20} onChange={(e) => changePageSize(parseInt(e.target.value))}>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </>
          )}

          {loading && (
            <div className="loading-overlay">
              <div className="spinner" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
