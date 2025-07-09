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
    const templatePath = path.join(__dirname, '../templates/dossie-template.html');
    this.template = readFileSync(templatePath, 'utf8');
    
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
    
    // Convert to the format expected by the PDF template
    const data = this.convertToTemplateFormat(completeData);
    
    return await this.generatePDFFromData(data);
  }
  
  /**
   * Converte dados completos para formato do template
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

  private getRiskClass(score: number): string {
    if (score >= 700) return 'risk-low';
    if (score >= 500) return 'risk-medium';
    return 'risk-high';
  }
}

export const pdfService = new PDFService();