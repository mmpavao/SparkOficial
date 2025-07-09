import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  }

  async generateDossiePDF(data: DossieData): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
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

    // Add Score QUOD data
    if (creditScore.score) {
      data.scoreData = {
        score: creditScore.score,
        consultationDate: creditScore.consultationDate || emissionDate,
        riskLevel: creditScore.riskLevel || 'Médio',
        companyName: creditScore.companyName,
        cnpj: creditScore.cnpj
      };
    }

    // Add company data
    if (creditScore.companyName) {
      data.companyData = {
        cnpj: creditScore.cnpj,
        companyName: creditScore.companyName,
        fantasyName: creditScore.fantasyName || creditScore.companyName,
        foundationDate: creditScore.foundationDate || '15/01/2025',
        registrationStatus: creditScore.registrationStatus || 'Ativa',
        companySize: creditScore.companySize || 'Pequena',
        legalNature: creditScore.legalNature || 'Sociedade Empresária Limitada',
        addresses: creditScore.addresses || [{
          street: creditScore.street || 'Não informado',
          number: creditScore.number || 'S/N',
          neighborhood: creditScore.neighborhood || 'Não informado',
          city: creditScore.city || 'Não informado',
          zipCode: creditScore.zipCode || 'Não informado'
        }],
        partners: creditScore.partners || []
      };
    }

    // Add CND data
    if (creditScore.cndStatus) {
      data.cndData = {
        hasDebts: creditScore.cndHasDebts || false,
        consultationDate: creditScore.cndConsultationDate || emissionDate,
        certificateNumber: creditScore.cndCertificateNumber || 'Não informado',
        status: creditScore.cndStatus
      };
    }

    // Add negative data
    if (creditScore.negativeStatus) {
      data.negativeData = {
        document: creditScore.cnpj,
        consultationDate: creditScore.negativeConsultationDate || emissionDate,
        status: creditScore.negativeStatus
      };
    }

    return data;
  }
}

export const pdfService = new PDFService();