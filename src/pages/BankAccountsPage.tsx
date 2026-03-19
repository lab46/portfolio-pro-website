import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BankAccount, BankAccountInput } from '../types/BankAccount';
import { LegalEntity } from '../types/LegalEntity';
import { bankAccountService } from '../services/bankAccountService';
import { legalEntityService } from '../services/legalEntityService';
import ScrollToTop from '../components/ScrollToTop';
import './BankAccountsPage.css';

const BankAccountsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const filterLegalEntityId = searchParams.get('legalEntityId');
  
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<BankAccount[]>([]);
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    accountType: '',
    legalEntityId: '',
    isActive: '',
  });

  const [formData, setFormData] = useState<BankAccountInput>({
    bankName: '',
    accountName: '',
    accountNickName: '',
    accountNumber: '',
    accountType: 'checking',
    currency: 'AUD',
    isActive: true,
    isJointAccount: false,
    notes: '',
    legalEntityId: undefined,
    owners: [],
  });

  useEffect(() => {
    if (filterLegalEntityId && accounts.length > 0) {
      setSearchFilters(prev => ({ ...prev, legalEntityId: filterLegalEntityId }));
    }
  }, [filterLegalEntityId]);

  useEffect(() => {
    applyFilters();
  }, [accounts, searchFilters]);

  const applyFilters = () => {
    let filtered = [...accounts];

    if (searchFilters.bankName) {
      filtered = filtered.filter(acc => 
        acc.bankName.toLowerCase().includes(searchFilters.bankName.toLowerCase())
      );
    }

    if (searchFilters.accountName) {
      filtered = filtered.filter(acc => 
        acc.accountName.toLowerCase().includes(searchFilters.accountName.toLowerCase())
      );
    }

    if (searchFilters.accountNumber) {
      filtered = filtered.filter(acc => 
        acc.accountNumber.toLowerCase().includes(searchFilters.accountNumber.toLowerCase())
      );
    }

    if (searchFilters.accountType) {
      filtered = filtered.filter(acc => acc.accountType === searchFilters.accountType);
    }

    if (searchFilters.legalEntityId) {
      filtered = filtered.filter(acc => acc.legalEntityId === searchFilters.legalEntityId);
    }

    if (searchFilters.isActive) {
      const isActive = searchFilters.isActive === 'true';
      filtered = filtered.filter(acc => acc.isActive === isActive);
    }

    setFilteredAccounts(filtered);
  };

  const clearFilters = () => {
    setSearchFilters({
      bankName: '',
      accountName: '',
      accountNumber: '',
      accountType: '',
      legalEntityId: '',
      isActive: '',
    });
  };

  const hasActiveFilters = () => {
    return Object.values(searchFilters).some(value => value !== '');
  };

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bankAccountService.getAll();
      setAccounts(data);
    } catch (err) {
      setError('Failed to load bank accounts');
      console.error(err);
    } finally {
      setLoading(false);
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
    await Promise.all([loadAccounts(), loadLegalEntities()]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (editingAccount) {
        await bankAccountService.update(editingAccount.id, formData);
      } else {
        await bankAccountService.create(formData);
      }

      await loadAccounts();
      resetForm();
    } catch (err) {
      setError(editingAccount ? 'Failed to update account' : 'Failed to create account');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setFormData({
      bankName: account.bankName,
      accountName: account.accountName,
      accountNickName: account.accountNickName || '',
      accountNumber: account.accountNumber,
      accountType: account.accountType as BankAccountInput['accountType'],
      currency: account.currency,
      isActive: account.isActive,
      isJointAccount: account.isJointAccount,
      notes: account.notes || '',
      legalEntityId: account.legalEntityId,
      owners: account.owners?.map(owner => ({
        legalEntityId: owner.legalEntityId,
        ownershipPercentage: owner.ownershipPercentage
      })) || [],
    });
    setShowForm(true);
    // Load legal entities if not already loaded
    if (legalEntities.length === 0) {
      loadLegalEntities();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await bankAccountService.delete(id);
      await loadAccounts();
    } catch (err) {
      setError('Failed to delete account');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Joint ownership helpers
  const addOwner = () => {
    const currentOwners = formData.owners || [];
    const newOwnerPercentage = 100 / (currentOwners.length + 1);
    const updatedOwners = [
      ...currentOwners.map(owner => ({
        ...owner,
        ownershipPercentage: newOwnerPercentage
      })),
      { legalEntityId: '', ownershipPercentage: newOwnerPercentage }
    ];
    setFormData({ ...formData, owners: updatedOwners });
  };

  const removeOwner = (index: number) => {
    const currentOwners = formData.owners || [];
    const updatedOwners = currentOwners.filter((_, i) => i !== index);
    // Recalculate percentages equally
    if (updatedOwners.length > 0) {
      const equalPercentage = 100 / updatedOwners.length;
      updatedOwners.forEach(owner => {
        owner.ownershipPercentage = equalPercentage;
      });
    }
    setFormData({ ...formData, owners: updatedOwners });
  };

  const updateOwner = (index: number, field: 'legalEntityId' | 'ownershipPercentage', value: string | number) => {
    const currentOwners = formData.owners || [];
    const updatedOwners = [...currentOwners];
    updatedOwners[index] = {
      ...updatedOwners[index],
      [field]: value
    };
    setFormData({ ...formData, owners: updatedOwners });
  };

  const handleJointAccountChange = (isJoint: boolean) => {
    if (isJoint) {
      // Initialize with 2 owners at 50% each
      setFormData({
        ...formData,
        isJointAccount: true,
        legalEntityId: undefined,
        owners: [
          { legalEntityId: '', ownershipPercentage: 50 },
          { legalEntityId: '', ownershipPercentage: 50 }
        ]
      });
    } else {
      setFormData({
        ...formData,
        isJointAccount: false,
        owners: []
      });
    }
  };

  // Get only individual legal entities for joint ownership
  const individualEntities = legalEntities.filter(entity => entity.type === 'individual');

  const resetForm = () => {
    setFormData({
      bankName: '',
      accountName: '',
      accountNickName: '',
      accountNumber: '',
      accountType: 'checking',
      currency: 'AUD',
      isActive: true,
      isJointAccount: false,
      notes: '',
      legalEntityId: undefined,
      owners: [],
    });
    setEditingAccount(null);
    setShowForm(false);
  };

  const cancelForm = () => {
    resetForm();
  };

  return (
    <div className="bank-accounts-page">
      <ScrollToTop />
      <div className="page-header">
        <h1>Bank Accounts</h1>
        <div>
          {!showForm && (
            <>
              <button className="btn btn-secondary" onClick={loadAllData}>
                {accounts.length === 0 ? 'Load Accounts' : 'Refresh'}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setShowForm(true);
                  if (legalEntities.length === 0) {
                    loadLegalEntities();
                  }
                }}
                style={{ marginLeft: '1rem' }}
              >
                Add Account
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Search Filters */}
      <div className="card search-filters">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsSearchExpanded(!isSearchExpanded)}>
          <h3>Search & Filter</h3>
          <span style={{ fontSize: '1.5rem' }}>{isSearchExpanded ? '▲' : '▼'}</span>
        </div>
        {isSearchExpanded && (
        <>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label>Bank Name</label>
            <input
              type="text"
              placeholder="Search by bank name..."
              value={searchFilters.bankName}
              onChange={(e) => setSearchFilters({ ...searchFilters, bankName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Account Name</label>
            <input
              type="text"
              placeholder="Search by account name..."
              value={searchFilters.accountName}
              onChange={(e) => setSearchFilters({ ...searchFilters, accountName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Account Number</label>
            <input
              type="text"
              placeholder="Search by account number (can include BSB)..."
              value={searchFilters.accountNumber}
              onChange={(e) => setSearchFilters({ ...searchFilters, accountNumber: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Account Type</label>
            <select
              value={searchFilters.accountType}
              onChange={(e) => setSearchFilters({ ...searchFilters, accountType: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="savings">Savings</option>
              <option value="cheque">Cheque</option>
              <option value="term_deposit">Term Deposit</option>
              <option value="credit">Credit</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Legal Entity</label>
            <select
              value={searchFilters.legalEntityId}
              onChange={(e) => setSearchFilters({ ...searchFilters, legalEntityId: e.target.value })}
            >
              <option value="">All Legal Entities</option>
              {legalEntities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.legalName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              value={searchFilters.isActive}
              onChange={(e) => setSearchFilters({ ...searchFilters, isActive: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
        {hasActiveFilters() && (
          <button type="button" className="button-secondary" onClick={clearFilters} style={{ marginTop: '1rem' }}>
            Clear Filters
          </button>
        )}
        <p style={{ marginTop: '1rem', color: '#888' }}>
          Showing {filteredAccounts.length} of {accounts.length} accounts
        </p>
        </>
        )}
      </div>

      {showForm && (
        <div className="card">
          <h2>{editingAccount ? 'Edit Account' : 'Add New Account'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Bank Name *</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Legal Entity (Optional)</label>
                <select
                  value={formData.legalEntityId || ''}
                  onChange={(e) => setFormData({ ...formData, legalEntityId: e.target.value || undefined })}
                  disabled={formData.isJointAccount}
                >
                  <option value="">-- Select Legal Entity --</option>
                  {legalEntities.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.legalName} ({entity.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.isJointAccount}
                    onChange={(e) => handleJointAccountChange(e.target.checked)}
                    style={{ width: 'auto', height: 'auto' }}
                  />
                  Joint Account
                </label>
              </div>

              {/* Joint Owners Section */}
              {formData.isJointAccount && (
                <div style={{ gridColumn: '1 / -1' }} className="joint-owners-section">
                  <h4>Joint Owners (Individuals Only)</h4>
                  {formData.owners?.map((owner, index) => (
                    <div key={index} className="owner-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                      <div className="form-group" style={{ flex: 2 }}>
                        <label>Owner {index + 1}</label>
                        <select
                          value={owner.legalEntityId}
                          onChange={(e) => updateOwner(index, 'legalEntityId', e.target.value)}
                          required
                        >
                          <option value="">-- Select Individual --</option>
                          {individualEntities.map((entity) => (
                            <option key={entity.id} value={entity.id}>
                              {entity.legalName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Percentage %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={owner.ownershipPercentage}
                          onChange={(e) => updateOwner(index, 'ownershipPercentage', parseFloat(e.target.value))}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOwner(index)}
                        className="btn btn-danger btn-sm"
                        disabled={(formData.owners?.length || 0) <= 2}
                        style={{ marginBottom: '0' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addOwner}
                    className="btn btn-secondary"
                    style={{ marginTop: '0.5rem' }}
                  >
                    + Add Owner
                  </button>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#888' }}>
                    Total: {(formData.owners?.reduce((sum, o) => sum + (o.ownershipPercentage || 0), 0) || 0).toFixed(2)}%
                    {Math.abs((formData.owners?.reduce((sum, o) => sum + (o.ownershipPercentage || 0), 0) || 0) - 100) > 0.01 && (
                      <span style={{ color: '#ff6b6b', marginLeft: '0.5rem' }}>
                        ⚠️ Must total 100%
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div className="form-group">
                <label>Account Name *</label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Account Nick Name</label>
                <input
                  type="text"
                  value={formData.accountNickName}
                  onChange={(e) => setFormData({ ...formData, accountNickName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Account Number *</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="Can include BSB, hyphens, and spaces (e.g., 062-000 12345678)"
                  required
                />
              </div>

              <div className="form-group">
                <label>Account Type *</label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value as BankAccountInput['accountType'] })}
                  required
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit</option>
                  <option value="investment">Investment</option>
                </select>
              </div>

              <div className="form-group">
                <label>Currency *</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  required
                >
                  <option value="AUD">AUD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="CAD">CAD</option>
                  <option value="INR">INR</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span style={{ marginLeft: '0.5rem' }}>Active Account</span>
                </label>
              </div>

              <div className="form-group full-width">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editingAccount ? 'Update Account' : 'Add Account'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelForm} disabled={loading}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && filteredAccounts.length > 0 && (
        <>
          {filterLegalEntityId && (
            <div className="filter-notice">
              Showing bank accounts for selected legal entity ({filteredAccounts.length} found)
            </div>
          )}
          <div className="accounts-list">
            {filteredAccounts.map((account) => (
              <div key={account.id} className="card account-card">
                <div className="account-compact-layout">
                  <div className="account-main-info">
                    <div className="account-title-row">
                      <h3>{account.accountName}</h3>
                      {account.accountNickName && <span className="account-nickname">({account.accountNickName})</span>}
                    </div>
                    <div className="account-meta">
                      <span className="bank-name">{account.bankName}</span>
                      <span className="separator">•</span>
                      <span className="account-type">{account.accountType}</span>
                      <span className="separator">•</span>
                      <span className={`account-status ${account.isActive ? 'active' : 'inactive'}`}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="account-details-inline">
                    {account.isJointAccount && account.owners && account.owners.length > 0 ? (
                      <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="label">Joint Owners:</span>
                        <div style={{ marginTop: '0.25rem' }}>
                          {account.owners.map((owner, idx) => (
                            <div key={idx} style={{ marginLeft: '0.5rem' }}>
                              <strong>{owner.legalEntity?.legalName || 'Unknown'}</strong> - {owner.ownershipPercentage.toFixed(2)}%
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : account.legalEntity ? (
                      <div className="detail-item">
                        <span className="label">Legal Entity:</span>
                        <strong>{account.legalEntity.legalName}</strong>
                      </div>
                    ) : null}
                    <div className="detail-item">
                      <span className="label">Account:</span>
                      <strong>{account.accountNumber}</strong>
                    </div>
                    {account.bsb && (
                      <div className="detail-item">
                        <span className="label">BSB:</span>
                        <strong>{account.bsb}</strong>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="label">Currency:</span>
                      <strong>{account.currency}</strong>
                    </div>
                  </div>
                  
                  <div className="account-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(account)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(account.id)}>Delete</button>
                  </div>
                </div>
                {account.notes && (
                  <div className="account-notes">{account.notes}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {loading && <div className="spinner" />}
    </div>
  );
};

export default BankAccountsPage;
