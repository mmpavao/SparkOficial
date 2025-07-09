import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DossieDataService, DossieDataComplete } from './dossieDataService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register Handlebars helpers
handlebars.registerHelper('formatCNPJ', (cnpj: string) => {
  if (!cnpj) return '';
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length === 14) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
  }
  return cnpj;
});

handlebars.registerHelper('maskCNPJ', (cnpj: string) => {
  if (!cnpj) return '';
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length === 14) {
    return `${clean.slice(0, 2)}.***.***/0001-${clean.slice(12)}`;
  }
  return cnpj;
});

handlebars.registerHelper('maskCPF', (cpf: string) => {
  if (!cpf) return '';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length === 11) {
    return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
  }
  return cpf;
});

handlebars.registerHelper('formatDate', (date: string) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return date;
  }
});

handlebars.registerHelper('formatDateTime', (date: string) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toLocaleString('pt-BR');
  } catch {
    return date;
  }
});

export interface CreditScoreData {
  score: number;
  consultationDate: string;
  riskLevel: string;
  companyName: string;
  cnpj: string;
  fantasyName?: string;
  foundationDate?: string;
  registrationStatus?: string;
  companySize?: string;
  legalNature?: string;
  addresses?: Array<{
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    zipCode: string;
    complement?: string;
  }>;
  partners?: Array<{
    name: string;
    document: string;
    participation: number;
    position: string;
    entryDate: string;
  }>;
  cndStatus?: string;
  cndHasDebts?: boolean;
  cndCertificateNumber?: string;
  cndConsultationDate?: string;
  negativeStatus?: string;
  negativeConsultationDate?: string;
}

export interface DossieData {
  companyName: string;
  companyLegalName: string;
  cnpj: string;
  emissionDate: string;
  emissionTime: string;
  totalConsultations: number;
  availableConsultations: number;
  unavailableConsultations: number;
  consultations: Array<{
    name: string;
    available: boolean;
  }>;
  scoreData?: CreditScoreData;
  companyData?: {
    cnpj: string;
    companyName: string;
    fantasyName: string;
    foundationDate: string;
    registrationStatus: string;
    companySize: string;
    legalNature: string;
    addresses: Array<{
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      zipCode: string;
      complement?: string;
    }>;
    partners?: Array<{
      name: string;
      document: string;
      participation: number;
      position: string;
      entryDate: string;
    }>;
  };
  cndData?: {
    hasDebts: boolean;
    consultationDate: string;
    certificateNumber: string;
    status: string;
  };
  negativeData?: {
    document: string;
    consultationDate: string;
    status: string;
  };
}

export class PDFService {
  private template: string;

  constructor() {
    // Try multiple paths for template file to support both development and production
    const possiblePaths = [
      path.join(__dirname, '../templates/dossie-template.html'), // Development path
      path.join(__dirname, 'templates/dossie-template.html'),     // Production path (after build)
      path.join(process.cwd(), 'server/templates/dossie-template.html'), // Alternative path
      path.join(process.cwd(), 'dist/templates/dossie-template.html'),    // Dist path
      path.join(process.cwd(), 'templates/dossie-template.html')           // Root template path
    ];
    
    let templatePath = '';
    let templateContent = '';
    
    for (const possiblePath of possiblePaths) {
      try {
        templateContent = readFileSync(possiblePath, 'utf8');
        templatePath = possiblePath;
        console.log(`✅ Template found at: ${templatePath}`);
        break;
      } catch (error) {
        console.log(`❌ Template not found at: ${possiblePath}`);
        continue;
      }
    }
    
    if (!templateContent) {
      console.warn(`⚠️  Template file not found in any of the following paths: ${possiblePaths.join(', ')}`);
      console.log('📄 Using fallback template...');
      // Use a fallback template if file not found
      this.template = this.getFallbackTemplate();
    } else {
      this.template = templateContent;
    }
    
    // Register Handlebars helpers
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers() {
    // Helper to format CNPJ
    handlebars.registerHelper('formatCNPJ', (cnpj: string) => {
      if (!cnpj) return '';
      return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    });

    // Helper to format date
    handlebars.registerHelper('formatDate', (date: string) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('pt-BR');
    });

    // Helper to format date and time
    handlebars.registerHelper('formatDateTime', (date: string) => {
      if (!date) return '';
      return new Date(date).toLocaleString('pt-BR');
    });

    // Helper to mask CPF
    handlebars.registerHelper('maskCPF', (cpf: string) => {
      if (!cpf) return '';
      return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    });

    // Helper to mask CNPJ
    handlebars.registerHelper('maskCNPJ', (cnpj: string) => {
      if (!cnpj) return '';
      return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    });

    // Helper to format currency
    handlebars.registerHelper('formatCurrency', (value: string | number) => {
      if (!value) return 'R$ 0,00';
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    });

    // Helper for equality comparison
    handlebars.registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });
  }

  async generateDossiePDF(data: DossieData): Promise<Buffer> {
    return await this.generatePDFFromData(data);
  }
  
  /**
   * Gera PDF usando o serviço isolado de dados das APIs
   */
  async generateDossiePDFFromCreditScore(creditScore: any): Promise<Buffer> {
    // Use the isolated service to process all API data
    const completeData = DossieDataService.processApiData(creditScore);
    
    // Pass complete data directly to template
    return await this.generatePDFFromCompleteData(completeData);
  }
  
  private async generatePDFFromCompleteData(data: DossieDataComplete): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-translate',
        '--disable-device-discovery-notifications',
        '--disable-software-rasterizer',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-hang-monitor',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--run-all-compositor-stages-before-draw',
        '--disable-backgrounding-occluded-windows',
        '--disable-features=VizDisplayCompositor',
        '--font-render-hinting=none'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Compile the template with complete data structure
      const compiledTemplate = handlebars.compile(this.template);
      const html = compiledTemplate(data);
      
      // Set the content
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });
      
      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '2cm',
          right: '2cm',
          bottom: '2cm',
          left: '2cm'
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="width: 100%; font-size: 10px; text-align: center; color: #666; padding: 10px;">
            <span>Dossiê ${data.companyName} - ${data.emissionDate}</span>
          </div>
        `,
        footerTemplate: `
          <div style="width: 100%; font-size: 10px; text-align: center; color: #666; padding: 10px;">
            <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
          </div>
        `
      });

      return pdf;
    } finally {
      await browser.close();
    }
  }

  /**
   * Converte dados completos para formato do template (usado para compatibilidade)
   */
  private convertToTemplateFormat(completeData: DossieDataComplete): DossieData {
    return {
      companyName: completeData.companyName,
      companyLegalName: completeData.companyName,
      cnpj: completeData.cnpj,
      emissionDate: completeData.emissionDate,
      emissionTime: completeData.emissionTime,
      totalConsultations: completeData.totalConsultations,
      availableConsultations: completeData.availableConsultations,
      unavailableConsultations: completeData.unavailableConsultations,
      consultations: [
        { name: 'Score QUOD', available: !!completeData.scoreQuod },
        { name: 'Cadastro - Pessoa Jurídica - Plus', available: !!completeData.cadastroPjPlus },
        { name: 'CND - Secretaria da Fazenda', available: !!completeData.cndData },
        { name: 'Detalhamento Negativo', available: !!completeData.negativeDetails },
        { name: 'Protestos - SP', available: true },
        { name: 'Receita Federal - Pessoa Jurídica', available: !!completeData.additionalData?.receitaFederal },
        { name: 'Simples Nacional', available: !!completeData.additionalData?.simplesNacional },
        { name: 'TCU - Consulta Consolidada', available: !!completeData.additionalData?.tcu },
        { name: 'FGTS - Regularidade do Empregador', available: !!completeData.additionalData?.fgts },
        { name: 'Protestos - Nacional', available: false },
        { name: 'SCR Analítico - Resumo BACEN', available: !!completeData.scrBacen }
      ],
      scoreData: completeData.scoreQuod,
      companyData: completeData.cadastroPjPlus,
      cndData: completeData.cndData,
      negativeData: completeData.negativeDetails
    };
  }

  private async generatePDFFromData(data: DossieData): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-translate',
        '--disable-device-discovery-notifications',
        '--disable-software-rasterizer',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-hang-monitor',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--run-all-compositor-stages-before-draw',
        '--disable-backgrounding-occluded-windows',
        '--disable-features=VizDisplayCompositor',
        '--font-render-hinting=none'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Compile the template
      const compiledTemplate = handlebars.compile(this.template);
      const html = compiledTemplate(data);
      
      // Set the content
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });
      
      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '2cm',
          right: '2cm',
          bottom: '2cm',
          left: '2cm'
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="width: 100%; font-size: 10px; text-align: center; color: #666; padding: 10px;">
            <span>Dossiê ${data.companyName} - ${data.emissionDate}</span>
          </div>
        `,
        footerTemplate: `
          <div style="width: 100%; font-size: 10px; text-align: center; color: #666; padding: 10px;">
            <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
          </div>
        `
      });
      
      return pdf;
    } finally {
      await browser.close();
    }
  }

  generateDossieDataFromCreditScore(creditScore: any): DossieData {
    const now = new Date();
    const emissionDate = now.toLocaleDateString('pt-BR');
    const emissionTime = now.toLocaleTimeString('pt-BR');

    const consultations = [
      { name: 'Score QUOD', available: !!creditScore.score },
      { name: 'Cadastro - Pessoa Jurídica - Plus', available: !!creditScore.companyName },
      { name: 'CND - Secretaria da Fazenda', available: !!creditScore.cndStatus },
      { name: 'Detalhamento Negativo', available: !!creditScore.negativeStatus },
      { name: 'Protestos - SP', available: true },
      { name: 'Receita Federal - Pessoa Jurídica', available: true },
      { name: 'Simples Nacional', available: true },
      { name: 'TCU - Consulta Consolidada', available: true },
      { name: 'FGTS - Regularidade do Empregador', available: false },
      { name: 'Protestos - Nacional', available: false },
      { name: 'SCR Analítico - Resumo BACEN', available: false }
    ];

    const availableConsultations = consultations.filter(c => c.available).length;
    const unavailableConsultations = consultations.filter(c => !c.available).length;

    const data: DossieData = {
      companyName: creditScore.companyName || 'Empresa',
      companyLegalName: creditScore.companyName || 'Empresa LTDA',
      cnpj: creditScore.cnpj || '',
      emissionDate,
      emissionTime,
      totalConsultations: consultations.length,
      availableConsultations,
      unavailableConsultations,
      consultations
    };

    // Parse partners if it's a string
    let partners = null;
    if (creditScore.partners) {
      try {
        partners = typeof creditScore.partners === 'string' ? JSON.parse(creditScore.partners) : creditScore.partners;
      } catch (e) {
        partners = null;
      }
    }

    // Parse activities if it's a string
    let activities = null;
    if (creditScore.activities) {
      try {
        activities = typeof creditScore.activities === 'string' ? JSON.parse(creditScore.activities) : creditScore.activities;
      } catch (e) {
        activities = null;
      }
    }

    // Add Score QUOD data
    if (creditScore.score) {
      data.scoreData = {
        score: creditScore.score,
        faixaScore: creditScore.faixaScore,
        scoreMotivos: creditScore.scoreMotivos,
        scorePercentage: Math.round((creditScore.score / 1000) * 100),
        riskLevel: this.calculateRiskLevel(creditScore.score),
        riskClass: this.getRiskClass(creditScore.score)
      };
    }

    // Add company data
    if (creditScore.companyName) {
      data.companyData = {
        companyName: creditScore.companyName,
        cnpj: creditScore.cnpj,
        isActive: creditScore.isActive !== false,
        openingDate: creditScore.openingDate ? new Date(creditScore.openingDate).toLocaleDateString('pt-BR') : 'Não informado',
        capital: creditScore.capital ? `R$ ${parseFloat(creditScore.capital).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado',
        size: creditScore.size || 'Não informado',
        address: {
          street: creditScore.street || 'Não informado',
          district: creditScore.district || 'Não informado',
          city: creditScore.city || 'Não informado',
          state: creditScore.state || 'Não informado',
          zipCode: creditScore.zipCode || 'Não informado'
        },
        activities: activities || [],
        partners: partners || []
      };
    }

    // Add CND data
    if (creditScore.cndStatus) {
      data.cndData = {
        hasDebts: creditScore.cndHasDebts || false,
        certificateNumber: creditScore.cndNumber || 'Não informado',
        emissionDate: creditScore.cndEmissionDate ? new Date(creditScore.cndEmissionDate).toLocaleDateString('pt-BR') : 'Não informado',
        validityDate: creditScore.cndValidityDate ? new Date(creditScore.cndValidityDate).toLocaleDateString('pt-BR') : 'Não informado',
        debtAmount: creditScore.cndDebtAmount ? `R$ ${parseFloat(creditScore.cndDebtAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null
      };
    }

    // Add negative data
    data.negativeData = {
      hasProtests: creditScore.hasProtests || false,
      hasBankruptcy: creditScore.hasBankruptcy || false,
      hasLawsuits: creditScore.hasLawsuits || false,
      hasBouncedChecks: creditScore.hasBouncedChecks || false
    };

    return data;
  }

  private calculateRiskLevel(score: number): string {
    if (score >= 700) return 'Baixo';
    if (score >= 500) return 'Médio';
    return 'Alto';
  }

  private getFallbackTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Dossiê Empresarial</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #22c55e;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #22c55e;
            margin: 0;
            font-size: 24px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .section h2 {
            color: #22c55e;
            margin-top: 0;
            font-size: 18px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .info-row {
            display: flex;
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            width: 150px;
            color: #666;
        }
        .info-value {
            flex: 1;
        }
        .score-display {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 5px;
            margin: 20px 0;
        }
        .score-number {
            font-size: 48px;
            font-weight: bold;
            color: #22c55e;
            margin: 10px 0;
        }
        .risk-level {
            font-size: 18px;
            font-weight: bold;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            margin: 10px 0;
        }
        .risk-low { background: #d4edda; color: #155724; }
        .risk-medium { background: #fff3cd; color: #856404; }
        .risk-high { background: #f8d7da; color: #721c24; }
        .consultation-list {
            list-style: none;
            padding: 0;
        }
        .consultation-item {
            padding: 10px;
            margin: 5px 0;
            border-radius: 3px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .consultation-available {
            background: #d4edda;
            color: #155724;
        }
        .consultation-unavailable {
            background: #f8d7da;
            color: #721c24;
        }
        .status-badge {
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
        }
        .status-available {
            background: #28a745;
            color: white;
        }
        .status-unavailable {
            background: #dc3545;
            color: white;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Dossiê Empresarial</h1>
        <p>{{companyName}} - {{formatCNPJ cnpj}}</p>
        <p>Emitido em {{emissionDate}} às {{emissionTime}}</p>
    </div>

    {{#if scoreData}}
    <div class="section">
        <h2>Análise de Crédito</h2>
        <div class="score-display">
            <div class="score-number">{{scoreData.score}}</div>
            <div class="risk-level risk-{{#if (eq scoreData.riskLevel "Baixo")}}low{{/if}}{{#if (eq scoreData.riskLevel "Médio")}}medium{{/if}}{{#if (eq scoreData.riskLevel "Alto")}}high{{/if}}">
                Risco {{scoreData.riskLevel}}
            </div>
        </div>
    </div>
    {{/if}}

    {{#if companyData}}
    <div class="section">
        <h2>Dados da Empresa</h2>
        <div class="info-row">
            <div class="info-label">Razão Social:</div>
            <div class="info-value">{{companyData.companyName}}</div>
        </div>
        <div class="info-row">
            <div class="info-label">CNPJ:</div>
            <div class="info-value">{{formatCNPJ companyData.cnpj}}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Data de Abertura:</div>
            <div class="info-value">{{companyData.openingDate}}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Capital Social:</div>
            <div class="info-value">{{companyData.capital}}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Porte:</div>
            <div class="info-value">{{companyData.size}}</div>
        </div>
        {{#if companyData.address}}
        <div class="info-row">
            <div class="info-label">Endereço:</div>
            <div class="info-value">{{companyData.address.street}}, {{companyData.address.district}}, {{companyData.address.city}} - {{companyData.address.state}}</div>
        </div>
        {{/if}}
    </div>
    {{/if}}

    {{#if cndData}}
    <div class="section">
        <h2>Certidão Negativa de Débitos</h2>
        <div class="info-row">
            <div class="info-label">Status:</div>
            <div class="info-value">{{#if cndData.hasDebts}}Possui débitos{{else}}Sem débitos{{/if}}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Número:</div>
            <div class="info-value">{{cndData.certificateNumber}}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Data de Emissão:</div>
            <div class="info-value">{{cndData.emissionDate}}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Validade:</div>
            <div class="info-value">{{cndData.validityDate}}</div>
        </div>
        {{#if cndData.debtAmount}}
        <div class="info-row">
            <div class="info-label">Valor dos Débitos:</div>
            <div class="info-value">{{cndData.debtAmount}}</div>
        </div>
        {{/if}}
    </div>
    {{/if}}

    <div class="section">
        <h2>Consultas Realizadas</h2>
        <div class="info-row">
            <div class="info-label">Total de Consultas:</div>
            <div class="info-value">{{totalConsultations}}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Disponíveis:</div>
            <div class="info-value">{{availableConsultations}}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Indisponíveis:</div>
            <div class="info-value">{{unavailableConsultations}}</div>
        </div>
        
        <ul class="consultation-list">
            {{#each consultations}}
            <li class="consultation-item {{#if available}}consultation-available{{else}}consultation-unavailable{{/if}}">
                <span>{{name}}</span>
                <span class="status-badge {{#if available}}status-available{{else}}status-unavailable{{/if}}">
                    {{#if available}}Disponível{{else}}Indisponível{{/if}}
                </span>
            </li>
            {{/each}}
        </ul>
    </div>

    <div class="footer">
        <p>Este documento foi gerado automaticamente pelo sistema Spark Comex</p>
        <p>Data/Hora: {{formatDateTime emissionDate}} {{emissionTime}}</p>
    </div>
</body>
</html>
    `;
  }

  private getRiskClass(score: number): string {
    if (score >= 700) return 'risk-low';
    if (score >= 500) return 'risk-medium';
    return 'risk-high';
  }
}

export const pdfService = new PDFService();