import React, { useState, useEffect } from 'react';
import type { AutomationRuleCreate, RulePattern } from '../types/AutomationRule';
import type { LegalEntity } from '../types/LegalEntity';
import type { BankAccount } from '../types/BankAccount';
import './AutomationRuleModal.css';

interface AutomationRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: AutomationRuleCreate) => Promise<void>;
  legalEntities: LegalEntity[];
  bankAccounts: BankAccount[];
  prefillData?: {
    description?: string;
    amount?: number;
    bankAccountId?: string;
  };
}

const AutomationRuleModal: React.FC<AutomationRuleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  legalEntities,
  bankAccounts,
  prefillData,
}) => {
  const [formData, setFormData] = useState<AutomationRuleCreate>({
    categorizationRules: {
      patterns: [{ field: 'description', contains: '', caseInsensitive: true }],
      category: '',
    },
    enabled: true,
    bankAccountId: null,
    assetId: null,
    legalEntityId: null,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && prefillData) {
      const patterns: RulePattern[] = [];
      
      if (prefillData.description) {
        patterns.push({
          field: 'description',
          contains: prefillData.description,
          caseInsensitive: true,
        });
      }
      
      if (prefillData.amount !== undefined) {
        patterns.push({
          field: 'amount',
          minAmount: Math.abs(prefillData.amount) * 0.95,
          maxAmount: Math.abs(prefillData.amount) * 1.05,
        });
      }

      setFormData(prev => ({
        ...prev,
        categorizationRules: {
          patterns: patterns.length > 0 ? patterns : prev.categorizationRules!.patterns,
          category: prev.categorizationRules?.category || '',
        },
        bankAccountId: prefillData.bankAccountId || null,
      }));
    }
  }, [isOpen, prefillData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(formData);
      onClose();
      // Reset form
      setFormData({
        categorizationRules: {
          patterns: [{ field: 'description', contains: '', caseInsensitive: true }],
          category: '',
        },
        enabled: true,
        bankAccountId: null,
        assetId: null,
        legalEntityId: null,
      });
    } catch (error) {
      console.error('Failed to save rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const addPattern = () => {
    const newPattern: RulePattern = { field: 'description', contains: '', caseInsensitive: true };
    setFormData({
      ...formData,
      categorizationRules: {
        ...formData.categorizationRules!,
        patterns: [...(formData.categorizationRules?.patterns || []), newPattern],
      },
    });
  };

  const removePattern = (index: number) => {
    const patterns = [...(formData.categorizationRules?.patterns || [])];
    patterns.splice(index, 1);
    setFormData({
      ...formData,
      categorizationRules: {
        ...formData.categorizationRules!,
        patterns,
      },
    });
  };

  const updatePattern = (index: number, updates: Partial<RulePattern>) => {
    const patterns = [...(formData.categorizationRules?.patterns || [])];
    patterns[index] = { ...patterns[index], ...updates };
    setFormData({
      ...formData,
      categorizationRules: {
        ...formData.categorizationRules!,
        patterns,
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Automation Rule</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-section">
            <h3>Patterns</h3>
            <p className="section-hint">Define conditions that must match for this rule to apply</p>
            
            {formData.categorizationRules?.patterns.map((pattern, index) => (
              <div key={index} className="pattern-card">
                <div className="pattern-row">
                  <select
                    value={pattern.field}
                    onChange={(e) => updatePattern(index, { field: e.target.value as any })}
                  >
                    <option value="description">Description</option>
                    <option value="category">Category</option>
                    <option value="amount">Amount</option>
                  </select>

                  {pattern.field === 'description' || pattern.field === 'category' ? (
                    <>
                      <input
                        type="text"
                        placeholder="Search text..."
                        value={pattern.contains || ''}
                        onChange={(e) => updatePattern(index, { contains: e.target.value })}
                      />
                      <label>
                        <input
                          type="checkbox"
                          checked={pattern.caseInsensitive !== false}
                          onChange={(e) => updatePattern(index, { caseInsensitive: e.target.checked })}
                        />
                        Case insensitive
                      </label>
                    </>
                  ) : (
                    <>
                      <input
                        type="number"
                        placeholder="Min amount"
                        value={pattern.minAmount || ''}
                        onChange={(e) => updatePattern(index, { minAmount: parseFloat(e.target.value) || undefined })}
                      />
                      <input
                        type="number"
                        placeholder="Max amount"
                        value={pattern.maxAmount || ''}
                        onChange={(e) => updatePattern(index, { maxAmount: parseFloat(e.target.value) || undefined })}
                      />
                    </>
                  )}

                  {formData.categorizationRules!.patterns.length > 1 && (
                    <button
                      className="remove-pattern-btn"
                      onClick={() => removePattern(index)}
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Operator selector for all patterns except the last one */}
                {index < formData.categorizationRules!.patterns.length - 1 && (
                  <div className="pattern-operator">
                    <select
                      value={pattern.operator || 'AND'}
                      onChange={(e) => updatePattern(index, { ...pattern, operator: e.target.value as 'AND' | 'OR' })}
                      className="operator-select"
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                    <small className="operator-hint">
                      {pattern.operator === 'OR' 
                        ? 'This pattern OR next pattern must match' 
                        : 'This pattern AND next pattern must both match'}
                    </small>
                  </div>
                )}
              </div>
            ))}

            <button className="add-pattern-btn" onClick={addPattern}>
              + Add Pattern
            </button>
          </div>

          <div className="form-group">
            <label>Category (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Groceries, Utilities"
              value={formData.categorizationRules?.category || ''}
              onChange={(e) => setFormData({
                ...formData,
                categorizationRules: {
                  ...formData.categorizationRules!,
                  category: e.target.value,
                },
              })}
            />
          </div>

          <div className="form-group">
            <label>Bank Account (Optional)</label>
            <select
              value={formData.bankAccountId || ''}
              onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value || null })}
            >
              <option value="">All bank accounts</option>
              {bankAccounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.accountName || account.accountNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Assign to Legal Entity (Optional)</label>
            <select
              value={formData.legalEntityId || ''}
              onChange={(e) => setFormData({ ...formData, legalEntityId: e.target.value || null })}
            >
              <option value="">None</option>
              {legalEntities.map(entity => (
                <option key={entity.id} value={entity.id}>
                  {entity.legalName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Transaction Type (Optional)</label>
            <select
              value={formData.transactionType || ''}
              onChange={(e) => setFormData({
                ...formData,
                transactionType: (e.target.value || null) as any,
              })}
            >
              <option value="">-- Select Transaction Type --</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="internal_transfer">Internal Transfer</option>
              <option value="investment">Investment</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Creating...' : 'Create Rule'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutomationRuleModal;
