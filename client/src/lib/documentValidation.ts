/**
 * Smart document validation utilities with real-time feedback
 */

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: string[];
  warnings: string[];
  suggestions: string[];
  confidence: number; // 0-1
  processingTime: number;
}

export interface DocumentRequirements {
  allowedTypes: string[];
  maxSize: number; // in MB
  minResolution?: { width: number; height: number };
  requiredText?: string[];
  forbiddenText?: string[];
  expectedFormat?: 'portrait' | 'landscape' | 'any';
}

// Document type requirements configuration
export const DOCUMENT_REQUIREMENTS: Record<string, DocumentRequirements> = {
  business_license: {
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 5,
    minResolution: { width: 800, height: 600 },
    requiredText: ['licença', 'alvará', 'funcionamento'],
    expectedFormat: 'portrait',
  },
  cnpj_certificate: {
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 3,
    minResolution: { width: 800, height: 600 },
    requiredText: ['cnpj', 'receita federal'],
    expectedFormat: 'portrait',
  },
  financial_statements: {
    allowedTypes: ['pdf', 'xlsx', 'xls'],
    maxSize: 10,
    requiredText: ['balanço', 'demonstrativo', 'financeiro'],
  },
  bank_statements: {
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 8,
    requiredText: ['banco', 'extrato', 'saldo'],
  },
  articles_of_incorporation: {
    allowedTypes: ['pdf'],
    maxSize: 5,
    requiredText: ['contrato social', 'sociedade'],
    expectedFormat: 'portrait',
  },
  board_resolution: {
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 3,
    requiredText: ['ata', 'assembleia', 'deliberação'],
  },
  tax_registration: {
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 3,
    requiredText: ['inscrição', 'municipal', 'estadual'],
  },
  social_security_clearance: {
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 3,
    requiredText: ['inss', 'certidão', 'negativa'],
  },
  labor_clearance: {
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 3,
    requiredText: ['fgts', 'certidão', 'negativa'],
  },
  income_tax_return: {
    allowedTypes: ['pdf'],
    maxSize: 5,
    requiredText: ['imposto de renda', 'declaração', 'receita federal'],
  },
  tax_clearance: {
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 3,
    requiredText: ['certidão', 'tributos', 'negativa'],
  },
  commercial_references: {
    allowedTypes: ['pdf', 'doc', 'docx'],
    maxSize: 2,
    requiredText: ['referência', 'comercial'],
  },
  import_licenses: {
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 5,
    requiredText: ['licença', 'importação'],
  },
  product_catalogs: {
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 20,
    requiredText: ['produto', 'catálogo'],
  },
  quality_certificates: {
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 5,
    requiredText: ['certificado', 'qualidade', 'iso'],
  },
  insurance_policies: {
    allowedTypes: ['pdf'],
    maxSize: 5,
    requiredText: ['seguro', 'apólice'],
  },
  bank_references: {
    allowedTypes: ['pdf', 'doc', 'docx'],
    maxSize: 2,
    requiredText: ['banco', 'referência'],
  },
  additional_documents: {
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    maxSize: 10,
  },
};

export class DocumentValidator {
  private startTime: number = 0;

  async validateDocument(file: File, documentType: string): Promise<ValidationResult> {
    this.startTime = Date.now();
    
    const requirements = DOCUMENT_REQUIREMENTS[documentType];
    if (!requirements) {
      return this.createResult(false, 0, ['Tipo de documento não reconhecido'], [], []);
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Basic file validation
    const basicValidation = this.validateBasicProperties(file, requirements);
    errors.push(...basicValidation.errors);
    warnings.push(...basicValidation.warnings);
    suggestions.push(...basicValidation.suggestions);
    score -= basicValidation.penalty;

    // Image resolution validation (for image files)
    if (this.isImageFile(file) && requirements.minResolution) {
      const resolutionValidation = await this.validateImageResolution(file, requirements.minResolution);
      errors.push(...resolutionValidation.errors);
      warnings.push(...resolutionValidation.warnings);
      score -= resolutionValidation.penalty;
    }

    // File integrity check
    const integrityValidation = await this.validateFileIntegrity(file);
    errors.push(...integrityValidation.errors);
    warnings.push(...integrityValidation.warnings);
    score -= integrityValidation.penalty;

    // Content analysis (simplified - would integrate with OCR service in production)
    if (requirements.requiredText || requirements.forbiddenText) {
      const contentValidation = await this.simulateContentValidation(file, requirements);
      errors.push(...contentValidation.errors);
      warnings.push(...contentValidation.warnings);
      suggestions.push(...contentValidation.suggestions);
      score -= contentValidation.penalty;
    }

    // Security scan
    const securityValidation = this.validateSecurity(file);
    errors.push(...securityValidation.errors);
    warnings.push(...securityValidation.warnings);
    score -= securityValidation.penalty;

    score = Math.max(0, Math.min(100, score));
    const isValid = errors.length === 0 && score >= 60;
    const confidence = this.calculateConfidence(score, errors.length, warnings.length);

    return this.createResult(isValid, score, errors, warnings, suggestions, confidence);
  }

  private validateBasicProperties(file: File, requirements: DocumentRequirements) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let penalty = 0;

    // File type validation
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !requirements.allowedTypes.includes(fileExtension)) {
      errors.push(`Tipo de arquivo não permitido. Tipos aceitos: ${requirements.allowedTypes.join(', ')}`);
      penalty += 30;
    }

    // File size validation
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > requirements.maxSize) {
      errors.push(`Arquivo muito grande (${fileSizeMB.toFixed(1)}MB). Tamanho máximo: ${requirements.maxSize}MB`);
      penalty += 20;
    } else if (fileSizeMB > requirements.maxSize * 0.8) {
      warnings.push(`Arquivo próximo ao limite de tamanho (${fileSizeMB.toFixed(1)}MB/${requirements.maxSize}MB)`);
      penalty += 5;
    }

    // File name validation
    if (file.name.length > 100) {
      warnings.push('Nome do arquivo muito longo. Considere renomear para algo mais curto.');
      penalty += 2;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(file.name.replace(/\.[^.]+$/, ''))) {
      warnings.push('Nome do arquivo contém caracteres especiais. Use apenas letras, números, pontos, hífens e underscores.');
      penalty += 3;
    }

    // Minimum file size check
    if (fileSizeMB < 0.01) {
      errors.push('Arquivo muito pequeno. Verifique se o documento está completo.');
      penalty += 25;
    }

    return { errors, warnings, suggestions, penalty };
  }

  private async validateImageResolution(file: File, minResolution: { width: number; height: number }) {
    const errors: string[] = [];
    const warnings: string[] = [];
    let penalty = 0;

    try {
      const dimensions = await this.getImageDimensions(file);
      
      if (dimensions.width < minResolution.width || dimensions.height < minResolution.height) {
        errors.push(`Resolução muito baixa (${dimensions.width}x${dimensions.height}). Mínimo recomendado: ${minResolution.width}x${minResolution.height}`);
        penalty += 15;
      } else if (dimensions.width < minResolution.width * 1.2 || dimensions.height < minResolution.height * 1.2) {
        warnings.push(`Resolução próxima ao mínimo. Para melhor qualidade, use ${minResolution.width * 1.5}x${minResolution.height * 1.5} ou superior.`);
        penalty += 5;
      }
    } catch (error) {
      warnings.push('Não foi possível verificar a resolução da imagem.');
      penalty += 3;
    }

    return { errors, warnings, penalty };
  }

  private async validateFileIntegrity(file: File) {
    const errors: string[] = [];
    const warnings: string[] = [];
    let penalty = 0;

    try {
      // Basic file header check
      const header = await this.readFileHeader(file);
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'pdf' && !header.startsWith('PDF')) {
        errors.push('Arquivo corrompido ou não é um PDF válido.');
        penalty += 30;
      } else if ((extension === 'jpg' || extension === 'jpeg') && !header.includes('JFIF') && !header.includes('Exif')) {
        warnings.push('Possível problema com o arquivo JPEG. Verifique se está corrompido.');
        penalty += 10;
      } else if (extension === 'png' && !header.startsWith('PNG')) {
        warnings.push('Possível problema com o arquivo PNG. Verifique se está corrompido.');
        penalty += 10;
      }
    } catch (error) {
      warnings.push('Não foi possível verificar a integridade do arquivo.');
      penalty += 5;
    }

    return { errors, warnings, penalty };
  }

  private async simulateContentValidation(file: File, requirements: DocumentRequirements) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let penalty = 0;

    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Simulate content detection based on file name and type
    const fileName = file.name.toLowerCase();
    const hasRelevantContent = requirements.requiredText?.some(text => 
      fileName.includes(text.toLowerCase())
    ) || false;

    if (requirements.requiredText && requirements.requiredText.length > 0) {
      if (!hasRelevantContent) {
        // Simulate 70% accuracy in content detection
        if (Math.random() > 0.3) {
          warnings.push(`Texto esperado não encontrado: ${requirements.requiredText.join(', ')}. Verifique se o documento está correto.`);
          penalty += 15;
          suggestions.push('Certifique-se de que o documento contém as informações necessárias e está legível.');
        }
      } else {
        suggestions.push('Documento parece conter o conteúdo esperado.');
      }
    }

    // Simulate forbidden content check
    if (requirements.forbiddenText) {
      const hasForbiddenContent = requirements.forbiddenText.some(text => 
        fileName.includes(text.toLowerCase())
      );
      
      if (hasForbiddenContent) {
        errors.push(`Conteúdo não permitido detectado: ${requirements.forbiddenText.join(', ')}`);
        penalty += 25;
      }
    }

    return { errors, warnings, suggestions, penalty };
  }

  private validateSecurity(file: File) {
    const errors: string[] = [];
    const warnings: string[] = [];
    let penalty = 0;

    // Check for suspicious file names
    const suspiciousPatterns = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js'];
    const fileName = file.name.toLowerCase();
    
    if (suspiciousPatterns.some(pattern => fileName.includes(pattern))) {
      errors.push('Tipo de arquivo potencialmente perigoso detectado.');
      penalty += 50;
    }

    // Check for very large files that might be malicious
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 50) {
      warnings.push('Arquivo muito grande. Pode levar mais tempo para processar.');
      penalty += 5;
    }

    return { errors, warnings, penalty };
  }

  private calculateConfidence(score: number, errorCount: number, warningCount: number): number {
    let confidence = score / 100;
    confidence -= errorCount * 0.1;
    confidence -= warningCount * 0.05;
    return Math.max(0, Math.min(1, confidence));
  }

  private createResult(
    isValid: boolean, 
    score: number, 
    errors: string[], 
    warnings: string[], 
    suggestions: string[], 
    confidence: number = 0.8
  ): ValidationResult {
    return {
      isValid,
      score,
      errors,
      warnings,
      suggestions,
      confidence,
      processingTime: Date.now() - this.startTime,
    };
  }

  private isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  private async readFileHeader(file: File): Promise<string> {
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Convert bytes to ASCII string
    let header = '';
    for (let i = 0; i < Math.min(bytes.length, 8); i++) {
      header += String.fromCharCode(bytes[i]);
    }
    
    return header;
  }
}

// Utility functions for document validation feedback
export function getValidationStatusColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

export function getValidationStatusIcon(score: number): string {
  if (score >= 80) return '✓';
  if (score >= 60) return '⚠';
  return '✗';
}

export function getValidationMessage(result: ValidationResult): string {
  if (result.isValid && result.score >= 80) {
    return 'Documento válido e de alta qualidade';
  } else if (result.isValid) {
    return 'Documento válido com algumas observações';
  } else if (result.score >= 40) {
    return 'Documento com problemas que precisam ser corrigidos';
  } else {
    return 'Documento rejeitado - muitos problemas encontrados';
  }
}