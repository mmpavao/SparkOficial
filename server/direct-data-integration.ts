// Direct.data API Integration Module
// Separate file to prevent syntax conflicts

export interface DirectDataResponse {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  dataFundacao: string;
  situacaoCadastral: string;
  porte: string;
  naturezaJuridica: {
    codigo: string;
    descricao: string;
    tipo: string;
  };
  cnae: {
    principal: {
      codigo: string;
      descricao: string;
    };
    secundarios: any[];
  };
  operacionalData: {
    quantidadeFuncionarios: number;
    faixaFuncionarios: string;
    quantidadeFiliais: string;
    matriz: boolean;
    orgaoPublico: string;
    ramo: string;
    tipoEmpresa: string;
  };
  financialData: {
    faixaFaturamento: string;
    faturamentoMedioCNAE: string;
    faturamentoPresumido: string;
    tributacao: string;
    opcaoMEI: string;
    opcaoSimples: string;
  };
  contatos: {
    telefones: any[];
    enderecos: any[];
    emails: any[];
  };
  socios: any[];
  ultimaAtualizacao: string;
  source: string;
  timestamp: string;
}

// Direct.data API Integration - Company Registration Plus
export async function callDirectDataAPI(cnpj: string): Promise<DirectDataResponse | null> {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  console.log('🔍 Calling Direct.data Company Registration Plus API for CNPJ:', cleanCnpj);
  
  try {
    const response = await fetch(`https://apiv3.directd.com.br/api/CadastroPessoaJuridicaPlus?CNPJ=${cleanCnpj}&TOKEN=${process.env.DIRECTD_API_TOKEN}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Spark-Comex/1.0'
      }
    });

    if (!response.ok) {
      console.error('❌ Direct.data API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('✅ Direct.data API response received successfully');
    
    // Map Direct.data response to interface-compatible structure
    const mappedData: DirectDataResponse = {
      cnpj: data.retorno?.cnpj || cleanCnpj,
      razaoSocial: data.retorno?.razaoSocial || '',
      nomeFantasia: data.retorno?.nomeFantasia || '',
      dataFundacao: data.retorno?.dataFundacao || '',
      situacaoCadastral: data.retorno?.situacaoCadastral || '',
      porte: data.retorno?.porte || '',
      naturezaJuridica: {
        codigo: data.retorno?.naturezaJuridicaCodigo || '',
        descricao: data.retorno?.naturezaJuridicaDescricao || '',
        tipo: data.retorno?.naturezaJuridicaTipo || ''
      },
      cnae: {
        principal: {
          codigo: data.retorno?.cnaeCodigo || '',
          descricao: data.retorno?.cnaeDescricao || ''
        },
        secundarios: data.retorno?.cnaEsSecundarios || []
      },
      operacionalData: {
        quantidadeFuncionarios: data.retorno?.quantidadeFuncionarios || 0,
        faixaFuncionarios: data.retorno?.faixaFuncionarios || '',
        quantidadeFiliais: data.retorno?.quantidadeFiliais || '',
        matriz: data.retorno?.matriz || true,
        orgaoPublico: data.retorno?.orgaoPublico || '',
        ramo: data.retorno?.ramo || '',
        tipoEmpresa: data.retorno?.tipoEmpresa || ''
      },
      financialData: {
        faixaFaturamento: data.retorno?.faixaFaturamento || '',
        faturamentoMedioCNAE: data.retorno?.faturamentoMedioCNAE || '',
        faturamentoPresumido: data.retorno?.faturamentoPresumido || '',
        tributacao: data.retorno?.tributacao || '',
        opcaoMEI: data.retorno?.opcaoMEI || '',
        opcaoSimples: data.retorno?.opcaoSimples || ''
      },
      contatos: {
        telefones: data.retorno?.telefones || [],
        enderecos: data.retorno?.enderecos || [],
        emails: data.retorno?.emails || []
      },
      socios: data.retorno?.socios || [],
      ultimaAtualizacao: data.retorno?.ultimaAtualizacaoPJ || '',
      source: 'DIRECT_DATA',
      timestamp: new Date().toISOString()
    };

    return mappedData;
  } catch (error) {
    console.error('❌ Direct.data API request failed:', error);
    return null;
  }
}

// Enhanced credit score calculation using Direct.data
export function calculateEnhancedCreditScore(companyData: DirectDataResponse): number {
  let baseScore = 600; // Start with neutral base
  
  // Company status bonus
  if (companyData.situacaoCadastral === 'ATIVA') {
    baseScore += 100;
  }
  
  // Company size bonus
  const porte = companyData.porte?.toLowerCase();
  if (porte?.includes('grande')) {
    baseScore += 80;
  } else if (porte?.includes('média')) {
    baseScore += 60;
  } else if (porte?.includes('pequena')) {
    baseScore += 40;
  }
  
  // Employee range bonus
  const employees = companyData.operacionalData?.quantidadeFuncionarios || 0;
  if (employees > 100) {
    baseScore += 60;
  } else if (employees > 50) {
    baseScore += 40;
  } else if (employees > 10) {
    baseScore += 20;
  }
  
  // Business age bonus
  if (companyData.dataFundacao) {
    const foundingYear = new Date(companyData.dataFundacao).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - foundingYear;
    
    if (age > 10) {
      baseScore += 80;
    } else if (age > 5) {
      baseScore += 50;
    } else if (age > 2) {
      baseScore += 30;
    }
  }
  
  // Revenue range bonus
  const faturamento = companyData.financialData?.faixaFaturamento?.toLowerCase();
  if (faturamento?.includes('acima') || faturamento?.includes('superior')) {
    baseScore += 100;
  } else if (faturamento?.includes('grande') || faturamento?.includes('alta')) {
    baseScore += 80;
  } else if (faturamento?.includes('média')) {
    baseScore += 60;
  }
  
  // Ensure score stays within realistic bounds
  return Math.min(Math.max(baseScore, 300), 950);
}

export function determineCreditRating(score: number): string {
  if (score >= 850) return 'EXCELLENT';
  if (score >= 750) return 'GOOD';
  if (score >= 650) return 'FAIR';
  if (score >= 550) return 'POOR';
  return 'VERY_POOR';
}

export function determineRiskLevel(score: number): string {
  if (score >= 800) return 'LOW';
  if (score >= 650) return 'MEDIUM';
  if (score >= 500) return 'HIGH';
  return 'VERY_HIGH';
}

export function generateNeutralCreditData(cnpj: string) {
  return {
    cnpj: cnpj,
    creditRating: 'PENDING_ANALYSIS',
    bankingScore: 750,
    paymentBehavior: 'UNKNOWN',
    creditHistory: 'PENDING_VERIFICATION',
    financialProfile: 'PENDING_ANALYSIS',
    riskLevel: 'MEDIUM',
    hasDebts: false,
    debtDetails: null,
    hasProtests: false,
    protestDetails: null,
    hasLawsuits: false,
    lawsuitDetails: null,
    hasBankruptcy: false,
    bankruptcyDetails: null,
    companyName: 'Análise Temporariamente Indisponível',
    companyStatus: 'Em processamento',
    foundedDate: null,
    source: 'NEUTRAL',
    timestamp: new Date().toISOString()
  };
}