/**
 * SISTEMA DE TESTES AUTOMATIZADOS - SPARK COMEX
 * Validação completa da lógica de cadastro e confirmações
 * Execute com: node test-system-validation.js
 */

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada');
  process.exit(1);
}

// Simulação de dados de teste
const testData = {
  userRegistration: {
    companyName: "Empresa Teste Automatizado",
    cnpj: "12.345.678/0001-95", // CNPJ válido para teste
    fullName: "Usuario Teste",
    phone: "(11) 99999-9999",
    email: `teste.auto.${Date.now()}@sparkcomex.com`,
    password: "TesteSenha123!",
    defaultAdminFeeRate: 15,
    defaultDownPaymentRate: 20,
    defaultPaymentTerms: "30,90"
  },
  creditApplication: {
    legalCompanyName: "Empresa Teste Automatizado LTDA",
    tradingName: "Teste Auto",
    cnpj: "12.345.678/0001-95",
    requestedAmount: 100000,
    business_sector: "importacao_geral"
  },
  importData: {
    importName: "Importação Teste Auto",
    cargoType: "FCL",
    originPort: "Shanghai",
    destinationPort: "Santos",
    estimatedValue: 50000
  }
};

class SystemValidator {
  constructor() {
    this.results = {
      authentication: [],
      financial_settings: [],
      credit_workflow: [],
      import_system: [],
      data_integrity: []
    };
    this.baseURL = 'https://ffd5248e-e106-4f74-ae53-67205fcf0bb9-00-14h5161s5ivct.kirk.replit.dev';
  }

  log(category, test, status, details = '') {
    const result = { test, status, details, timestamp: new Date().toISOString() };
    this.results[category].push(result);
    
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} [${category.toUpperCase()}] ${test}: ${status} ${details}`);
  }

  async makeRequest(endpoint, method = 'GET', body = null, sessionCookie = null) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(sessionCookie && { 'Cookie': sessionCookie })
        }
      };

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, options);
      
      return {
        status: response.status,
        data: await response.json().catch(() => null),
        headers: response.headers,
        ok: response.ok
      };
    } catch (error) {
      return {
        status: 500,
        error: error.message,
        ok: false
      };
    }
  }

  // 1. TESTES DE AUTENTICAÇÃO
  async testAuthentication() {
    console.log('\n🔐 INICIANDO TESTES DE AUTENTICAÇÃO...\n');

    // Teste 1: Registro de usuário
    const registerResponse = await this.makeRequest('/api/auth/register', 'POST', testData.userRegistration);
    
    if (registerResponse.ok) {
      this.log('authentication', 'User Registration', 'PASS', 'Usuário criado com sucesso');
    } else {
      this.log('authentication', 'User Registration', 'FAIL', registerResponse.data?.message || 'Erro no registro');
      return null;
    }

    // Teste 2: Login do usuário
    const loginResponse = await this.makeRequest('/api/auth/login', 'POST', {
      email: testData.userRegistration.email,
      password: testData.userRegistration.password
    });

    if (loginResponse.ok) {
      this.log('authentication', 'User Login', 'PASS', 'Login realizado com sucesso');
      
      // Extrair cookie de sessão
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      return setCookieHeader;
    } else {
      this.log('authentication', 'User Login', 'FAIL', loginResponse.data?.message || 'Erro no login');
      return null;
    }
  }

  // 2. TESTES DE CONFIGURAÇÕES FINANCEIRAS
  async testFinancialSettings(sessionCookie) {
    console.log('\n💰 INICIANDO TESTES DE CONFIGURAÇÕES FINANCEIRAS...\n');

    if (!sessionCookie) {
      this.log('financial_settings', 'Session Validation', 'FAIL', 'Sessão não disponível');
      return;
    }

    // Teste 1: Buscar configurações financeiras
    const settingsResponse = await this.makeRequest('/api/user/financial-settings', 'GET', null, sessionCookie);
    
    if (settingsResponse.ok && settingsResponse.data) {
      const settings = settingsResponse.data;
      
      // Validar valores esperados
      const expectedValues = {
        adminFeePercentage: 15,
        downPaymentPercentage: 20,
        paymentTerms: '30,90'
      };

      let allCorrect = true;
      for (const [key, expectedValue] of Object.entries(expectedValues)) {
        if (settings[key] !== expectedValue) {
          allCorrect = false;
          this.log('financial_settings', `Setting ${key}`, 'FAIL', 
            `Esperado: ${expectedValue}, Recebido: ${settings[key]}`);
        }
      }

      if (allCorrect) {
        this.log('financial_settings', 'Financial Settings Retrieval', 'PASS', 
          'Todas as configurações estão corretas');
      }
    } else {
      this.log('financial_settings', 'Financial Settings Retrieval', 'FAIL', 
        'Erro ao buscar configurações');
    }

    // Teste 2: Validar integridade dos dados no registro
    const userResponse = await this.makeRequest('/api/auth/user', 'GET', null, sessionCookie);
    
    if (userResponse.ok && userResponse.data?.user) {
      const user = userResponse.data.user;
      
      if (user.defaultAdminFeeRate === 15 && 
          user.defaultDownPaymentRate === 20 && 
          user.defaultPaymentTerms === '30,90') {
        this.log('financial_settings', 'User Data Integrity', 'PASS', 
          'Configurações salvas corretamente no registro');
      } else {
        this.log('financial_settings', 'User Data Integrity', 'FAIL', 
          'Configurações não foram salvas corretamente');
      }
    }
  }

  // 3. TESTES DE WORKFLOW DE CRÉDITO
  async testCreditWorkflow(sessionCookie) {
    console.log('\n📋 INICIANDO TESTES DE WORKFLOW DE CRÉDITO...\n');

    if (!sessionCookie) {
      this.log('credit_workflow', 'Session Validation', 'FAIL', 'Sessão não disponível');
      return null;
    }

    // Teste 1: Criar aplicação de crédito
    const creditData = {
      ...testData.creditApplication,
      documents: [],
      requestedAmount: testData.creditApplication.requestedAmount.toString()
    };

    const creditResponse = await this.makeRequest('/api/credit/applications', 'POST', creditData, sessionCookie);
    
    if (creditResponse.ok && creditResponse.data?.id) {
      this.log('credit_workflow', 'Credit Application Creation', 'PASS', 
        `Aplicação criada com ID: ${creditResponse.data.id}`);
      
      // Teste 2: Buscar aplicação criada
      const applicationId = creditResponse.data.id;
      const fetchResponse = await this.makeRequest(`/api/credit/applications/${applicationId}`, 'GET', null, sessionCookie);
      
      if (fetchResponse.ok && fetchResponse.data) {
        this.log('credit_workflow', 'Credit Application Retrieval', 'PASS', 
          'Aplicação recuperada com sucesso');
        
        // Teste 3: Validar status inicial
        if (fetchResponse.data.status === 'pending') {
          this.log('credit_workflow', 'Initial Status Validation', 'PASS', 
            'Status inicial correto: pending');
        } else {
          this.log('credit_workflow', 'Initial Status Validation', 'FAIL', 
            `Status esperado: pending, recebido: ${fetchResponse.data.status}`);
        }
        
        return applicationId;
      } else {
        this.log('credit_workflow', 'Credit Application Retrieval', 'FAIL', 
          'Erro ao recuperar aplicação');
      }
    } else {
      this.log('credit_workflow', 'Credit Application Creation', 'FAIL', 
        creditResponse.data?.message || 'Erro ao criar aplicação');
    }
    
    return null;
  }

  // 4. TESTES DE SISTEMA DE IMPORTAÇÃO
  async testImportSystem(sessionCookie, creditApplicationId) {
    console.log('\n🚢 INICIANDO TESTES DE SISTEMA DE IMPORTAÇÃO...\n');

    if (!sessionCookie) {
      this.log('import_system', 'Session Validation', 'FAIL', 'Sessão não disponível');
      return;
    }

    // Teste 1: Validar preview financeiro na criação de importação
    const financialPreviewTest = await this.makeRequest('/api/user/financial-settings', 'GET', null, sessionCookie);
    
    if (financialPreviewTest.ok) {
      this.log('import_system', 'Financial Preview Data Access', 'PASS', 
        'Dados financeiros acessíveis para preview');
    } else {
      this.log('import_system', 'Financial Preview Data Access', 'FAIL', 
        'Erro ao acessar dados para preview');
    }

    // Teste 2: Validar fornecedores disponíveis
    const suppliersResponse = await this.makeRequest('/api/suppliers', 'GET', null, sessionCookie);
    
    if (suppliersResponse.ok) {
      this.log('import_system', 'Suppliers Access', 'PASS', 
        `${suppliersResponse.data?.length || 0} fornecedores disponíveis`);
    } else {
      this.log('import_system', 'Suppliers Access', 'FAIL', 
        'Erro ao acessar fornecedores');
    }
  }

  // 5. TESTES DE INTEGRIDADE DE DADOS
  async testDataIntegrity(sessionCookie) {
    console.log('\n🔍 INICIANDO TESTES DE INTEGRIDADE DE DADOS...\n');

    if (!sessionCookie) {
      this.log('data_integrity', 'Session Validation', 'FAIL', 'Sessão não disponível');
      return;
    }

    // Teste 1: Consistência entre API de configurações e dados do usuário
    const [settingsResponse, userResponse] = await Promise.all([
      this.makeRequest('/api/user/financial-settings', 'GET', null, sessionCookie),
      this.makeRequest('/api/auth/user', 'GET', null, sessionCookie)
    ]);

    if (settingsResponse.ok && userResponse.ok) {
      const settings = settingsResponse.data;
      const user = userResponse.data.user;

      const isConsistent = 
        settings.adminFeePercentage === user.defaultAdminFeeRate &&
        settings.downPaymentPercentage === user.defaultDownPaymentRate &&
        settings.paymentTerms === user.defaultPaymentTerms;

      if (isConsistent) {
        this.log('data_integrity', 'API Data Consistency', 'PASS', 
          'Dados consistentes entre endpoints');
      } else {
        this.log('data_integrity', 'API Data Consistency', 'FAIL', 
          'Inconsistência detectada entre endpoints');
      }
    }

    // Teste 2: Validar aplicações de crédito
    const creditResponse = await this.makeRequest('/api/credit/applications', 'GET', null, sessionCookie);
    
    if (creditResponse.ok) {
      this.log('data_integrity', 'Credit Applications Access', 'PASS', 
        `${creditResponse.data?.length || 0} aplicações encontradas`);
    } else {
      this.log('data_integrity', 'Credit Applications Access', 'FAIL', 
        'Erro ao acessar aplicações de crédito');
    }
  }

  // GERADOR DE RELATÓRIO
  generateReport() {
    console.log('\n📊 RELATÓRIO FINAL DE TESTES\n');
    console.log('='.repeat(50));

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const [category, tests] of Object.entries(this.results)) {
      const categoryPassed = tests.filter(t => t.status === 'PASS').length;
      const categoryFailed = tests.filter(t => t.status === 'FAIL').length;
      const categoryTotal = tests.length;

      totalTests += categoryTotal;
      passedTests += categoryPassed;
      failedTests += categoryFailed;

      console.log(`\n${category.toUpperCase().replace('_', ' ')}:`);
      console.log(`  ✅ Passou: ${categoryPassed}`);
      console.log(`  ❌ Falhou: ${categoryFailed}`);
      console.log(`  📊 Total: ${categoryTotal}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log(`RESULTADO GERAL:`);
    console.log(`✅ Testes Passaram: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`❌ Testes Falharam: ${failedTests}/${totalTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);

    if (failedTests === 0) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM! Sistema funcionando corretamente.');
    } else {
      console.log('\n⚠️  ALGUNS TESTES FALHARAM. Revisar componentes com falha.');
    }

    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      percentage: ((passedTests/totalTests)*100).toFixed(1)
    };
  }

  // EXECUTAR TODOS OS TESTES
  async runAllTests() {
    console.log('🚀 INICIANDO VALIDAÇÃO COMPLETA DO SISTEMA SPARK COMEX');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🌐 Ambiente:', this.baseURL);
    console.log('\n' + '='.repeat(50));

    try {
      // 1. Testes de Autenticação
      const sessionCookie = await this.testAuthentication();

      // 2. Testes de Configurações Financeiras
      await this.testFinancialSettings(sessionCookie);

      // 3. Testes de Workflow de Crédito
      const creditApplicationId = await this.testCreditWorkflow(sessionCookie);

      // 4. Testes de Sistema de Importação
      await this.testImportSystem(sessionCookie, creditApplicationId);

      // 5. Testes de Integridade de Dados
      await this.testDataIntegrity(sessionCookie);

      // Gerar Relatório Final
      const report = this.generateReport();
      
      return report;

    } catch (error) {
      console.error('\n❌ ERRO CRÍTICO NO SISTEMA DE TESTES:', error.message);
      return { error: error.message };
    }
  }
}

// EXECUTAR TESTES
const validator = new SystemValidator();
validator.runAllTests()
  .then(report => {
    if (report.error) {
      process.exit(1);
    } else if (report.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('❌ Erro na execução dos testes:', error);
    process.exit(1);
  });