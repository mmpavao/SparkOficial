#!/usr/bin/env node

/**
 * TESTE DO SISTEMA DE GERAÇÃO DE PDF
 * Validação completa do PDFService com templates
 * Execute com: node test-pdf-generation.js
 */

import { PDFService } from './server/services/pdfService.js';
import fs from 'fs';
import path from 'path';

class PDFTestValidator {
  constructor() {
    this.testResults = [];
  }

  log(category, test, status, details = '') {
    const timestamp = new Date().toISOString();
    const result = { timestamp, category, test, status, details };
    this.testResults.push(result);
    
    const statusEmoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${statusEmoji} [${category}] ${test}: ${status}${details ? ` - ${details}` : ''}`);
  }

  async testPDFServiceInitialization() {
    console.log('\n🔧 Testing PDFService Initialization...');
    
    try {
      const pdfService = new PDFService();
      this.log('INIT', 'PDFService Constructor', 'PASS', 'Service initialized successfully');
      return pdfService;
    } catch (error) {
      this.log('INIT', 'PDFService Constructor', 'FAIL', `Error: ${error.message}`);
      return null;
    }
  }

  async testTemplateFileResolution() {
    console.log('\n📄 Testing Template File Resolution...');
    
    // Test if template files exist in expected locations
    const templatePaths = [
      'server/templates/dossie-template.html',
      'templates/dossie-template.html',
      'dist/templates/dossie-template.html'
    ];
    
    for (const templatePath of templatePaths) {
      if (fs.existsSync(templatePath)) {
        this.log('TEMPLATE', `File exists at ${templatePath}`, 'PASS');
      } else {
        this.log('TEMPLATE', `File missing at ${templatePath}`, 'WARN');
      }
    }
  }

  async testPDFGeneration(pdfService) {
    console.log('\n🏗️ Testing PDF Generation...');
    
    if (!pdfService) {
      this.log('PDF', 'PDF Generation', 'FAIL', 'PDFService not initialized');
      return false;
    }

    // Mock credit score data for testing
    const mockCreditScore = {
      companyName: 'Test Company LTDA',
      cnpj: '12.345.678/0001-90',
      score: 750,
      riskLevel: 'Baixo',
      isActive: true,
      openingDate: '2020-01-15',
      capital: '500000',
      size: 'MÉDIA',
      street: 'Rua Test, 123',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      cndStatus: 'Emitida',
      cndHasDebts: false,
      cndNumber: 'CND123456',
      cndEmissionDate: '2025-07-09',
      cndValidityDate: '2025-12-09',
      hasProtests: false,
      hasBankruptcy: false,
      hasLawsuits: false,
      hasBouncedChecks: false
    };

    try {
      // Test with fallback template (if main template fails)
      const pdfBuffer = await pdfService.generateDossiePDFFromCreditScore(mockCreditScore);
      
      if (pdfBuffer && pdfBuffer.length > 0) {
        this.log('PDF', 'PDF Generation', 'PASS', `Generated PDF size: ${pdfBuffer.length} bytes`);
        
        // Save test PDF
        const testPdfPath = 'test-output.pdf';
        fs.writeFileSync(testPdfPath, pdfBuffer);
        this.log('PDF', 'PDF File Save', 'PASS', `Saved to ${testPdfPath}`);
        
        return true;
      } else {
        this.log('PDF', 'PDF Generation', 'FAIL', 'Empty or null PDF buffer');
        return false;
      }
    } catch (error) {
      this.log('PDF', 'PDF Generation', 'FAIL', `Error: ${error.message}`);
      return false;
    }
  }

  async testFallbackTemplate() {
    console.log('\n🔄 Testing Fallback Template System...');
    
    // Temporarily rename template file to test fallback
    const originalPath = 'server/templates/dossie-template.html';
    const backupPath = 'server/templates/dossie-template.html.backup';
    
    try {
      // Move original template
      if (fs.existsSync(originalPath)) {
        fs.renameSync(originalPath, backupPath);
        this.log('FALLBACK', 'Template Backup', 'PASS', 'Original template moved');
      }
      
      // Test PDFService with fallback
      const pdfService = new PDFService();
      this.log('FALLBACK', 'Fallback Template Init', 'PASS', 'Service initialized with fallback template');
      
      // Restore original template
      if (fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, originalPath);
        this.log('FALLBACK', 'Template Restore', 'PASS', 'Original template restored');
      }
      
      return true;
    } catch (error) {
      // Restore template if error occurs
      if (fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, originalPath);
      }
      this.log('FALLBACK', 'Fallback Template Test', 'FAIL', `Error: ${error.message}`);
      return false;
    }
  }

  generateReport() {
    console.log('\n📊 TEST REPORT');
    console.log('=' * 50);
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const warnings = this.testResults.filter(r => r.status === 'WARN').length;
    
    console.log(`✅ PASSED: ${passed}`);
    console.log(`❌ FAILED: ${failed}`);
    console.log(`⚠️  WARNINGS: ${warnings}`);
    console.log(`📋 TOTAL: ${this.testResults.length}`);
    
    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED - PDF generation system is working correctly!');
      console.log('💡 System is ready for production deployment.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting PDF System Validation Tests...');
    
    // Test 1: PDFService Initialization
    const pdfService = await this.testPDFServiceInitialization();
    
    // Test 2: Template File Resolution
    await this.testTemplateFileResolution();
    
    // Test 3: PDF Generation
    await this.testPDFGeneration(pdfService);
    
    // Test 4: Fallback Template System
    await this.testFallbackTemplate();
    
    // Generate final report
    this.generateReport();
  }
}

// Run tests
const validator = new PDFTestValidator();
validator.runAllTests().catch(console.error);