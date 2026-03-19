import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { entityMemberService } from '../services/entityMemberService';
import { legalEntityService } from '../services/legalEntityService';
import type { EntityMember, EntityMemberInput } from '../types/EntityMember';
import type { LegalEntity } from '../types/LegalEntity';
import './EntityMembersPage.css';

const EntityMembersPage: React.FC = () => {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();
  
  const [entity, setEntity] = useState<LegalEntity | null>(null);
  const [members, setMembers] = useState<EntityMember[]>([]);
  const [allEntities, setAllEntities] = useState<LegalEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState<EntityMemberInput>({
    entityId: entityId || '',
    memberEntityId: '',
    role: 'member',
    ownershipPercentage: undefined,
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [entityId]);

  const loadData = async () => {
    if (!entityId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [entityData, membersData, entitiesData] = await Promise.all([
        legalEntityService.getById(entityId),
        entityMemberService.getMembers(entityId),
        legalEntityService.getAll(),
      ]);
      
      setEntity(entityData);
      setMembers(membersData);
      setAllEntities(entitiesData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityId) return;
    
    try {
      await entityMemberService.addMember(entityId, formData);
      await loadData();
      setShowAddForm(false);
      resetForm();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add member');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!entityId) return;
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await entityMemberService.deleteMember(entityId, memberId);
      await loadData();
    } catch (err: any) {
      alert('Failed to remove member');
    }
  };

  const resetForm = () => {
    setFormData({
      entityId: entityId || '',
      memberEntityId: '',
      role: 'member',
      ownershipPercentage: undefined,
      notes: '',
    });
  };

  const getTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      individual: 'Individual',
      company: 'Company',
      trust: 'Trust',
      smsf: 'SMSF',
      partnership: 'Partnership',
      other: 'Other',
    };
    return labels[type] || type;
  };

  if (loading) return <div className="spinner" />;
  if (error) return <div className="error-message">{error}</div>;
  if (!entity) return <div className="error-message">Entity not found</div>;

  return (
    <div className="entity-members-page">
      <div className="page-header">
        <div>
          <button onClick={() => navigate('/legal-entities')} className="btn btn-secondary">
            ← Back to Legal Entities
          </button>
          <h1>Members of {entity.legalName}</h1>
          <p className="entity-type-badge">
            <span className={`type-badge type-${entity.type}`}>
              {getTypeLabel(entity.type)}
            </span>
          </p>
        </div>
        {!showAddForm && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            + Add Member
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="card">
          <h2>Add New Member</h2>
          <form onSubmit={handleAddMember}>
            <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
              <div className="form-group">
                <label>Member Entity *</label>
                <select
                  value={formData.memberEntityId}
                  onChange={(e) => setFormData({ ...formData, memberEntityId: e.target.value })}
                  required
                >
                  <option value="">Select entity...</option>
                  {allEntities
                    .filter(e => e.id !== entityId)
                    .map(ent => (
                      <option key={ent.id} value={ent.id}>
                        {ent.legalName} ({getTypeLabel(ent.type)})
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="member">Member</option>
                  <option value="beneficiary">Beneficiary</option>
                  <option value="director">Director</option>
                  <option value="shareholder">Shareholder</option>
                </select>
              </div>

              <div className="form-group">
                <label>Ownership %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.ownershipPercentage || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    ownershipPercentage: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  placeholder="e.g., 25.5"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional information..."
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={!formData.memberEntityId}>
                Add Member
              </button>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {members.length > 0 ? (
        <div className="card">
          <h2>Current Members</h2>
          <table className="members-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Role</th>
                <th>Ownership %</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="member-name">{member.memberName || 'Unknown'}</td>
                  <td>
                    <span className={`role-badge role-${member.role}`}>
                      {member.role}
                    </span>
                  </td>
                  <td>{member.ownershipPercentage ? `${member.ownershipPercentage}%` : '-'}</td>
                  <td className="notes-cell">{member.notes || '-'}</td>
                  <td>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteMember(member.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty-state">
          <p>No members added yet.</p>
          {!showAddForm && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              Add First Member
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EntityMembersPage;
