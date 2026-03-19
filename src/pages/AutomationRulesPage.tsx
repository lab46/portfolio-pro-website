import React, { useState, useEffect } from 'react';
import * as automationRuleService from '../services/automationRuleService';
import { legalEntityService } from '../services/legalEntityService';
import { bankAccountService } from '../services/bankAccountService';
import type { AutomationRule, AutomationRuleCreate, RulePattern } from '../types/AutomationRule';
import type { LegalEntity } from '../types/LegalEntity';
import type { BankAccount } from '../types/BankAccount';
import './AutomationRulesPage.css';

const AutomationRulesPage: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [applyingRules, setApplyingRules] = useState(false);

  // Form state
  const [formData, setFormData] = useState<AutomationRuleCreate>({
    categorizationRules: {
      patterns: [{ field: 'description', contains: '', caseInsensitive: true }],
      category: '',
    },
    enabled: true,
    operator: 'AND',
    bankAccountId: null,
    assetId: null,
    legalEntityId: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesData, entitiesData, accountsData] = await Promise.all([
        automationRuleService.getAllRules(),
        legalEntityService.getAll(),
        bankAccountService.getAll(),
      ]);
      setRules(rulesData);
      setLegalEntities(entitiesData);
      setBankAccounts(accountsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load automation rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      await automationRuleService.createRule(formData);
      alert('Automation rule created successfully');
      setShowCreateForm(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to create rule:', error);
      alert('Failed to create automation rule');
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule) return;
    try {
      await automationRuleService.updateRule(editingRule.id, formData);
      alert('Automation rule updated successfully');
      setEditingRule(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to update rule:', error);
      alert('Failed to update automation rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;
    try {
      await automationRuleService.deleteRule(id);
      alert('Automation rule deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete rule:', error);
      alert('Failed to delete automation rule');
    }
  };

  const handleToggleEnabled = async (rule: AutomationRule) => {
    try {
      if (rule.enabled) {
        await automationRuleService.disableRule(rule.id);
      } else {
        await automationRuleService.enableRule(rule.id);
      }
      loadData();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      alert('Failed to toggle automation rule');
    }
  };

  const handleApplyRulesToAll = async () => {
    if (!confirm('Apply all enabled automation rules to ALL transactions? This may update many transactions.')) return;
    try {
      setApplyingRules(true);
      const result = await automationRuleService.applyRulesToAll();
      alert(`${result.message}\nProcessed: ${result.processed} transactions`);
    } catch (error) {
      console.error('Failed to apply rules:', error);
      alert('Failed to apply automation rules');
    } finally {
      setApplyingRules(false);
    }
  };

  const resetForm = () => {
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
  };

  const startEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      categorizationRules: rule.categorizationRules,
      enabled: rule.enabled,
      bankAccountId: rule.bankAccountId,
      assetId: rule.assetId,
      legalEntityId: rule.legalEntityId,
    });
    setShowCreateForm(true);
  };

  const addPattern = () => {
    setFormData({
      ...formData,
      categorizationRules: {
        ...formData.categorizationRules!,
        patterns: [
          ...(formData.categorizationRules?.patterns || []),
          { field: 'description', contains: '', caseInsensitive: true },
        ],
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

  const updatePattern = (index: number, pattern: RulePattern) => {
    const patterns = [...(formData.categorizationRules?.patterns || [])];
    patterns[index] = pattern;
    setFormData({
      ...formData,
      categorizationRules: {
        ...formData.categorizationRules!,
        patterns,
      },
    });
  };

  const getLegalEntityName = (id: string | null): string => {
    if (!id) return 'None';
    const entity = legalEntities.find(e => e.id === id);
    return entity ? entity.legalName : 'Unknown';
  };

  const getBankAccountName = (id: string | null): string => {
    if (!id) return 'All accounts';
    const account = bankAccounts.find(a => a.id === id);
    return account ? account.accountName || account.accountNumber : 'Unknown';
  };

  if (loading) {
    return (
      <div className="automation-rules-page">
        <div className="loading">Loading automation rules...</div>
      </div>
    );
  }

  return (
    <div className="automation-rules-page">
      <div className="page-header">
        <h1>Automation Rules</h1>
        <div className="header-actions">
          <button 
            className="secondary-button" 
            onClick={handleApplyRulesToAll}
            disabled={applyingRules}
          >
            {applyingRules ? 'Applying...' : 'Apply Rules to All Transactions'}
          </button>
          <button 
            className="primary-button" 
            onClick={() => setShowCreateForm(true)}
          >
            Create New Rule
          </button>
        </div>
      </div>

      <div className="rules-info">
        <p>
          Automation rules automatically categorize transactions and assign them to legal entities 
          based on text patterns. Rules are applied in order, and only the first matching rule is used.
        </p>
      </div>

      {(showCreateForm || editingRule) && (
        <div className="rule-form-card">
          <h2>{editingRule ? 'Edit Rule' : 'Create New Rule'}</h2>
          
          <div className="form-group">
            <label>Rule Status</label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              />
              Enabled
            </label>
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
            <label>Assign to Legal Entity</label>
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
            <small className="form-hint">Use "Internal Transfer" for transfers between accounts of the same entity</small>
          </div>

          <div className="form-group">
            <label>Category (Optional)</label>
            <input
              type="text"
              value={formData.categorizationRules?.category || ''}
              onChange={(e) => setFormData({
                ...formData,
                categorizationRules: {
                  ...formData.categorizationRules!,
                  category: e.target.value,
                },
              })}
              placeholder="e.g., Super Contribution, Salary, etc."
            />
          </div>

          <div className="patterns-section">
            <div className="patterns-header">
              <label>Matching Patterns</label>
              <button type="button" onClick={addPattern} className="add-pattern-button">
                + Add Pattern
              </button>
            </div>

            {formData.categorizationRules?.patterns.map((pattern, index) => (
              <div key={index} className="pattern-card">
                <div className="pattern-row">
                  <select
                    value={pattern.field}
                    onChange={(e) => updatePattern(index, { ...pattern, field: e.target.value as any })}
                  >
                    <option value="description">Description</option>
                    <option value="category">Category</option>
                    <option value="amount">Amount</option>
                  </select>

                  {pattern.field !== 'amount' && (
                    <>
                      <input
                        type="text"
                        value={pattern.contains || ''}
                        onChange={(e) => updatePattern(index, { ...pattern, contains: e.target.value })}
                        placeholder="Text to search for"
                      />
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={pattern.caseInsensitive}
                          onChange={(e) => updatePattern(index, { ...pattern, caseInsensitive: e.target.checked })}
                        />
                        Case insensitive
                      </label>
                    </>
                  )}

                  {pattern.field === 'amount' && (
                    <>
                      <input
                        type="number"
                        value={pattern.minAmount || ''}
                        onChange={(e) => updatePattern(index, { ...pattern, minAmount: parseFloat(e.target.value) })}
                        placeholder="Min amount"
                      />
                      <input
                        type="number"
                        value={pattern.maxAmount || ''}
                        onChange={(e) => updatePattern(index, { ...pattern, maxAmount: parseFloat(e.target.value) })}
                        placeholder="Max amount"
                      />
                    </>
                  )}

                  {formData.categorizationRules!.patterns.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePattern(index)}
                      className="remove-pattern-button"
                    >
                      ✕
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
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setShowCreateForm(false);
                setEditingRule(null);
                resetForm();
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={editingRule ? handleUpdateRule : handleCreateRule}
            >
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </div>
      )}

      <div className="rules-list">
        {rules.length === 0 ? (
          <div className="empty-state">
            <p>No automation rules yet. Create one to automatically categorize and assign transactions.</p>
          </div>
        ) : (
          rules.map(rule => (
            <div key={rule.id} className={`rule-card ${!rule.enabled ? 'disabled' : ''}`}>
              <div className="rule-header">
                <div className="rule-status">
                  {rule.enabled ? (
                    <span className="status-badge enabled">Enabled</span>
                  ) : (
                    <span className="status-badge disabled">Disabled</span>
                  )}
                  {rule.categorizationRules?.patterns && rule.categorizationRules.patterns.length > 1 && (
                    <span className={`operator-badge ${rule.operator || 'AND'}`}>
                      {rule.operator || 'AND'}
                    </span>
                  )}
                </div>
                <div className="rule-actions">
                  <button onClick={() => handleToggleEnabled(rule)} className="icon-button">
                    {rule.enabled ? '⏸' : '▶'}
                  </button>
                  <button onClick={() => startEdit(rule)} className="icon-button">✏️</button>
                  <button onClick={() => handleDeleteRule(rule.id)} className="icon-button">🗑️</button>
                </div>
              </div>

              <div className="rule-body">
                <div className="rule-info">
                  <strong>Bank Account:</strong> {getBankAccountName(rule.bankAccountId)}
                </div>
                {rule.legalEntityId && (
                  <div className="rule-info">
                    <strong>Assigns to:</strong> {getLegalEntityName(rule.legalEntityId)}
                  </div>
                )}
                {rule.categorizationRules?.category && (
                  <div className="rule-info">
                    <strong>Category:</strong> {rule.categorizationRules.category}
                  </div>
                )}
                {rule.transactionType && (
                  <div className="rule-info">
                    <strong>Transaction Type:</strong> 
                    <span className={`transaction-type-badge ${rule.transactionType}`}>
                      {rule.transactionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                )}

                <div className="patterns-display">
                  <strong>Matching Patterns:</strong>
                  <ul>
                    {rule.categorizationRules?.patterns.map((pattern, index) => (
                      <React.Fragment key={index}>
                        <li>
                          <span className="pattern-field">{pattern.field}</span>
                          {pattern.contains && (
                            <span>
                              {' contains "'}
                              <code>{pattern.contains}</code>
                              {'"'}
                              {pattern.caseInsensitive && ' (case insensitive)'}
                            </span>
                          )}
                          {pattern.regex && (
                            <span>
                              {' matches regex '}
                              <code>{pattern.regex}</code>
                            </span>
                          )}
                          {pattern.minAmount !== undefined && (
                            <span> ≥ ${pattern.minAmount}</span>
                          )}
                          {pattern.maxAmount !== undefined && (
                            <span> ≤ ${pattern.maxAmount}</span>
                          )}
                        </li>
                        {index < rule.categorizationRules!.patterns.length - 1 && (
                          <div className="pattern-operator-display">
                            <span className={`operator-badge ${pattern.operator || 'AND'}`}>
                              {pattern.operator || 'AND'}
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AutomationRulesPage;
