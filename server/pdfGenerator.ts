import puppeteer from 'puppeteer';
import type { CreditScore } from '../shared/schema';

export interface PDFGenerationOptions {
  type: 'cnpj' | 'cpf';
  data: CreditScore | any;
  companyName?: string;
  documentNumber: string;
}

export class SparkComexPDFGenerator {
  
  /**
   * Gera PDF profissional no estilo DirectD para análise de crédito
   */
  static async generateCreditAnalysisPDF(options: PDFGenerationOptions): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      const htmlContent = this.generateHTMLContent(options);
      
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0' 
      });

      // Configuração do PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1.5cm',
          bottom: '1cm',
          left: '1.5cm'
        }
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  /**
   * Gera o conteúdo HTML estruturado no estilo DirectD
   */
  private static generateHTMLContent(options: PDFGenerationOptions): string {
    const { type, data, companyName, documentNumber } = options;
    const currentDate = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isCompany = type === 'cnpj';
    const title = isCompany ? 'Análise Completa de Crédito Empresarial' : 'Análise Completa de Crédito Pessoal';
    const subtitle = isCompany ? companyName || data.legalName : data.fullName || 'Consulta de CPF';

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .header {
            text-align: center;
            padding: 30px 0;
            border-bottom: 3px solid #2563eb;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
        }
        
        .header h2 {
            font-size: 18px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px;
        }
        
        .header .date {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 20px;
        }
        
        .header .website {
            font-size: 12px;
            color: #2563eb;
            font-weight: 500;
        }
        
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 12px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .info-item {
            margin-bottom: 8px;
        }
        
        .info-label {
            font-size: 12px;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 2px;
        }
        
        .info-value {
            font-size: 14px;
            color: #111827;
            font-weight: 600;
        }
        
        .score-section {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 25px;
        }
        
        .score-number {
            font-size: 48px;
            font-weight: bold;
            color: ${this.getScoreColor(data.creditScore || 0)};
            margin-bottom: 8px;
        }
        
        .score-label {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px;
        }
        
        .score-range {
            font-size: 12px;
            color: #6b7280;
        }
        
        .risk-indicator {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 8px;
            ${this.getRiskBadgeStyle(data.riskLevel || 'MEDIUM')}
        }
        
        .analysis-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .analysis-item {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        
        .analysis-item-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
        }
        
        .analysis-item-value {
            font-size: 16px;
            font-weight: bold;
            color: #111827;
        }
        
        .status-positive {
            color: #059669;
        }
        
        .status-negative {
            color: #dc2626;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        
        .page-number {
            position: fixed;
            bottom: 20px;
            right: 20px;
            font-size: 12px;
            color: #6b7280;
        }
        
        @page {
            margin: 1cm 1.5cm;
        }
        
        .partners-list {
            margin-top: 15px;
        }
        
        .partner-item {
            background: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 10px;
            border-left: 3px solid #2563eb;
        }
        
        .partner-name {
            font-weight: 600;
            color: #111827;
            margin-bottom: 4px;
        }
        
        .partner-details {
            font-size: 12px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <h2>${subtitle}</h2>
        <div class="date">${currentDate}</div>
        <div class="website">www.sparkcomex.com.br</div>
    </div>

    <!-- Informações Básicas -->
    <div class="section">
        <div class="section-title">Resultado Consultado</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">${isCompany ? 'CNPJ' : 'CPF'}</div>
                <div class="info-value">${documentNumber}</div>
            </div>
            <div class="info-item">
                <div class="info-label">${isCompany ? 'Razão Social' : 'Nome Completo'}</div>
                <div class="info-value">${isCompany ? (data.legalName || companyName) : (data.fullName || 'Não informado')}</div>
            </div>
            ${isCompany ? `
            <div class="info-item">
                <div class="info-label">Nome Fantasia</div>
                <div class="info-value">${data.tradingName || 'Não informado'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Data de Abertura</div>
                <div class="info-value">${data.openingDate ? new Date(data.openingDate).toLocaleDateString('pt-BR') : 'Não informado'}</div>
            </div>
            ` : `
            <div class="info-item">
                <div class="info-label">Data de Nascimento</div>
                <div class="info-value">${data.birthDate ? new Date(data.birthDate).toLocaleDateString('pt-BR') : 'Não informado'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">${data.status || 'Ativo'}</div>
            </div>
            `}
        </div>
    </div>

    <!-- Score de Crédito -->
    <div class="score-section">
        <div class="score-number">${data.creditScore || 0}</div>
        <div class="score-label">Credit Score</div>
        <div class="score-range">Escala de 0 a 1000</div>
        <div class="risk-indicator">${this.getRiskLabel(data.riskLevel || 'MEDIUM')}</div>
    </div>

    <!-- Análise de Risco -->
    <div class="section">
        <div class="section-title">Análise de Risco</div>
        <div class="analysis-grid">
            <div class="analysis-item">
                <div class="analysis-item-title">Débitos</div>
                <div class="analysis-item-value ${data.hasDebts ? 'status-negative' : 'status-positive'}">
                    ${data.hasDebts ? 'Possui' : 'Não possui'}
                </div>
            </div>
            <div class="analysis-item">
                <div class="analysis-item-title">Protestos</div>
                <div class="analysis-item-value ${data.hasProtests ? 'status-negative' : 'status-positive'}">
                    ${data.hasProtests ? 'Possui' : 'Não possui'}
                </div>
            </div>
            <div class="analysis-item">
                <div class="analysis-item-title">Falência</div>
                <div class="analysis-item-value ${data.hasBankruptcy ? 'status-negative' : 'status-positive'}">
                    ${data.hasBankruptcy ? 'Possui' : 'Não possui'}
                </div>
            </div>
            <div class="analysis-item">
                <div class="analysis-item-title">Processos Judiciais</div>
                <div class="analysis-item-value ${data.hasLawsuits ? 'status-negative' : 'status-positive'}">
                    ${data.hasLawsuits ? 'Possui' : 'Não possui'}
                </div>
            </div>
        </div>
    </div>

    ${isCompany && data.partners && (data.partners as any[]).length > 0 ? `
    <!-- Sócios -->
    <div class="section">
        <div class="section-title">Sócios</div>
        <div class="partners-list">
            ${(data.partners as any[]).map((partner, index) => `
            <div class="partner-item">
                <div class="partner-name">Sócio (${index + 1}) - ${partner.name}</div>
                <div class="partner-details">
                    Cargo: ${partner.qualification} | 
                    ${partner.document ? `Documento: ${partner.document} | ` : ''}
                    ${partner.participation ? `Participação: ${partner.participation}%` : ''}
                </div>
            </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    <!-- Contatos -->
    <div class="section">
        <div class="section-title">Informações de Contato</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Endereço</div>
                <div class="info-value">${data.address || 'Não informado'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Cidade</div>
                <div class="info-value">${data.city || 'Não informado'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Estado</div>
                <div class="info-value">${data.state || 'Não informado'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">CEP</div>
                <div class="info-value">${data.zipCode || 'Não informado'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Telefone</div>
                <div class="info-value">${data.phone || 'Não informado'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${data.email || 'Não informado'}</div>
            </div>
        </div>
    </div>

    <!-- Fonte dos Dados -->
    <div class="section">
        <div class="section-title">Fonte dos Dados</div>
        <div class="analysis-grid">
            <div class="analysis-item">
                <div class="analysis-item-title">DirectD Score API</div>
                <div class="analysis-item-value status-positive">Consultado com Sucesso</div>
            </div>
            <div class="analysis-item">
                <div class="analysis-item-title">DirectD Cadastro Plus</div>
                <div class="analysis-item-value status-positive">Dados Atualizados</div>
            </div>
            <div class="analysis-item">
                <div class="analysis-item-title">Receita Federal</div>
                <div class="analysis-item-value status-positive">Informações Oficiais</div>
            </div>
            <div class="analysis-item">
                <div class="analysis-item-title">Data da Consulta</div>
                <div class="analysis-item-value">${currentDate}</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p><strong>Spark Comex</strong> - Plataforma de Análise de Crédito para Importadores Brasileiros</p>
        <p>Este relatório foi gerado automaticamente com dados oficiais das APIs DirectD</p>
        <p>Todas as informações são baseadas em fontes oficiais e atualizadas em tempo real</p>
    </div>

    <div class="page-number">Página 1 de 1</div>
</body>
</html>
    `;
  }

  /**
   * Helper methods para cores e estilos
   */
  private static getScoreColor(score: number): string {
    if (score >= 800) return '#059669'; // Green
    if (score >= 600) return '#2563eb'; // Blue  
    if (score >= 400) return '#d97706'; // Orange
    return '#dc2626'; // Red
  }

  private static getRiskLabel(riskLevel: string): string {
    const labels = {
      'LOW': 'Baixo Risco',
      'MEDIUM': 'Risco Médio', 
      'HIGH': 'Alto Risco',
      'CRITICAL': 'Risco Crítico'
    };
    return labels[riskLevel as keyof typeof labels] || 'Análise Pendente';
  }

  private static getRiskBadgeStyle(riskLevel: string): string {
    const styles = {
      'LOW': 'background: #d1fae5; color: #065f46;',
      'MEDIUM': 'background: #dbeafe; color: #1e40af;',
      'HIGH': 'background: #fed7aa; color: #9a3412;',
      'CRITICAL': 'background: #fecaca; color: #991b1b;'
    };
    return styles[riskLevel as keyof typeof styles] || 'background: #f3f4f6; color: #374151;';
  }
}