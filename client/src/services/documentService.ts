// Centralized document service to handle all document operations
export class DocumentService {
  private static instance: DocumentService;

  private constructor() {}

  static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  // Get the compound document ID for array handling
  getCompoundDocumentId(documentKey: string, filename: string): string {
    // Extract just the filename without path
    const cleanFilename = filename.split('/').pop() || filename;
    return `${documentKey}_${cleanFilename}`;
  }

  // Extract base document key from compound ID
  extractBaseDocumentKey(compoundId: string): { key: string; filename: string } {
    const parts = compoundId.split('_');
    if (parts.length < 2) {
      return { key: compoundId, filename: '' };
    }
    
    // Handle cases like "articles_of_association_filename.jpg"
    const possibleKeys = [
      'articles_of_association',
      'financial_statements',
      'business_license',
      'bank_references',
      'legal_representative_id',
      'certificate_of_incorporation',
      'board_resolution',
      'power_of_attorney',
      'tax_registration_certificate',
      'import_export_license',
      'insurance_claim_record',
      'quality_certifications',
      'product_catalogs',
      'purchase_history',
      'compliance_certificates',
      'customs_declaration_history'
    ];

    for (const key of possibleKeys) {
      if (compoundId.startsWith(key + '_')) {
        return {
          key,
          filename: compoundId.substring(key.length + 1)
        };
      }
    }

    // If no match, assume first part is key, rest is filename
    return {
      key: parts[0],
      filename: parts.slice(1).join('_')
    };
  }

  // Process documents from backend for frontend display
  processDocumentsFromBackend(documents: any): Record<string, any> {
    if (!documents) return {};
    
    // If it's a string, try to parse it
    if (typeof documents === 'string') {
      try {
        return JSON.parse(documents);
      } catch {
        return {};
      }
    }
    
    return documents;
  }

  // Check if a document exists
  hasDocument(documents: Record<string, any>, documentKey: string): boolean {
    if (!documents || !documents[documentKey]) return false;
    
    const doc = documents[documentKey];
    if (Array.isArray(doc)) {
      return doc.length > 0;
    }
    
    return true;
  }

  // Get document count
  getDocumentCount(documents: Record<string, any>, documentKey: string): number {
    if (!documents || !documents[documentKey]) return 0;
    
    const doc = documents[documentKey];
    if (Array.isArray(doc)) {
      return doc.length;
    }
    
    return 1;
  }

  // Convert document to array format (for consistent handling)
  normalizeToArray(document: any): any[] {
    if (!document) return [];
    if (Array.isArray(document)) return document;
    return [document];
  }

  // Get all documents as flat array for counting
  getAllDocumentsFlat(requiredDocs: Record<string, any>, optionalDocs: Record<string, any>): any[] {
    const allDocs: any[] = [];
    
    // Process required documents
    Object.values(requiredDocs || {}).forEach(doc => {
      if (Array.isArray(doc)) {
        allDocs.push(...doc);
      } else if (doc) {
        allDocs.push(doc);
      }
    });
    
    // Process optional documents
    Object.values(optionalDocs || {}).forEach(doc => {
      if (Array.isArray(doc)) {
        allDocs.push(...doc);
      } else if (doc) {
        allDocs.push(doc);
      }
    });
    
    return allDocs;
  }

  // Check if document meets requirements
  isDocumentComplete(documents: Record<string, any>, mandatoryKeys: string[]): boolean {
    return mandatoryKeys.every(key => this.hasDocument(documents, key));
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file icon based on type
  getFileIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'FileText';
    if (mimeType.includes('image')) return 'Image';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'FileText';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'Table';
    return 'File';
  }

  // Validate file type
  isValidFileType(filename: string): boolean {
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
    const fileExtension = '.' + filename.split('.').pop()?.toLowerCase();
    return validExtensions.includes(fileExtension);
  }

  // Generate unique document ID for temporary storage
  generateTempDocumentId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const documentService = DocumentService.getInstance();