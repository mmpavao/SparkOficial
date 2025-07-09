/**
 * SERVIÇO DE DADOS PARA DOSSIÊ PDF
 * Componente isolado que armazena e processa todos os dados das APIs
 * para geração completa do dossiê em PDF
 */

export interface DossieDataComplete {
  // Informações básicas
  companyName: string;
  cnpj: string;
  emissionDate: string;
  emissionTime: string;
  
  // Resumo das consultas
  totalConsultations: number;
  availableConsultations: number;
  unavailableConsultations: number;
  
  // Dados do Score QUOD
  scoreQuod: {
    score: number;
    faixaScore: string;
    scoreMotivos: string[];
    scorePercentage: number;
    riskLevel: string;
    riskClass: string;
    consultationDate: string;
    consultationTime: string;
  } | null;
  
  // Dados do Cadastro PJ Plus
  cadastroPjPlus: {
    companyName: string;
    fantasyName: string;
    cnpj: string;
    foundationDate: string;
    registrationStatus: string;
    companySize: string;
    legalNature: string;
    capital: string;
    
    // Endereço
    address: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    };
    
    // Atividades econômicas
    activities: {
      code: string;
      description: string;
      isPrimary: boolean;
    }[];
    
    // Quadro societário
    partners: {
      name: string;
      cpf: string;
      qualification: string;
      participationPercentage: number;
    }[];
    
    // Contatos
    contacts: {
      phone: string;
      email: string;
    }[];
  } | null;
  
  // Dados da CND
  cndData: {
    status: string;
    hasDebts: boolean;
    certificateNumber: string;
    emissionDate: string;
    validityDate: string;
    debtAmount: string;
    debtDetails: string;
    consultationDate: string;
    pdfUrl: string;
  } | null;
  
  // Dados do SCR Bacen
  scrBacen: {
    hasRecords: boolean;
    totalDebt: string;
    bankingRelationships: {
      bankName: string;
      accountType: string;
      status: string;
      openingDate: string;
    }[];
    creditOperations: {
      modalityCode: string;
      modalityDescription: string;
      amount: string;
      riskLevel: string;
      installmentStatus: string;
    }[];
    consultationDate: string;
  } | null;
  
  // Detalhamento Negativo
  negativeDetails: {
    // Protestos
    protests: {
      hasProtests: boolean;
      totalAmount: string;
      records: {
        protocolNumber: string;
        amount: string;
        date: string;
        notaryOffice: string;
        city: string;
        state: string;
      }[];
    };
    
    // Falências
    bankruptcies: {
      hasBankruptcies: boolean;
      records: {
        processNumber: string;
        court: string;
        date: string;
        status: string;
        city: string;
        state: string;
      }[];
    };
    
    // Ações judiciais
    lawsuits: {
      hasLawsuits: boolean;
      records: {
        processNumber: string;
        court: string;
        subject: string;
        amount: string;
        date: string;
        status: string;
      }[];
    };
    
    // Cheques sem fundo
    bouncedChecks: {
      hasBouncedChecks: boolean;
      totalAmount: string;
      records: {
        checkNumber: string;
        bank: string;
        amount: string;
        date: string;
        reason: string;
      }[];
    };
    
    consultationDate: string;
  } | null;
  
  // Dados adicionais para análise
  additionalData: {
    // Simples Nacional
    simplesNacional: {
      isOptant: boolean;
      optionDate: string;
      exclusionDate: string;
      status: string;
    };
    
    // Receita Federal
    receitaFederal: {
      registrationStatus: string;
      lastUpdate: string;
      specialSituation: string;
      specialSituationDate: string;
    };
    
    // FGTS
    fgts: {
      regularityStatus: string;
      certificateNumber: string;
      validityDate: string;
    };
    
    // TCU
    tcu: {
      hasRestrictions: boolean;
      restrictionType: string;
      restrictionDate: string;
      penaltyAmount: string;
    };
  } | null;
}

export class DossieDataService {
  /**
   * Processa todos os dados das APIs e retorna estrutura completa para PDF
   */
  static processApiData(creditScoreData: any): DossieDataComplete {
    const now = new Date();
    const emissionDate = now.toLocaleDateString('pt-BR');
    const emissionTime = now.toLocaleTimeString('pt-BR');
    
    // Parse JSON fields if needed
    const parseJsonField = (field: any) => {
      if (!field) return null;
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (e) {
          return null;
        }
      }
      return field;
    };
    
    const partners = parseJsonField(creditScoreData.partners);
    const activities = parseJsonField(creditScoreData.activities);
    
    return {
      // Informações básicas
      companyName: creditScoreData.companyName || 'Empresa',
      cnpj: creditScoreData.cnpj || '',
      emissionDate,
      emissionTime,
      
      // Resumo das consultas
      totalConsultations: 11,
      availableConsultations: this.calculateAvailableConsultations(creditScoreData),
      unavailableConsultations: 11 - this.calculateAvailableConsultations(creditScoreData),
      
      // Score QUOD
      scoreQuod: creditScoreData.score ? {
        score: creditScoreData.score,
        faixaScore: creditScoreData.faixaScore || this.getScoreRange(creditScoreData.score),
        scoreMotivos: creditScoreData.scoreMotivos ? creditScoreData.scoreMotivos.split(';') : [],
        scorePercentage: Math.round((creditScoreData.score / 1000) * 100),
        riskLevel: this.calculateRiskLevel(creditScoreData.score),
        riskClass: this.getRiskClass(creditScoreData.score),
        consultationDate: emissionDate,
        consultationTime: emissionTime
      } : null,
      
      // Cadastro PJ Plus
      cadastroPjPlus: creditScoreData.companyName ? {
        companyName: creditScoreData.companyName,
        fantasyName: creditScoreData.fantasyName || creditScoreData.companyName,
        cnpj: creditScoreData.cnpj,
        foundationDate: creditScoreData.openingDate ? 
          new Date(creditScoreData.openingDate).toLocaleDateString('pt-BR') : 'Não informado',
        registrationStatus: creditScoreData.isActive ? 'Ativa' : 'Inativa',
        companySize: creditScoreData.size || 'Não informado',
        legalNature: creditScoreData.legalNature || 'Sociedade Empresária Limitada',
        capital: creditScoreData.capital ? 
          `R$ ${parseFloat(creditScoreData.capital).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado',
        
        address: {
          street: creditScoreData.street || 'Não informado',
          number: creditScoreData.number || 'S/N',
          neighborhood: creditScoreData.district || 'Não informado',
          city: creditScoreData.city || 'Não informado',
          state: creditScoreData.state || 'Não informado',
          zipCode: creditScoreData.zipCode || 'Não informado'
        },
        
        activities: activities ? activities.map((activity: any) => ({
          code: activity.code || '',
          description: activity.description || activity.text || '',
          isPrimary: activity.isPrimary || false
        })) : [],
        
        partners: partners ? partners.map((partner: any) => ({
          name: partner.name || partner.nome || '',
          cpf: partner.cpf || partner.document || '',
          qualification: partner.qualification || partner.qualificacao || '',
          participationPercentage: partner.participationPercentage || 0
        })) : [],
        
        contacts: [{
          phone: creditScoreData.phone || 'Não informado',
          email: creditScoreData.email || 'Não informado'
        }]
      } : null,
      
      // CND
      cndData: creditScoreData.cndStatus ? {
        status: creditScoreData.cndStatus,
        hasDebts: creditScoreData.cndHasDebts || false,
        certificateNumber: creditScoreData.cndNumber || 'Não informado',
        emissionDate: creditScoreData.cndEmissionDate ? 
          new Date(creditScoreData.cndEmissionDate).toLocaleDateString('pt-BR') : 'Não informado',
        validityDate: creditScoreData.cndValidityDate ? 
          new Date(creditScoreData.cndValidityDate).toLocaleDateString('pt-BR') : 'Não informado',
        debtAmount: creditScoreData.cndDebtAmount ? 
          `R$ ${parseFloat(creditScoreData.cndDebtAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
        debtDetails: creditScoreData.cndDebtDetails || 'Nenhum detalhe disponível',
        consultationDate: emissionDate,
        pdfUrl: creditScoreData.cndPdfUrl || ''
      } : null,
      
      // SCR Bacen
      scrBacen: null, // Será implementado quando API estiver disponível
      
      // Detalhamento Negativo
      negativeDetails: {
        protests: {
          hasProtests: creditScoreData.hasProtests || false,
          totalAmount: 'R$ 0,00',
          records: []
        },
        bankruptcies: {
          hasBankruptcies: creditScoreData.hasBankruptcy || false,
          records: []
        },
        lawsuits: {
          hasLawsuits: creditScoreData.hasLawsuits || false,
          records: []
        },
        bouncedChecks: {
          hasBouncedChecks: creditScoreData.hasBouncedChecks || false,
          totalAmount: 'R$ 0,00',
          records: []
        },
        consultationDate: emissionDate
      },
      
      // Dados adicionais
      additionalData: {
        simplesNacional: {
          isOptant: creditScoreData.simplesOptant || false,
          optionDate: creditScoreData.simplesOptionDate || 'Não informado',
          exclusionDate: creditScoreData.simplesExclusionDate || 'Não informado',
          status: creditScoreData.simplesStatus || 'Não informado'
        },
        receitaFederal: {
          registrationStatus: creditScoreData.rfStatus || 'Não informado',
          lastUpdate: creditScoreData.rfLastUpdate || 'Não informado',
          specialSituation: creditScoreData.rfSpecialSituation || 'Não informado',
          specialSituationDate: creditScoreData.rfSpecialSituationDate || 'Não informado'
        },
        fgts: {
          regularityStatus: creditScoreData.fgtsStatus || 'Não consultado',
          certificateNumber: creditScoreData.fgtsCertificate || 'Não informado',
          validityDate: creditScoreData.fgtsValidity || 'Não informado'
        },
        tcu: {
          hasRestrictions: creditScoreData.tcuRestrictions || false,
          restrictionType: creditScoreData.tcuRestrictionType || 'Nenhuma',
          restrictionDate: creditScoreData.tcuRestrictionDate || 'Não informado',
          penaltyAmount: creditScoreData.tcuPenaltyAmount || 'R$ 0,00'
        }
      }
    };
  }
  
  /**
   * Calcula quantas consultas foram realizadas com sucesso
   */
  private static calculateAvailableConsultations(data: any): number {
    let count = 0;
    
    if (data.score) count++; // Score QUOD
    if (data.companyName) count++; // Cadastro PJ Plus
    if (data.cndStatus) count++; // CND
    if (data.hasProtests !== undefined) count++; // Detalhamento Negativo
    
    // Consultas sempre disponíveis
    count += 4; // Protestos SP, Receita Federal, Simples Nacional, TCU
    
    return count;
  }
  
  /**
   * Calcula o nível de risco baseado no score
   */
  private static calculateRiskLevel(score: number): string {
    if (score >= 700) return 'Baixo';
    if (score >= 500) return 'Médio';
    return 'Alto';
  }
  
  /**
   * Retorna a classe CSS para o nível de risco
   */
  private static getRiskClass(score: number): string {
    if (score >= 700) return 'risk-low';
    if (score >= 500) return 'risk-medium';
    return 'risk-high';
  }
  
  /**
   * Retorna a faixa do score
   */
  private static getScoreRange(score: number): string {
    if (score >= 800) return 'Excelente (800-1000)';
    if (score >= 700) return 'Muito Bom (700-799)';
    if (score >= 600) return 'Bom (600-699)';
    if (score >= 500) return 'Regular (500-599)';
    if (score >= 400) return 'Ruim (400-499)';
    return 'Muito Ruim (0-399)';
  }
}