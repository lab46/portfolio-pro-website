import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { documentService, DocumentVerification } from '../services/documentService';
import { transactionService } from '../services/transactionService';
import { legalEntityService } from '../services/legalEntityService';
import { LegalEntity } from '../types/LegalEntity';
import ScrollToTop from '../components/ScrollToTop';
import './DocumentVerificationPage.css';

interface TransactionEdit {
  category: string;
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  legalEntityId?: string;
}

const DocumentVerificationPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get extracted bank account from navigation state (passed from process)
  const extractedBankAccountFromState = location.state?.extractedBankAccount;
  
  const [verification, setVerification] = useState<DocumentVerification | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [transactionEdits, setTransactionEdits] = useState<Map<string, TransactionEdit>>(new Map());
  const [approvedTransactions, setApprovedTransactions] = useState<Set<string>>(new Set());
  const [rejectedTransactions, setRejectedTransactions] = useState<Set<string>>(new Set());
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [showLikelyOnly, setShowLikelyOnly] = useState(true);
  const [isExtractedLinesCollapsed, setIsExtractedLinesCollapsed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadVerificationData();
    loadLegalEntities();
  }, [documentId]);

  const loadLegalEntities = async () => {
    try {
      const entities = await legalEntityService.getAll();
      // Filter for individual legal entities only
      const individuals = entities.filter(e => e.type === 'individual');
      setLegalEntities(individuals);
    } catch (err) {
      console.error('Failed to load legal entities:', err);
    }
  };

  const loadVerificationData = async () => {
    if (!documentId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await documentService.verifyDocument(documentId);
      
      // If we have extracted bank account from navigation state, use it instead of API response
      if (extractedBankAccountFromState) {
        data.extractedBankAccount = extractedBankAccountFromState;
      }
      
      setVerification(data);
      
      // Auto-select all non-duplicate transactions
      const nonDuplicates = new Set(
        data.transactions
          .filter(t => !t.isDuplicate)
          .map(t => t.id)
      );
      setSelectedTransactions(nonDuplicates);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to load verification data';
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const updateTransactionEdit = (transactionId: string, field: keyof TransactionEdit, value: any) => {
    const newEdits = new Map(transactionEdits);
    const currentEdit = newEdits.get(transactionId) || {
      category: getTransactionCategory(transactionId),
      amount: Math.abs(getTransactionAmount(transactionId)),
      type: getTransactionAmount(transactionId) >= 0 ? 'income' : 'expense'
    };
    newEdits.set(transactionId, { ...currentEdit, [field]: value });
    setTransactionEdits(newEdits);
  };

  const approveTransaction = (transactionId: string) => {
    const newApproved = new Set(approvedTransactions);
    const newRejected = new Set(rejectedTransactions);
    newApproved.add(transactionId);
    newRejected.delete(transactionId);
    setApprovedTransactions(newApproved);
    setRejectedTransactions(newRejected);
  };

  const rejectTransaction = (transactionId: string) => {
    const newApproved = new Set(approvedTransactions);
    const newRejected = new Set(rejectedTransactions);
    newRejected.add(transactionId);
    newApproved.delete(transactionId);
    setApprovedTransactions(newApproved);
    setRejectedTransactions(newRejected);
  };

  const getTransactionAmount = (transactionId: string): number => {
    const transaction = verification?.transactions.find(t => t.id === transactionId);
    return transaction?.amount || 0;
  };

  const getTransactionCategory = (transactionId: string): string => {
    const transaction = verification?.transactions.find(t => t.id === transactionId);
    return transaction?.category || '';
  };

  const handleApprove = async () => {
    if (!verification) return;
    
    // Verify we have extracted bank account information
    if (!verification.extractedBankAccount?.accountNumber) {
      setError('No bank account number found in the document. Cannot approve.');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Approve document with extracted account number
      await documentService.approveDocument(
        documentId!,
        verification.extractedBankAccount.accountNumber
      );
      
      // Update selected transactions to "verified" status
      const transactionsToApprove = verification.transactions.filter(t => 
        selectedTransactions.has(t.id)
      );
      
      for (const trans of transactionsToApprove) {
        const edit = transactionEdits.get(trans.id);
        const updateData: any = {
          status: 'verified'
        };
        
        // Apply any edits made during verification
        if (edit) {
          if (edit.category) updateData.category = edit.category;
          if (edit.description) updateData.description = edit.description;
          if (edit.legalEntityId) updateData.legal_entity_id = edit.legalEntityId;
          if (edit.amount !== undefined) {
            updateData.amount = edit.type === 'expense' ? -Math.abs(edit.amount) : Math.abs(edit.amount);
          }
        }
        
        await transactionService.update(trans.id, updateData);
      }
      
      // Delete unselected transactions (rejected)
      const transactionsToDelete = verification.transactions.filter(t => 
        !selectedTransactions.has(t.id)
      );
      
      for (const trans of transactionsToDelete) {
        await transactionService.delete(trans.id);
      }
      
      // Navigate to transactions page
      navigate('/transactions', { 
        state: { 
          message: `Successfully verified ${transactionsToApprove.length} transactions` 
        } 
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to save verification';
      setError(errorMsg);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="verification-page">
        <div className="loading">Loading verification data...</div>
      </div>
    );
  }

  if (error && !verification) {
    return (
      <div className="verification-page">
        <div className="error-message">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/documents')}>
          Back to Documents
        </button>
      </div>
    );
  }

  if (!verification) {
    return null;
  }

  return (
    <div className="verification-page">
      <ScrollToTop />
      <div className="page-header">
        <h1>Verify Extracted Transactions</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/documents')}>
          Back to Documents
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {verification.duplicateWarning && (
        <div className="warning-message">
          ⚠️ {verification.duplicateWarning}
        </div>
      )}

      <div className="verification-summary">
        <div className="summary-card">
          <h3>Document Information</h3>
          <div className="info-row">
            <span className="label">Filename:</span>
            <span className="value">{verification.document.filename}</span>
          </div>
          <div className="info-row">
            <span className="label">Document Type:</span>
            <span className="value">{verification.document.documentType.replace('_', ' ').toUpperCase()}</span>
          </div>
          <div className="info-row">
            <span className="label">Status:</span>
            <span className={`badge badge-${verification.document.status}`}>
              {verification.document.status}
            </span>
          </div>
        </div>

        {verification.bankAccount && (
          <div className="summary-card">
            <h3>Bank Account</h3>
            <div className="info-row">
              <span className="label">Account:</span>
              <span className="value">{verification.bankAccount.accountName}</span>
            </div>
            <div className="info-row">
              <span className="label">Bank:</span>
              <span className="value">{verification.bankAccount.bankName}</span>
            </div>
          </div>
        )}

        {verification.extractedBankAccount && (
          <div className="summary-card">
            <h3>📄 Extracted Bank Account</h3>
            {verification.extractedBankAccount.bankName && (
              <div className="info-row">
                <span className="label">Bank:</span>
                <span className="value">{verification.extractedBankAccount.bankName}</span>
              </div>
            )}
            {verification.extractedBankAccount.accountName && (
              <div className="info-row">
                <span className="label">Account Name:</span>
                <span className="value">{verification.extractedBankAccount.accountName}</span>
              </div>
            )}
            {verification.extractedBankAccount.accountNumber && (
              <div className="info-row">
                <span className="label">Account Number:</span>
                <span className="value highlight">{verification.extractedBankAccount.accountNumber}</span>
              </div>
            )}
            {verification.extractedBankAccount.bsb && (
              <div className="info-row">
                <span className="label">BSB:</span>
                <span className="value">{verification.extractedBankAccount.bsb}</span>
              </div>
            )}
          </div>
        )}

        <div className="summary-card">
          <h3>Extraction Summary</h3>
          <div className="info-row">
            <span className="label">Total Lines Extracted:</span>
            <span className="value">{verification.extractedLines?.length || 0}</span>
          </div>
          <div className="info-row">
            <span className="label">Likely Transactions:</span>
            <span className="value">
              {verification.extractedLines?.filter(l => l.isLikelyTransaction).length || 0}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Auto-processed Transactions:</span>
            <span className="value">{verification.transactions.length}</span>
          </div>
          <div className="info-row">
            <span className="label">Selected:</span>
            <span className="value highlight">{selectedTransactions.size}</span>
          </div>
          <div className="info-row">
            <span className="label">Duplicates Found:</span>
            <span className="value warning">
              {verification.transactions.filter(t => t.isDuplicate).length}
            </span>
          </div>
        </div>
      </div>

      {verification.extractedLines && verification.extractedLines.length > 0 && (
        <div className="extracted-lines-section">
          <h2>
            All Extracted Lines
            <button 
              className="collapse-toggle"
              onClick={() => setIsExtractedLinesCollapsed(!isExtractedLinesCollapsed)}
              aria-label="Toggle extracted lines"
            >
              {isExtractedLinesCollapsed ? '▶' : '▼'}
            </button>
            <span className="subtitle">
              Review all text lines extracted from the document. Lines highlighted are likely transactions.
            </span>
          </h2>
          
          {!isExtractedLinesCollapsed && (
          <>
          <div className="lines-filters">
            <button 
              className={`btn btn-sm ${showLikelyOnly ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowLikelyOnly(true)}
            >
              Show Likely Transactions Only ({verification.extractedLines.filter(l => l.isLikelyTransaction).length})
            </button>
            <button 
              className={`btn btn-sm ${!showLikelyOnly ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowLikelyOnly(false)}
            >
              Show All Lines ({verification.extractedLines.length})
            </button>
          </div>

          <div className="extracted-lines-list">
            {verification.extractedLines
              .filter(line => !showLikelyOnly || line.isLikelyTransaction)
              .map((line) => (
              <div 
                key={line.id} 
                className={`extracted-line ${line.isLikelyTransaction ? 'likely-transaction' : ''}`}
              >
                <div className="line-number">#{line.lineNumber}</div>
                <div className="line-content">{line.content}</div>
                {line.informationType && (
                  <div className="line-indicators">
                    <span className="indicator info-type-indicator">
                      {line.informationType === 'Account Information' ? '🏦' : 
                       line.informationType === 'Transaction' ? '💳' : '📄'} {line.informationType}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          </>
          )}
        </div>
      )}

      <div className="transactions-verification">
        <h2>
          Review Transactions
          <span className="subtitle">
            Select transactions to import. Duplicates are automatically deselected.
          </span>
        </h2>

        {verification.transactions.length === 0 ? (
          <div className="no-transactions">
            No transactions were extracted from this document.
          </div>
        ) : (
          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedTransactions.size === verification.transactions.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTransactions(new Set(verification.transactions.map(t => t.id)));
                        } else {
                          setSelectedTransactions(new Set());
                        }
                      }}
                    />
                  </th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {verification.transactions.map((transaction) => {
                  const edit = transactionEdits.get(transaction.id);
                  const currentAmount = edit?.amount || Math.abs(transaction.amount);
                  const currentType = edit?.type || (transaction.amount >= 0 ? 'income' : 'expense');
                  const currentCategory = edit?.category || transaction.category || '';
                  const currentDescription = edit?.description || transaction.description;
                  const currentLegalEntityId = edit?.legalEntityId || '';
                  const isApproved = approvedTransactions.has(transaction.id);
                  const isRejected = rejectedTransactions.has(transaction.id);

                  return (
                    <tr
                      key={transaction.id}
                      className={`
                        ${selectedTransactions.has(transaction.id) ? 'selected' : ''}
                        ${transaction.isDuplicate ? 'duplicate' : ''}
                        ${isApproved ? 'approved' : ''}
                        ${isRejected ? 'rejected' : ''}
                      `}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedTransactions.has(transaction.id)}
                          onChange={() => toggleTransaction(transaction.id)}
                        />
                      </td>
                      <td>{formatDate(transaction.date)}</td>
                      <td>
                        <textarea
                          value={currentDescription}
                          onChange={(e) => updateTransactionEdit(transaction.id, 'description', e.target.value)}
                          className="description-input"
                          rows={2}
                        />
                        {transaction.isDuplicate && (
                          <span className="duplicate-badge">
                            ⚠️ Possible Duplicate
                          </span>
                        )}
                      </td>
                      <td>
                        <select
                          value={currentCategory}
                          onChange={(e) => updateTransactionEdit(transaction.id, 'category', e.target.value)}
                          className="category-select"
                        >
                          <option value="">Select...</option>
                          <option value="Income">Income</option>
                          <option value="Expense">Expense</option>
                          <option value="Transfer">Transfer</option>
                          <option value="Groceries">Groceries</option>
                          <option value="Dining & Takeout">Dining & Takeout</option>
                          <option value="Fuel">Fuel</option>
                          <option value="Transport">Transport</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Phone & Internet">Phone & Internet</option>
                          <option value="Shopping">Shopping</option>
                          <option value="ATM Withdrawal">ATM Withdrawal</option>
                          <option value="Real Estate">Real Estate</option>
                          <option value="Vehicle">Vehicle</option>
                          <option value="Stocks">Stocks</option>
                          <option value="Legal Fees">Legal Fees</option>
                          <option value="Investment Fund">Investment Fund</option>
                          <option value="Insurance">Insurance</option>
                          <option value="Management Fees">Management Fees</option>
                          <option value="Super Contribution">Super Contribution</option>
                          <option value="Uncategorized">Uncategorized</option>
                          <option value="__custom__">Custom...</option>
                          {currentCategory && !['Income', 'Expense', 'Transfer', 'Groceries', 'Dining & Takeout', 'Fuel', 'Transport', 'Utilities', 'Phone & Internet', 'Shopping', 'ATM Withdrawal', 'Real Estate', 'Vehicle', 'Stocks', 'Legal Fees', 'Investment Fund', 'Insurance', 'Management Fees', 'Super Contribution', 'Uncategorized', '__custom__', ''].includes(currentCategory) && (
                            <option value={currentCategory}>{currentCategory}</option>
                          )}
                        </select>
                        {currentCategory === 'Super Contribution' && (
                          <select
                            value={currentLegalEntityId}
                            onChange={(e) => updateTransactionEdit(transaction.id, 'legalEntityId', e.target.value)}
                            className="legal-entity-select"
                          >
                            <option value="">Select Individual...</option>
                            {legalEntities.map((entity) => (
                              <option key={entity.id} value={entity.id}>
                                {entity.legalName}
                              </option>
                            ))}
                          </select>
                        )}
                        {currentCategory === '__custom__' && (
                          <input
                            type="text"
                            placeholder="Enter custom category"
                            onChange={(e) => updateTransactionEdit(transaction.id, 'category', e.target.value)}
                            className="category-input"
                            autoFocus
                          />
                        )}
                      </td>
                      <td>
                        {currentType === 'expense' ? (
                          <span className="amount-label debit">
                            -{currentAmount.toFixed(2)}
                          </span>
                        ) : (
                          <span className="amount-display">-</span>
                        )}
                      </td>
                      <td>
                        {currentType === 'income' ? (
                          <span className="amount-label credit">
                            +{currentAmount.toFixed(2)}
                          </span>
                        ) : (
                          <span className="amount-display">-</span>
                        )}
                      </td>
                      <td>
                        <div className="transaction-actions">
                          <label className="type-toggle">
                            <input
                              type="radio"
                              name={`type-${transaction.id}`}
                              checked={currentType === 'expense'}
                              onChange={() => updateTransactionEdit(transaction.id, 'type', 'expense')}
                            />
                            <span>Dr</span>
                          </label>
                          <label className="type-toggle">
                            <input
                              type="radio"
                              name={`type-${transaction.id}`}
                              checked={currentType === 'income'}
                              onChange={() => updateTransactionEdit(transaction.id, 'type', 'income')}
                            />
                            <span>Cr</span>
                          </label>
                          <button
                            onClick={() => approveTransaction(transaction.id)}
                            className={`btn-approve ${isApproved ? 'active' : ''}`}
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => rejectTransaction(transaction.id)}
                            className={`btn-reject ${isRejected ? 'active' : ''}`}
                            title="Reject"
                          >
                            ✗
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="verification-actions">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/documents')}
          disabled={saving}
        >
          Cancel
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleApprove}
          disabled={saving || selectedTransactions.size === 0}
        >
          {saving ? 'Saving...' : `Approve ${selectedTransactions.size} Transactions`}
        </button>
      </div>
    </div>
  );
};

export default DocumentVerificationPage;
