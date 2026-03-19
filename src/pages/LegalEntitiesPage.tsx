import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LegalEntity, LegalEntityInput } from '../types/LegalEntity';
import { legalEntityService, LegalEntityTypeOption } from '../services/legalEntityService';
import ScrollToTop from '../components/ScrollToTop';
import './LegalEntitiesPage.css';

const LegalEntitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [entities, setEntities] = useState<LegalEntity[]>([]);
  const [filteredEntities, setFilteredEntities] = useState<LegalEntity[]>([]);
  const [entityTypes, setEntityTypes] = useState<LegalEntityTypeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<LegalEntity | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    legalName: '',
    type: '',
    abn: '',
    acn: '',
    tfn: '',
  });

  const [formData, setFormData] = useState<LegalEntityInput>({
    legalName: '',
    type: 'individual',
    otherTypeDescription: '',
    abn: '',
    acn: '',
    tfn: '',
  });

  useEffect(() => {
    loadEntityTypes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entities, searchFilters]);

  const applyFilters = () => {
    let filtered = [...entities];

    if (searchFilters.legalName) {
      filtered = filtered.filter(e => 
        e.legalName.toLowerCase().includes(searchFilters.legalName.toLowerCase())
      );
    }

    if (searchFilters.type) {
      filtered = filtered.filter(e => e.type === searchFilters.type);
    }

    if (searchFilters.abn) {
      filtered = filtered.filter(e => 
        e.abn?.toLowerCase().includes(searchFilters.abn.toLowerCase())
      );
    }

    if (searchFilters.acn) {
      filtered = filtered.filter(e => 
        e.acn?.toLowerCase().includes(searchFilters.acn.toLowerCase())
      );
    }

    if (searchFilters.tfn) {
      filtered = filtered.filter(e => 
        e.tfn?.toLowerCase().includes(searchFilters.tfn.toLowerCase())
      );
    }

    setFilteredEntities(filtered);
  };

  const clearFilters = () => {
    setSearchFilters({
      legalName: '',
      type: '',
      abn: '',
      acn: '',
      tfn: '',
    });
  };

  const hasActiveFilters = () => {
    return Object.values(searchFilters).some(value => value !== '');
  };

  const loadEntityTypes = async () => {
    try {
      const types = await legalEntityService.getTypes();
      setEntityTypes(types);
    } catch (err) {
      console.error('Failed to load entity types:', err);
    }
  };

  const loadEntities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await legalEntityService.getAll();
      setEntities(data);
    } catch (err) {
      setError('Failed to load legal entities');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.type === 'other' && !formData.otherTypeDescription?.trim()) {
      setError('Description is required when type is "Other"');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingEntity) {
        await legalEntityService.update(editingEntity.id, formData);
      } else {
        await legalEntityService.create(formData);
      }

      await loadEntities();
      resetForm();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to save legal entity';
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entity: LegalEntity) => {
    setEditingEntity(entity);
    setFormData({
      legalName: entity.legalName,
      type: entity.type,
      otherTypeDescription: entity.otherTypeDescription || '',
      abn: entity.abn || '',
      acn: entity.acn || '',
      tfn: entity.tfn || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this legal entity?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await legalEntityService.delete(id);
      await loadEntities();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to delete legal entity';
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      legalName: '',
      type: 'individual',
      otherTypeDescription: '',
      abn: '',
      acn: '',
      tfn: '',
    });
    setEditingEntity(null);
    setShowForm(false);
  };

  // Members management functions
  const handleManageMembers = (entity: LegalEntity) => {
    navigate(`/legal-entities/${entity.id}/members`);
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'individual':
        return 'Individual';
      case 'company':
        return 'Company';
      case 'other':
        return 'Other';
      default:
        return type;
    }
  };

  return (
    <div className="legal-entities-page">
      <ScrollToTop />
      <div className="page-header">
        <h1>Legal Entities</h1>
        <div>
          {!showForm && (
            <>
              <button className="btn btn-secondary" onClick={loadEntities}>
                {entities.length === 0 ? 'Load Entities' : 'Refresh'}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowForm(true)}
                style={{ marginLeft: '1rem' }}
              >
                Add Legal Entity
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {!showForm && entities.length > 0 && (
        <div className="card search-filters">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsSearchExpanded(!isSearchExpanded)}>
            <h3>Search & Filter</h3>
            <span style={{ fontSize: '1.5rem' }}>{isSearchExpanded ? '▲' : '▼'}</span>
          </div>
          {isSearchExpanded && (
          <>
          <div className="form-grid" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>Legal Name</label>
              <input
                type="text"
                placeholder="Search by legal name..."
                value={searchFilters.legalName}
                onChange={(e) => setSearchFilters({ ...searchFilters, legalName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select
                value={searchFilters.type}
                onChange={(e) => setSearchFilters({ ...searchFilters, type: e.target.value })}
              >
                <option value="">All Types</option>
                {entityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>ABN</label>
              <input
                type="text"
                placeholder="Search by ABN..."
                value={searchFilters.abn}
                onChange={(e) => setSearchFilters({ ...searchFilters, abn: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>ACN</label>
              <input
                type="text"
                placeholder="Search by ACN..."
                value={searchFilters.acn}
                onChange={(e) => setSearchFilters({ ...searchFilters, acn: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>TFN</label>
              <input
                type="text"
                placeholder="Search by TFN..."
                value={searchFilters.tfn}
                onChange={(e) => setSearchFilters({ ...searchFilters, tfn: e.target.value })}
              />
            </div>
          </div>
          {hasActiveFilters() && (
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                Showing {filteredEntities.length} of {entities.length} entities
              </span>
              <button className="btn btn-secondary" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          )}
          </>
          )}
        </div>
      )}

      {showForm && (
        <div className="card">
          <h2>{editingEntity ? 'Edit Legal Entity' : 'Add New Legal Entity'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Legal Name *</label>
                <input
                  type="text"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  required
                  placeholder="Enter legal name"
                />
              </div>

              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    type: e.target.value,
                    otherTypeDescription: e.target.value !== 'other' ? '' : formData.otherTypeDescription
                  })}
                  required
                >
                  {entityTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.type === 'other' && (
                <div className="form-group full-width">
                  <label>Other Type Description * (max 200 characters)</label>
                  <input
                    type="text"
                    value={formData.otherTypeDescription}
                    onChange={(e) => setFormData({ ...formData, otherTypeDescription: e.target.value })}
                    required
                    maxLength={200}
                    placeholder="Describe the entity type"
                  />
                  <small>{formData.otherTypeDescription?.length || 0}/200 characters</small>
                </div>
              )}

              <div className="form-group">
                <label>ABN (Australian Business Number)</label>
                <input
                  type="text"
                  value={formData.abn}
                  onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
                  maxLength={20}
                  placeholder="e.g., 12 345 678 901"
                />
              </div>

              <div className="form-group">
                <label>ACN (Australian Company Number)</label>
                <input
                  type="text"
                  value={formData.acn}
                  onChange={(e) => setFormData({ ...formData, acn: e.target.value })}
                  maxLength={20}
                  placeholder="e.g., 123 456 789"
                />
              </div>

              <div className="form-group">
                <label>TFN (Tax File Number)</label>
                <input
                  type="text"
                  value={formData.tfn}
                  onChange={(e) => setFormData({ ...formData, tfn: e.target.value })}
                  maxLength={20}
                  placeholder="e.g., 123 456 789"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (editingEntity ? 'Update' : 'Create')}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {filteredEntities.length > 0 && (
        <div className="entities-list">
          {filteredEntities.map((entity) => (
            <div key={entity.id} className="card entity-card">
              <div className="entity-compact-layout">
                <div className="entity-main-info">
                  <div className="entity-title-row">
                    <h3>{entity.legalName}</h3>
                  </div>
                  <div className="entity-meta">
                    <span className={`type-badge type-${entity.type}`}>
                      {getTypeLabel(entity.type)}
                    </span>
                    {entity.type === 'other' && entity.otherTypeDescription && (
                      <>
                        <span className="separator">•</span>
                        <span className="other-description">{entity.otherTypeDescription}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="entity-details-inline">
                  {entity.abn && (
                    <div className="detail-item">
                      <span className="label">ABN:</span>
                      <strong>{entity.abn}</strong>
                    </div>
                  )}
                  {entity.acn && (
                    <div className="detail-item">
                      <span className="label">ACN:</span>
                      <strong>{entity.acn}</strong>
                    </div>
                  )}
                  {entity.tfn && (
                    <div className="detail-item">
                      <span className="label">TFN:</span>
                      <strong>{entity.tfn}</strong>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="label">Bank Accounts:</span>
                    <strong 
                      className="linked-count" 
                      onClick={() => navigate(`/bank-accounts?legalEntityId=${entity.id}`)}
                      style={{ cursor: entity.bankAccountsCount ? 'pointer' : 'default' }}
                    >
                      {entity.bankAccountsCount || 0}
                    </strong>
                  </div>
                  <div className="detail-item">
                    <span className="label">Assets:</span>
                    <strong 
                      className="linked-count" 
                      onClick={() => navigate(`/assets?legalEntityId=${entity.id}`)}
                      style={{ cursor: entity.assetsCount ? 'pointer' : 'default' }}
                    >
                      {entity.assetsCount || 0}
                    </strong>
                  </div>
                  {(entity.type === 'company' || entity.type === 'trust' || entity.type === 'smsf') && (
                    <div className="detail-item">
                      <span className="label">Members:</span>
                      <strong 
                        className="linked-count" 
                        onClick={() => navigate(`/legal-entities/${entity.id}/members`)}
                        style={{ cursor: entity.membersCount ? 'pointer' : 'default' }}
                      >
                        {entity.membersCount || 0}
                      </strong>
                    </div>
                  )}
                  {entity.createdAt && (
                    <div className="detail-item">
                      <span className="label">Created:</span>
                      <strong>{new Date(entity.createdAt).toLocaleDateString()}</strong>
                    </div>
                  )}
                </div>
                
                <div className="entity-actions">
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={() => handleEdit(entity)}
                  >
                    ✏️ Edit
                  </button>
                  {(entity.type === 'company' || entity.type === 'trust' || entity.type === 'smsf') && (
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => handleManageMembers(entity)}
                    >
                      👥 Members
                    </button>
                  )}
                  <button 
                    className="btn btn-danger btn-sm" 
                    onClick={() => handleDelete(entity.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && <div className="spinner" />}
    </div>
  );
};

export default LegalEntitiesPage;
