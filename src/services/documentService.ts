import api from './api';

export type DocumentType = 'bank_statement' | 'invoice' | 'receipt' | 'tax_document' | 'contract' | 'other';
export type DocumentStatus = 'uploaded' | 'processing' | 'processed' | 'failed';

export interface Document {
  id: string; // UUID
  filename: string;
  filePath?: string;
  fileSize?: number;
  documentType: DocumentType;
  status: DocumentStatus;
  bankAccountId?: string; // UUID
  bankIdentifier?: string; // Parser used for extraction
  uploadedAt: string;
}

export interface ExtractedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  merchant?: string;
  category?: string;
  isDuplicate: boolean;
  duplicateTransactionId?: string;
  confidenceScore?: number;
}

export interface ExtractedBankAccount {
  bankName?: string;
  accountName?: string;
  accountNumber?: string; // Can include BSB merged in
}

export interface ExtractedLine {
  id: string;
  lineNumber: number;
  content: string;
  informationType?: string;
  isLikelyTransaction: boolean;
  isSelected: boolean;
  transactionId?: string;
}

export interface SupportedBank {
  identifier: string;
  name: string;
}

export interface DocumentVerification {
  document: Document;
  transactions: ExtractedTransaction[];
  extractedLines: ExtractedLine[];  // All extracted lines for verification
  extractedBankAccount?: ExtractedBankAccount;
  existingBankAccounts?: any[];
  bankAccount?: any;
  duplicateWarning?: string;
}

export interface DocumentProcessResponse {
  documentId: string;
  status: string;
  transactionsExtracted: number;
  processingTime: number;
  message?: string;
  extractedBankAccount?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
  };
}

// Transform camelCase frontend data to snake_case backend format
const toSnakeCase = (data: any): any => {
  if (!data) return data;
  
  const snakeData: any = { ...data };
  
  if (data.bankAccountId !== undefined) {
    snakeData.bank_account_id = data.bankAccountId;
    delete snakeData.bankAccountId;
  }
  if (data.documentType !== undefined) {
    snakeData.document_type = data.documentType;
    delete snakeData.documentType;
  }
  if (data.filePath !== undefined) {
    snakeData.file_path = data.filePath;
    delete snakeData.filePath;
  }
  if (data.fileSize !== undefined) {
    snakeData.file_size = data.fileSize;
    delete snakeData.fileSize;
  }
  if (data.uploadedAt !== undefined) {
    snakeData.uploaded_at = data.uploadedAt;
    delete snakeData.uploadedAt;
  }
  
  return snakeData;
};

// Transform snake_case backend data to camelCase frontend format
const toCamelCase = (data: any): any => {
  if (!data) return data;
  
  const camelData: any = { ...data };
  
  if (data.bank_account_id !== undefined) {
    camelData.bankAccountId = data.bank_account_id;
    delete camelData.bank_account_id;
  }
  if (data.extracted_bank_account !== undefined) {
    camelData.extractedBankAccount = {
      bankName: data.extracted_bank_account.bank_name,
      accountName: data.extracted_bank_account.account_name,
      accountNumber: data.extracted_bank_account.account_number,
    }
    delete camelData.extracted_bank_account;
  }
  if (data.bank_identifier !== undefined) {
    camelData.bankIdentifier = data.bank_identifier;
    delete camelData.bank_identifier;
  }
  if (data.document_type !== undefined) {
    camelData.documentType = data.document_type;
    delete camelData.document_type;
  }
  if (data.file_path !== undefined) {
    camelData.filePath = data.file_path;
    delete camelData.file_path;
  }
  if (data.file_size !== undefined) {
    camelData.fileSize = data.file_size;
    delete camelData.file_size;
  }
  if (data.uploaded_at !== undefined) {
    camelData.uploadedAt = data.uploaded_at;
    delete camelData.uploaded_at;
  }
  if (data.created_at !== undefined) {
    camelData.uploadedAt = data.created_at;
    delete camelData.created_at;
  }
  if (data.updated_at !== undefined) {
    camelData.updatedAt = data.updated_at;
    delete camelData.updated_at;
  }
  if (data.is_duplicate !== undefined) {
    camelData.isDuplicate = data.is_duplicate;
    delete camelData.is_duplicate;
  }
  if (data.duplicate_transaction_id !== undefined) {
    camelData.duplicateTransactionId = data.duplicate_transaction_id;
    delete camelData.duplicate_transaction_id;
  }
  if (data.confidence_score !== undefined) {
    camelData.confidenceScore = data.confidence_score;
    delete camelData.confidence_score;
  }
  if (data.document_id !== undefined) {
    camelData.documentId = data.document_id;
    delete camelData.document_id;
  }
  if (data.transactions_extracted !== undefined) {
    camelData.transactionsExtracted = data.transactions_extracted;
    delete camelData.transactions_extracted;
  }
  if (data.processing_time !== undefined) {
    camelData.processingTime = data.processing_time;
    delete camelData.processing_time;
  }
  if (data.line_number !== undefined) {
    camelData.lineNumber = data.line_number;
    delete camelData.line_number;
  }
  if (data.information_type !== undefined) {
    camelData.informationType = data.information_type;
    delete camelData.information_type;
  }
  if (data.is_likely_transaction !== undefined) {
    camelData.isLikelyTransaction = data.is_likely_transaction;
    delete camelData.is_likely_transaction;
  }
  if (data.is_selected !== undefined) {
    camelData.isSelected = data.is_selected;
    delete camelData.is_selected;
  }
  if (data.transaction_id !== undefined) {
    camelData.transactionId = data.transaction_id;
    delete camelData.transaction_id;
  }
  
  return camelData;
};

export const documentService = {
  uploadDocument: async (file: File, documentType: DocumentType, bankAccountId?: string, bankIdentifier?: string): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    if (bankAccountId) {
      formData.append('bank_account_id', bankAccountId);
    }
    if (bankIdentifier) {
      formData.append('bank_identifier', bankIdentifier);
    }

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return toCamelCase(response.data);
  },

  getDocuments: async (): Promise<Document[]> => {
    const response = await api.get('/documents');
    return Array.isArray(response.data) 
      ? response.data.map(toCamelCase) 
      : [];
  },

  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  processDocument: async (id: string, reprocess: boolean = false): Promise<DocumentProcessResponse> => {
    const url = reprocess ? `/documents/${id}/reprocess` : `/documents/${id}/process`;
    const response = await api.post(url);
    return toCamelCase(response.data);
  },

  reprocessDocument: async (id: string, bankIdentifier?: string): Promise<DocumentProcessResponse> => {
    const data = bankIdentifier ? { bank_identifier: bankIdentifier } : {};
    const response = await api.post(`/documents/${id}/reprocess`, data);
    return toCamelCase(response.data);
  },

  getSupportedBanks: async (): Promise<SupportedBank[]> => {
    const response = await api.get('/documents/supported-banks');
    return response.data.banks || [];
  },

  verifyDocument: async (id: string): Promise<DocumentVerification> => {
    const response = await api.get(`/documents/${id}/verify`);
    const data = response.data;
    
    return {
      document: toCamelCase(data.document),
      transactions: data.transactions?.map((t: any) => toCamelCase(t)) || [],
      extractedLines: data.extracted_lines?.map((l: any) => toCamelCase(l)) || [],
      extractedBankAccount: data.extracted_bank_account ? toCamelCase(data.extracted_bank_account) : undefined,
      existingBankAccounts: data.existing_bank_accounts?.map((a: any) => toCamelCase(a)) || [],
      bankAccount: data.bank_account ? toCamelCase(data.bank_account) : undefined,
      duplicateWarning: data.duplicate_warning
    };
  },

  approveDocument: async (
    id: string, 
    accountNumber: string
  ): Promise<any> => {
    const response = await api.post(`/documents/${id}/approve`, {
      account_number: accountNumber
    });
    return response.data;
  },
};


