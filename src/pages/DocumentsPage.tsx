import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService, Document, DocumentType, SupportedBank } from '../services/documentService';
import { bankAccountService } from '../services/bankAccountService';
import { BankAccount } from '../types/BankAccount';
import ScrollToTop from '../components/ScrollToTop';
import './DocumentsPage.css';

const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [supportedBanks, setSupportedBanks] = useState<SupportedBank[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>('bank_statement');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | undefined>();
  const [selectedBankIdentifier, setSelectedBankIdentifier] = useState<string>('generic');

  // Reprocess dialog state
  const [reprocessDialogOpen, setReprocessDialogOpen] = useState(false);
  const [reprocessDocumentId, setReprocessDocumentId] = useState<string | null>(null);
  const [reprocessBankIdentifier, setReprocessBankIdentifier] = useState<string>('generic');

  const [searchFilters, setSearchFilters] = useState({
    filename: '',
    documentType: '',
    status: '',
    bankAccountId: '',
  });

  // Load data on mount
  React.useEffect(() => {
    loadAllData();
  }, []);

  // Apply filters whenever documents or searchFilters change
  React.useEffect(() => {
    applyFilters();
  }, [documents, searchFilters]);

  const applyFilters = () => {
    let filtered = [...documents];

    if (searchFilters.filename) {
      filtered = filtered.filter(doc =>
        doc.filename.toLowerCase().includes(searchFilters.filename.toLowerCase())
      );
    }

    if (searchFilters.documentType) {
      filtered = filtered.filter(doc =>
        doc.documentType === searchFilters.documentType
      );
    }

    if (searchFilters.status) {
      filtered = filtered.filter(doc =>
        doc.status === searchFilters.status
      );
    }

    if (searchFilters.bankAccountId) {
      filtered = filtered.filter(doc =>
        doc.bankAccountId === searchFilters.bankAccountId
      );
    }

    setFilteredDocuments(filtered);
  };

  const clearFilters = () => {
    setSearchFilters({
      filename: '',
      documentType: '',
      status: '',
      bankAccountId: '',
    });
  };

  const hasActiveFilters = () => {
    return searchFilters.filename !== '' ||
           searchFilters.documentType !== '' ||
           searchFilters.status !== '' ||
           searchFilters.bankAccountId !== '';
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await documentService.getDocuments();
      // Sort by uploadedAt descending (newest first)
      const sortedData = data.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      setDocuments(sortedData);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to load documents';
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const data = await bankAccountService.getAll();
      setBankAccounts(data);
    } catch (err) {
      console.error('Failed to load bank accounts:', err);
    }
  };

  const loadSupportedBanks = async () => {
    try {
      const data = await documentService.getSupportedBanks();
      setSupportedBanks(data);
    } catch (err) {
      console.error('Failed to load supported banks:', err);
    }
  };

  const loadAllData = async () => {
    await Promise.all([loadDocuments(), loadBankAccounts(), loadSupportedBanks()]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadSuccess(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setUploadSuccess(null);

      // Upload document
      const uploadedDoc = await documentService.uploadDocument(selectedFile, selectedDocumentType, selectedBankAccountId, selectedBankIdentifier);
      
      setUploadSuccess('Document uploaded successfully! Processing...');
      
      // Automatically process the document
      setProcessing(true);
      const processResult = await documentService.processDocument(uploadedDoc.id);
      console.log('processResult Result:', processResult);

      if (processResult.message && processResult.message.includes('already processed')) {
        setUploadSuccess(`${processResult.message} Navigate to verification page.`);
      } else {
        setUploadSuccess(`Document processed! Extracted ${processResult.transactionsExtracted} transactions.`);
      }
      
      // Reset form
      setSelectedFile(null);
      setSelectedDocumentType('bank_statement');
      setSelectedBankAccountId(undefined);
      
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Navigate to verification page, passing extracted bank account info
      setTimeout(() => {
        navigate(`/documents/${uploadedDoc.id}/verify`, {
          state: { extractedBankAccount: processResult.extractedBankAccount }
        });
      }, 1500);
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to upload document';
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  const handleReprocess = (documentId: string, currentBankIdentifier?: string) => {
    setReprocessDocumentId(documentId);
    setReprocessBankIdentifier(currentBankIdentifier || 'generic');
    setReprocessDialogOpen(true);
  };

  const confirmReprocess = async () => {
    if (!reprocessDocumentId) return;

    try {
      setLoading(true);
      setError(null);
      await documentService.reprocessDocument(reprocessDocumentId, reprocessBankIdentifier);
      setUploadSuccess('Document reprocessed successfully!');
      setTimeout(() => setUploadSuccess(null), 3000);
      await loadAllData();
      
      // Navigate to verification page after successful reprocess
      setTimeout(() => {
        navigate(`/documents/${reprocessDocumentId}/verify`);
      }, 1000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to reprocess document';
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
      setReprocessDialogOpen(false);
      setReprocessDocumentId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await documentService.deleteDocument(id);
      await loadDocuments();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to delete document';
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="documents-page">
      <div className="page-header">
        <h1>Documents</h1>
        <button className="btn btn-primary" onClick={loadAllData}>
          {documents.length === 0 ? 'Load Documents' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {uploadSuccess && <div className="success-message">{uploadSuccess}</div>}

      <div className="upload-section">
        <div className="upload-form-grid">
          <div className="form-group">
            <label>Select File</label>
            <input
              id="file-input"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>

          <div className="form-group">
            <label>Document Type</label>
            <select
              value={selectedDocumentType}
              onChange={(e) => setSelectedDocumentType(e.target.value as DocumentType)}
            >
              <option value="bank_statement">Bank Statement</option>
              <option value="invoice">Invoice</option>
              <option value="receipt">Receipt</option>
              <option value="tax_document">Tax Document</option>
              <option value="contract">Contract</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Bank Account (Optional)</label>
            <select
              value={selectedBankAccountId || ''}
              onChange={(e) => setSelectedBankAccountId(e.target.value || undefined)}
            >
              <option value="">None</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.accountName} ({account.bankName})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Bank/Institution for Parsing</label>
            <select
              value={selectedBankIdentifier}
              onChange={(e) => setSelectedBankIdentifier(e.target.value)}
            >
              {supportedBanks.map((bank) => (
                <option key={bank.identifier} value={bank.identifier}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedFile && (
          <div className="selected-file-info">
            📎 {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </div>
        )}

        <div className="form-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleUpload}
            disabled={!selectedFile || loading || processing}
          >
            {processing ? '⏳ Processing...' : loading ? '📤 Uploading...' : '📤 Upload & Process'}
          </button>
        </div>
      </div>

      {documents.length > 0 && (
        <>
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
                <label>Filename</label>
                <input
                  type="text"
                  placeholder="Search by filename..."
                  value={searchFilters.filename}
                  onChange={(e) => setSearchFilters({ ...searchFilters, filename: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Document Type</label>
                <select
                  value={searchFilters.documentType}
                  onChange={(e) => setSearchFilters({ ...searchFilters, documentType: e.target.value })}
                >
                  <option value="">All Types</option>
                  <option value="bank_statement">Bank Statement</option>
                  <option value="invoice">Invoice</option>
                  <option value="receipt">Receipt</option>
                  <option value="tax_document">Tax Document</option>
                  <option value="contract">Contract</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={searchFilters.status}
                  onChange={(e) => setSearchFilters({ ...searchFilters, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="uploaded">Uploaded</option>
                  <option value="processing">Processing</option>
                  <option value="processed">Processed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bank Account</label>
                <select
                  value={searchFilters.bankAccountId}
                  onChange={(e) => setSearchFilters({ ...searchFilters, bankAccountId: e.target.value })}
                >
                  <option value="">All Bank Accounts</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountName} ({account.bankName})
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
              Showing {filteredDocuments.length} of {documents.length} documents
            </p>
            </>
            )}
          </div>

          <div className="documents-list">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="card document-card">
              <div className="document-compact-layout">
                <div className="document-main-info">
                  <div className="document-title-row">
                    <span className="document-icon-inline">
                      {document.filename.toLowerCase().endsWith('.pdf') && '📄'}
                      {(document.filename.toLowerCase().endsWith('.jpg') || 
                        document.filename.toLowerCase().endsWith('.jpeg') || 
                        document.filename.toLowerCase().endsWith('.png')) && '🖼️'}
                      {(document.filename.toLowerCase().endsWith('.doc') || 
                        document.filename.toLowerCase().endsWith('.docx')) && '📝'}
                      {(document.filename.toLowerCase().endsWith('.xls') || 
                        document.filename.toLowerCase().endsWith('.xlsx') || 
                        document.filename.toLowerCase().endsWith('.csv')) && '📊'}
                    </span>
                    <h3>{document.filename}</h3>
                  </div>
                  <div className="document-meta">
                    <span className="document-date">{formatDate(document.uploadedAt)}</span>
                    <span className="separator">•</span>
                    <span className="document-type">{document.documentType.replace('_', ' ')}</span>
                    <span className="separator">•</span>
                    <span className={`status-badge status-${document.status}`}>
                      {document.status === 'uploaded' && 'Uploaded'}
                      {document.status === 'processing' && 'Processing'}
                      {document.status === 'processed' && 'Processed'}
                      {document.status === 'failed' && 'Failed'}
                    </span>
                  </div>
                </div>
                
                <div className="document-details-inline">
                  {document.fileSize && (
                    <div className="detail-item">
                      <span className="label">Size:</span>
                      <strong>{formatFileSize(document.fileSize)}</strong>
                    </div>
                  )}
                  {document.bankAccountId && (
                    <div className="detail-item">
                      <span className="label">Account:</span>
                      <strong>{bankAccounts.find(a => a.id === document.bankAccountId)?.accountName || 'Unknown'}</strong>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="label">Parser:</span>
                    <strong>
                      {document.bankIdentifier 
                        ? (supportedBanks.find(b => b.identifier === document.bankIdentifier)?.name || document.bankIdentifier)
                        : 'Not specified'}
                    </strong>
                  </div>
                </div>
                
                <div className="document-actions">
                  {document.status === 'processed' && (
                    <>
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => navigate(`/documents/${document.id}/verify`)}
                      >
                        👁️ View
                      </button>
                      <button 
                        className="btn btn-warning btn-sm" 
                        onClick={() => handleReprocess(document.id, document.bankIdentifier)}
                        disabled={loading}
                      >
                        🔄 Re-extract
                      </button>
                    </>
                  )}
                  <button 
                    className="btn btn-danger btn-sm" 
                    onClick={() => handleDelete(document.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {loading && <div className="spinner" />}

      {/* Reprocess Dialog */}
      {reprocessDialogOpen && (
        <div className="modal-overlay" onClick={() => setReprocessDialogOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Re-extract Transactions</h2>
            <p>This will delete existing extracted transactions and extract them again.</p>
            
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Select Parser / Bank</label>
              <select 
                value={reprocessBankIdentifier} 
                onChange={(e) => setReprocessBankIdentifier(e.target.value)}
                className="form-select"
              >
                {supportedBanks.map((bank) => (
                  <option key={bank.identifier} value={bank.identifier}>
                    {bank.name}
                  </option>
                ))}
              </select>
              <small style={{ color: '#888', marginTop: '0.5rem', display: 'block' }}>
                Select the same parser or choose a different one for better results
              </small>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setReprocessDialogOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={confirmReprocess}
                disabled={loading}
              >
                {loading ? '⏳ Processing...' : '🔄 Re-extract'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ScrollToTop />
    </div>
  );
};

export default DocumentsPage;
