import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { assetService } from '../services/assetService';
import { legalEntityService } from '../services/legalEntityService';
import { Asset, AssetInput } from '../types/Asset';
import { LegalEntity } from '../types/LegalEntity';
import ScrollToTop from '../components/ScrollToTop';
import './AssetsPage.css';

const AssetsPage = () => {
  const [searchParams] = useSearchParams();
  const filterLegalEntityId = searchParams.get('legalEntityId');
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    name: '',
    category: '',
    legalEntityId: '',
  });
  const [formData, setFormData] = useState<AssetInput>({
    name: '',
    description: '',
    category: '',
    purchaseCost: 0,
    attributes: '',
    legalEntityId: undefined,
    isJointOwnership: false,
    owners: [],
    renovationCosts: undefined,
    stampDuty: undefined,
    legalFees: undefined,
    inspectionFees: undefined,
    agentFees: undefined,
    otherFees: undefined,
  });

  // Set legalEntityId filter from URL params
  useEffect(() => {
    if (filterLegalEntityId) {
      setSearchFilters(prev => ({ ...prev, legalEntityId: filterLegalEntityId }));
    }
  }, [filterLegalEntityId]);

  // Apply filters whenever assets or searchFilters change
  useEffect(() => {
    applyFilters();
  }, [assets, searchFilters]);

  const applyFilters = () => {
    let filtered = [...assets];

    if (searchFilters.name) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchFilters.name.toLowerCase())
      );
    }

    if (searchFilters.category) {
      filtered = filtered.filter(asset =>
        asset.category && asset.category.toLowerCase().includes(searchFilters.category.toLowerCase())
      );
    }

    if (searchFilters.legalEntityId) {
      filtered = filtered.filter(asset =>
        asset.legalEntityId === searchFilters.legalEntityId
      );
    }

    setFilteredAssets(filtered);
  };

  const clearFilters = () => {
    setSearchFilters({
      name: '',
      category: '',
      legalEntityId: '',
    });
  };

  const hasActiveFilters = () => {
    return searchFilters.name !== '' ||
           searchFilters.category !== '' ||
           searchFilters.legalEntityId !== '';
  };

  const loadAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assetService.getAll();
      setAssets(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load assets');
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
    await Promise.all([loadAssets(), loadLegalEntities()]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editingAsset) {
        await assetService.update(editingAsset.id, formData);
      } else {
        await assetService.create(formData);
      }
      setShowForm(false);
      setEditingAsset(null);
      resetForm();
      await loadAssets();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      description: asset.description || '',
      category: asset.category || '',
      purchaseCost: asset.purchaseCost,
      attributes: asset.attributes || '',
      legalEntityId: asset.legalEntityId,
      isJointOwnership: asset.isJointOwnership,
      owners: asset.owners?.map(owner => ({
        legalEntityId: owner.legalEntityId,
        ownershipPercentage: owner.ownershipPercentage
      })) || [],
      renovationCosts: asset.renovationCosts,
      stampDuty: asset.stampDuty,
      legalFees: asset.legalFees,
      inspectionFees: asset.inspectionFees,
      agentFees: asset.agentFees,
      otherFees: asset.otherFees,
    });
    setShowForm(true);
    // Load legal entities if not already loaded
    if (legalEntities.length === 0) {
      loadLegalEntities();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    
    setLoading(true);
    setError(null);
    try {
      await assetService.delete(id);
      await loadAssets();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete asset');
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

  const handleJointOwnershipChange = (isJoint: boolean) => {
    if (isJoint) {
      // Initialize with 2 owners at 50% each
      setFormData({
        ...formData,
        isJointOwnership: true,
        legalEntityId: undefined,
        owners: [
          { legalEntityId: '', ownershipPercentage: 50 },
          { legalEntityId: '', ownershipPercentage: 50 }
        ]
      });
    } else {
      setFormData({
        ...formData,
        isJointOwnership: false,
        owners: []
      });
    }
  };

  // Get only individual legal entities for joint ownership
  const individualEntities = legalEntities.filter(entity => entity.type === 'individual');

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      purchaseCost: 0,
      attributes: '',
      legalEntityId: undefined,
      isJointOwnership: false,
      owners: [],
      renovationCosts: undefined,
      stampDuty: undefined,
      legalFees: undefined,
      inspectionFees: undefined,
      agentFees: undefined,
      otherFees: undefined,
    });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingAsset(null);
    resetForm();
  };

  return (
    <div className="assets-page">
      <ScrollToTop />
      <div className="page-header">
        <h1>Assets</h1>
        <div>
          {!showForm && (
            <>
              <button className="btn btn-secondary" onClick={loadAllData}>
                {assets.length === 0 ? 'Load Assets' : 'Refresh'}
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
                Add Asset
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
            <label>Name</label>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchFilters.name}
              onChange={(e) => setSearchFilters({ ...searchFilters, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              placeholder="Search by category..."
              value={searchFilters.category}
              onChange={(e) => setSearchFilters({ ...searchFilters, category: e.target.value })}
            />
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
        </div>
        {hasActiveFilters() && (
          <button type="button" className="button-secondary" onClick={clearFilters} style={{ marginTop: '1rem' }}>
            Clear Filters
          </button>
        )}
        <p style={{ marginTop: '1rem', color: '#888' }}>
          Showing {filteredAssets.length} of {assets.length} assets
        </p>
        </>
        )}
      </div>

      {showForm && (
        <div className="card">
          <h2>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Legal Entity (Optional)</label>
                <select
                  value={formData.legalEntityId || ''}
                  onChange={(e) => setFormData({ ...formData, legalEntityId: e.target.value || undefined })}
                  disabled={formData.isJointOwnership}
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
                    checked={formData.isJointOwnership}
                    onChange={(e) => handleJointOwnershipChange(e.target.checked)}
                    style={{ width: 'auto', height: 'auto' }}
                  />
                  Joint Ownership
                </label>
              </div>

              {/* Joint Owners Section */}
              {formData.isJointOwnership && (
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
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Stocks">Stocks</option>
                  <option value="Bonds">Bonds</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Commodities">Commodities</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Purchase Cost *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchaseCost}
                  onChange={(e) => setFormData({ ...formData, purchaseCost: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Brief description of the asset"
                />
              </div>
              <div className="form-group full-width">
                <label>Attributes (JSON)</label>
                <textarea
                  value={formData.attributes}
                  onChange={(e) => setFormData({ ...formData, attributes: e.target.value })}
                  rows={3}
                  placeholder='{"quantity": 100, "ticker": "AAPL"}'
                />
              </div>
              
              {/* Real Estate specific fields */}
              {formData.category === 'Real Estate' && (
                <>
                  <div className="form-group">
                    <label>Renovation Costs</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.renovationCosts || ''}
                      onChange={(e) => setFormData({ ...formData, renovationCosts: parseFloat(e.target.value) || undefined })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Stamp Duty</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.stampDuty || ''}
                      onChange={(e) => setFormData({ ...formData, stampDuty: parseFloat(e.target.value) || undefined })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Legal Fees</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.legalFees || ''}
                      onChange={(e) => setFormData({ ...formData, legalFees: parseFloat(e.target.value) || undefined })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Inspection Fees</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.inspectionFees || ''}
                      onChange={(e) => setFormData({ ...formData, inspectionFees: parseFloat(e.target.value) || undefined })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Agent Fees</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.agentFees || ''}
                      onChange={(e) => setFormData({ ...formData, agentFees: parseFloat(e.target.value) || undefined })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Other Fees</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.otherFees || ''}
                      onChange={(e) => setFormData({ ...formData, otherFees: parseFloat(e.target.value) || undefined })}
                      placeholder="0.00"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editingAsset ? 'Update Asset' : 'Add Asset'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelForm} disabled={loading}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && filteredAssets.length > 0 && (
        <>
          {filterLegalEntityId && (
            <div className="filter-notice">
              Showing assets for selected legal entity ({filteredAssets.length} found)
            </div>
          )}
          <div className="assets-list">
            {filteredAssets.map((asset) => {
              return (
                <div key={asset.id} className="card asset-card">
                  <div className="asset-compact-layout">
                    <div className="asset-main-info">
                      <div className="asset-title-row">
                        <h3>{asset.name}</h3>
                        {asset.category && <span className="asset-type">{asset.category}</span>}
                      </div>
                      {asset.isJointOwnership && asset.owners && asset.owners.length > 0 ? (
                        <div className="asset-legal-entity">
                          <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Joint Owners:</p>
                          {asset.owners.map((owner, idx) => (
                            <p key={idx} style={{ marginLeft: '0.5rem', marginBottom: '0.15rem' }}>
                              {owner.legalEntity?.legalName || 'Unknown'} - {owner.ownershipPercentage.toFixed(2)}%
                            </p>
                          ))}
                        </div>
                      ) : asset.legalEntity ? (
                        <p className="asset-legal-entity">
                          <span className="label">Legal Entity:</span> {asset.legalEntity.legalName}
                        </p>
                      ) : null}
                      {asset.description && (
                        <p className="asset-description">{asset.description}</p>
                      )}
                    </div>
                    
                    <div className="asset-cost">
                      <span className="cost-label">Cost</span>
                      <strong className="cost-value">${asset.purchaseCost.toFixed(2)}</strong>
                    </div>
                    
                    <div className="asset-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(asset)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(asset.id)}>Delete</button>
                    </div>
                  </div>
                {asset.attributes && (
                  <div className="asset-attributes">
                    <span className="attributes-label">Attributes:</span>
                    <pre className="attributes-content">{asset.attributes}</pre>
                  </div>
                )}
                {asset.category === 'Real Estate' && (asset.renovationCosts || asset.stampDuty || asset.legalFees || asset.inspectionFees || asset.agentFees || asset.otherFees) && (
                  <div className="asset-real-estate-fees">
                    <span className="fees-label">Real Estate Costs:</span>
                    <div className="fees-grid">
                      {asset.renovationCosts && (
                        <div className="fee-item">
                          <span className="fee-label">Renovation:</span>
                          <span className="fee-value">${asset.renovationCosts.toFixed(2)}</span>
                        </div>
                      )}
                      {asset.stampDuty && (
                        <div className="fee-item">
                          <span className="fee-label">Stamp Duty:</span>
                          <span className="fee-value">${asset.stampDuty.toFixed(2)}</span>
                        </div>
                      )}
                      {asset.legalFees && (
                        <div className="fee-item">
                          <span className="fee-label">Legal Fees:</span>
                          <span className="fee-value">${asset.legalFees.toFixed(2)}</span>
                        </div>
                      )}
                      {asset.inspectionFees && (
                        <div className="fee-item">
                          <span className="fee-label">Inspection:</span>
                          <span className="fee-value">${asset.inspectionFees.toFixed(2)}</span>
                        </div>
                      )}
                      {asset.agentFees && (
                        <div className="fee-item">
                          <span className="fee-label">Agent Fees:</span>
                          <span className="fee-value">${asset.agentFees.toFixed(2)}</span>
                        </div>
                      )}
                      {asset.otherFees && (
                        <div className="fee-item">
                          <span className="fee-label">Other Fees:</span>
                          <span className="fee-value">${asset.otherFees.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </>
      )}

      {loading && <div className="spinner" />}
    </div>
  );
};

export default AssetsPage;
