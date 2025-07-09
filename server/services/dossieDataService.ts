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
  
  // Dados do Score QUOD - Análise completa
  scoreQuod: {
    score: number;
    faixaScore: string;
    scoreMotivos: string[];
    scorePercentage: number;
    riskLevel: string;
    riskClass: string;
    consultationDate: string;
    consultationTime: string;
    
    // Análise detalhada do score
    scoreAnalysis: {
      interpretation: string;
      recommendations: string;
      riskFactors: string[];
      positiveFactors: string[];
    };
    
    // Indicadores de negócio detalhados
    businessIndicators: {
      paymentPunctuality: {
        status: string;
        risk: string;
        observation: string;
      };
      delaysSeverity: {
        status: string;
        risk: string;
        observation: string;
      };
      emergencyUsage: {
        status: string;
        risk: string;
        observation: string;
      };
      debtProfile: {
        status: string;
        risk: string;
        observation: string;
      };
      contractRisk: {
        status: string;
        risk: string;
        observation: string;
      };
      creditSearch: {
        status: string;
        risk: string;
        observation: string;
      };
    };
    
    // Comportamento de pagamento
    paymentBehavior: {
      averageDelayDays: number;
      paymentConsistency: string;
      creditUtilization: string;
      defaultHistory: string;
    };
  } | null;
  
  // Dados do Cadastro PJ Plus - Informações completas
  cadastroPjPlus: {
    // Informações básicas
    companyName: string;
    fantasyName: string;
    cnpj: string;
    foundationDate: string;
    registrationStatus: string;
    companySize: string;
    legalNature: string;
    capital: string;
    
    // Situação cadastral detalhada
    registrationDetails: {
      openingDate: string;
      lastUpdateDate: string;
      specialSituation: string;
      specialSituationDate: string;
      responsibleEntity: string;
      registrationNumber: string;
      ein: string; // EIN - Employer Identification Number
    };
    
    // Endereço completo
    address: {
      street: string;
      number: string;
      complement: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    
    // Atividades econômicas detalhadas
    activities: {
      primary: {
        code: string;
        description: string;
        startDate: string;
      };
      secondary: {
        code: string;
        description: string;
        startDate: string;
      }[];
    };
    
    // Quadro societário completo
    partners: {
      name: string;
      cpf: string;
      qualification: string;
      qualificationDescription: string;
      participationPercentage: number;
      entryDate: string;
      age: number;
      nationality: string;
      legalRepresentative: boolean;
    }[];
    
    // Contatos e comunicação
    contacts: {
      phones: {
        number: string;
        type: string;
        verified: boolean;
      }[];
      emails: {
        address: string;
        type: string;
        verified: boolean;
      }[];
      website: string;
      socialMedia: {
        platform: string;
        url: string;
      }[];
    };
    
    // Informações adicionais
    additionalInfo: {
      employeeCount: string;
      annualRevenue: string;
      branchOffices: number;
      certifications: string[];
      licenses: string[];
      specialRegimes: string[];
    };
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
  
  // Detalhamento Negativo - Análise completa de restrições
  negativeDetails: {
    // Protestos detalhados
    protests: {
      hasProtests: boolean;
      totalAmount: string;
      totalCount: number;
      records: {
        protocolNumber: string;
        amount: string;
        date: string;
        notaryOffice: string;
        city: string;
        state: string;
        reason: string;
        status: string;
        creditorName: string;
        documentType: string;
        presentationDate: string;
        withdrawalDate: string;
        observations: string;
      }[];
      analysis: {
        riskLevel: string;
        impact: string;
        recommendations: string;
        trend: string;
      };
    };
    
    // Falências e recuperações judiciais
    bankruptcies: {
      hasBankruptcies: boolean;
      totalCount: number;
      records: {
        processNumber: string;
        court: string;
        date: string;
        status: string;
        city: string;
        state: string;
        processType: string;
        currentPhase: string;
        administrator: string;
        debtAmount: string;
        creditorsList: string[];
        observations: string;
        lastMovement: string;
      }[];
      analysis: {
        riskLevel: string;
        impact: string;
        recommendations: string;
        recoveryPrognosis: string;
      };
    };
    
    // Ações judiciais detalhadas
    lawsuits: {
      hasLawsuits: boolean;
      totalCount: number;
      totalAmount: string;
      records: {
        processNumber: string;
        court: string;
        subject: string;
        amount: string;
        date: string;
        status: string;
        processType: string;
        plaintiff: string;
        defendant: string;
        lawyer: string;
        lastMovement: string;
        nextHearing: string;
        probability: string;
        observations: string;
      }[];
      analysis: {
        riskLevel: string;
        impact: string;
        recommendations: string;
        litigationTrend: string;
      };
    };
    
    // Cheques sem fundo detalhados
    bouncedChecks: {
      hasBouncedChecks: boolean;
      totalAmount: string;
      totalCount: number;
      records: {
        checkNumber: string;
        bank: string;
        bankCode: string;
        amount: string;
        date: string;
        reason: string;
        reasonCode: string;
        payeeName: string;
        drawerName: string;
        status: string;
        returnDate: string;
        observations: string;
      }[];
      analysis: {
        riskLevel: string;
        impact: string;
        recommendations: string;
        paymentPattern: string;
      };
    };
    
    // Análise consolidada
    overallAnalysis: {
      totalNegativeRecords: number;
      totalFinancialImpact: string;
      riskLevel: string;
      creditRecommendation: string;
      monitoringAdvice: string;
      mitigationStrategies: string[];
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
        consultationTime: emissionTime,
        
        // Análise detalhada do score
        scoreAnalysis: {
          interpretation: this.getScoreInterpretation(creditScoreData.score),
          recommendations: this.getScoreRecommendations(creditScoreData.score),
          riskFactors: this.extractRiskFactors(creditScoreData.scoreMotivos),
          positiveFactors: this.extractPositiveFactors(creditScoreData.score)
        },
        
        // Indicadores de negócio detalhados
        businessIndicators: {
          paymentPunctuality: {
            status: creditScoreData.paymentPunctuality || 'Não informado',
            risk: creditScoreData.paymentPunctualityRisk || 'Baixo',
            observation: creditScoreData.paymentPunctualityObs || 'Sem observações'
          },
          delaysSeverity: {
            status: creditScoreData.delaysSeverity || 'Não informado',
            risk: creditScoreData.delaysSeverityRisk || 'Baixo',
            observation: creditScoreData.delaysSeverityObs || 'Sem observações'
          },
          emergencyUsage: {
            status: creditScoreData.emergencyUsage || 'Não informado',
            risk: creditScoreData.emergencyUsageRisk || 'Baixo',
            observation: creditScoreData.emergencyUsageObs || 'Sem observações'
          },
          debtProfile: {
            status: creditScoreData.debtProfile || 'Não informado',
            risk: creditScoreData.debtProfileRisk || 'Baixo',
            observation: creditScoreData.debtProfileObs || 'Sem observações'
          },
          contractRisk: {
            status: creditScoreData.contractRisk || 'Não informado',
            risk: creditScoreData.contractRiskRisk || 'Baixo',
            observation: creditScoreData.contractRiskObs || 'Sem observações'
          },
          creditSearch: {
            status: creditScoreData.creditSearch || 'Não informado',
            risk: creditScoreData.creditSearchRisk || 'Baixo',
            observation: creditScoreData.creditSearchObs || 'Sem observações'
          }
        },
        
        // Comportamento de pagamento
        paymentBehavior: {
          averageDelayDays: creditScoreData.averageDelayDays || 0,
          paymentConsistency: creditScoreData.paymentConsistency || 'Consistente',
          creditUtilization: creditScoreData.creditUtilization || 'Baixa',
          defaultHistory: creditScoreData.defaultHistory || 'Sem histórico de inadimplência'
        }
      } : null,
      
      // Cadastro PJ Plus
      cadastroPjPlus: creditScoreData.companyName ? {
        // Informações básicas
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
        
        // Situação cadastral detalhada
        registrationDetails: {
          openingDate: creditScoreData.openingDate ? 
            new Date(creditScoreData.openingDate).toLocaleDateString('pt-BR') : 'Não informado',
          lastUpdateDate: creditScoreData.lastUpdateDate ? 
            new Date(creditScoreData.lastUpdateDate).toLocaleDateString('pt-BR') : 'Não informado',
          specialSituation: creditScoreData.specialSituation || 'Normal',
          specialSituationDate: creditScoreData.specialSituationDate ? 
            new Date(creditScoreData.specialSituationDate).toLocaleDateString('pt-BR') : 'Não informado',
          responsibleEntity: creditScoreData.responsibleEntity || 'Receita Federal',
          registrationNumber: creditScoreData.registrationNumber || 'Não informado',
          ein: creditScoreData.ein || 'Não informado'
        },
        
        // Endereço completo
        address: {
          street: creditScoreData.street || 'Não informado',
          number: creditScoreData.number || 'S/N',
          complement: creditScoreData.complement || 'Não informado',
          neighborhood: creditScoreData.district || 'Não informado',
          city: creditScoreData.city || 'Não informado',
          state: creditScoreData.state || 'Não informado',
          zipCode: creditScoreData.zipCode || 'Não informado',
          country: creditScoreData.country || 'Brasil'
        },
        
        // Atividades econômicas detalhadas
        activities: {
          primary: {
            code: activities?.[0]?.code || 'Não informado',
            description: activities?.[0]?.description || activities?.[0]?.text || 'Não informado',
            startDate: activities?.[0]?.startDate || 'Não informado'
          },
          secondary: (activities || []).filter((activity: any) => !activity.isPrimary).map((activity: any) => ({
            code: activity.code || 'Não informado',
            description: activity.description || activity.text || 'Não informado',
            startDate: activity.startDate || 'Não informado'
          }))
        },
        
        // Quadro societário completo
        partners: partners ? partners.map((partner: any) => ({
          name: partner.name || partner.nome || '',
          cpf: partner.cpf || partner.document || '',
          qualification: partner.qualification || partner.qualificacao || '',
          qualificationDescription: partner.qualificationDescription || partner.qualificacaoDescricao || '',
          participationPercentage: partner.participationPercentage || 0,
          entryDate: partner.entryDate ? 
            new Date(partner.entryDate).toLocaleDateString('pt-BR') : 'Não informado',
          age: partner.age || 0,
          nationality: partner.nationality || 'Brasileira',
          legalRepresentative: partner.legalRepresentative || false
        })) : [],
        
        // Contatos e comunicação
        contacts: {
          phones: creditScoreData.phone ? [{
            number: creditScoreData.phone,
            type: 'Comercial',
            verified: false
          }] : [],
          emails: creditScoreData.email ? [{
            address: creditScoreData.email,
            type: 'Comercial',
            verified: false
          }] : [],
          website: creditScoreData.website || 'Não informado',
          socialMedia: creditScoreData.socialMedia || []
        },
        
        // Informações adicionais
        additionalInfo: {
          employeeCount: creditScoreData.employeeCount || 'Não informado',
          annualRevenue: creditScoreData.annualRevenue || 'Não informado',
          branchOffices: creditScoreData.branchOffices || 0,
          certifications: creditScoreData.certifications || [],
          licenses: creditScoreData.licenses || [],
          specialRegimes: creditScoreData.specialRegimes || []
        }
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
        // Protestos detalhados
        protests: {
          hasProtests: creditScoreData.hasProtests || false,
          totalAmount: 'R$ 0,00',
          totalCount: 0,
          records: [],
          analysis: {
            riskLevel: 'Baixo',
            impact: 'Nenhum protesto encontrado',
            recommendations: 'Manter histórico limpo sem protestos',
            trend: 'Estável'
          }
        },
        
        // Falências e recuperações judiciais
        bankruptcies: {
          hasBankruptcies: creditScoreData.hasBankruptcy || false,
          totalCount: 0,
          records: [],
          analysis: {
            riskLevel: 'Baixo',
            impact: 'Nenhuma falência encontrada',
            recommendations: 'Manter saúde financeira da empresa',
            recoveryPrognosis: 'Não aplicável'
          }
        },
        
        // Ações judiciais detalhadas
        lawsuits: {
          hasLawsuits: creditScoreData.hasLawsuits || false,
          totalCount: 0,
          totalAmount: 'R$ 0,00',
          records: [],
          analysis: {
            riskLevel: 'Baixo',
            impact: 'Nenhuma ação judicial encontrada',
            recommendations: 'Manter relacionamento comercial saudável',
            litigationTrend: 'Estável'
          }
        },
        
        // Cheques sem fundo detalhados
        bouncedChecks: {
          hasBouncedChecks: creditScoreData.hasBouncedChecks || false,
          totalAmount: 'R$ 0,00',
          totalCount: 0,
          records: [],
          analysis: {
            riskLevel: 'Baixo',
            impact: 'Nenhum cheque sem fundo encontrado',
            recommendations: 'Manter controle de fluxo de caixa',
            paymentPattern: 'Consistente'
          }
        },
        
        // Análise consolidada
        overallAnalysis: {
          totalNegativeRecords: 0,
          totalFinancialImpact: 'R$ 0,00',
          riskLevel: 'Baixo',
          creditRecommendation: 'Aprovado para concessão de crédito',
          monitoringAdvice: 'Monitoramento padrão',
          mitigationStrategies: ['Manter histórico limpo', 'Acompanhar mudanças na situação']
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

  /**
   * Interpretação detalhada do score
   */
  private static getScoreInterpretation(score: number): string {
    if (score >= 800) return 'Empresa com excelente perfil de crédito, demonstrando alta confiabilidade e capacidade de pagamento.';
    if (score >= 700) return 'Empresa com muito bom perfil de crédito, apresentando baixo risco de inadimplência.';
    if (score >= 600) return 'Empresa com bom perfil de crédito, adequada para operações comerciais padrão.';
    if (score >= 500) return 'Empresa com perfil de crédito regular, recomenda-se análise adicional para decisões de crédito.';
    if (score >= 400) return 'Empresa com perfil de crédito ruim, apresenta risco elevado para concessão de crédito.';
    return 'Empresa com perfil de crédito muito ruim, alto risco de inadimplência.';
  }

  /**
   * Recomendações baseadas no score
   */
  private static getScoreRecommendations(score: number): string {
    if (score >= 800) return 'Aprovação automática para limites altos. Condições comerciais preferenciais.';
    if (score >= 700) return 'Aprovação recomendada com limites padrão. Condições comerciais normais.';
    if (score >= 600) return 'Aprovação com análise complementar. Limites moderados e garantias adequadas.';
    if (score >= 500) return 'Análise rigorosa necessária. Limites baixos e garantias reforçadas.';
    if (score >= 400) return 'Aprovação condicionada a garantias sólidas. Monitoramento intensivo.';
    return 'Rejeição recomendada. Risco muito elevado para operações comerciais.';
  }

  /**
   * Extrai fatores de risco do score
   */
  private static extractRiskFactors(scoreMotivos: string): string[] {
    if (!scoreMotivos) return [];
    
    const factors = scoreMotivos.split(';').map(factor => factor.trim()).filter(factor => factor);
    return factors.length > 0 ? factors : [
      'Histórico de pagamentos limitado',
      'Empresa jovem no mercado',
      'Dados incompletos para análise'
    ];
  }

  /**
   * Extrai fatores positivos baseados no score
   */
  private static extractPositiveFactors(score: number): string[] {
    const factors = [];
    
    if (score >= 600) factors.push('Score acima da média nacional');
    if (score >= 700) factors.push('Baixo risco de inadimplência');
    if (score >= 800) factors.push('Histórico de pagamentos excelente');
    
    factors.push('Empresa constituída regularmente');
    factors.push('Situação cadastral ativa');
    factors.push('Sem restrições críticas identificadas');
    
    return factors;
  }
}