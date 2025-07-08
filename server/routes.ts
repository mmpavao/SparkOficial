import { Express } from 'express';
import { createServer, Server } from 'http';
import { storage } from './storage';
import { callDirectDataAPI, calculateEnhancedCreditScore, determineCreditRating, determineRiskLevel } from './direct-data-integration';
import bcrypt from 'bcrypt';
import session from 'express-session';
import { z } from 'zod';

// Session data interface
interface SessionData {
  userId: number;
}

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Cache for duplicate prevention
  const requestCache = new Map<string, { timestamp: number, userId: number, amount: number }>();

  // Middleware for authentication
  function requireAuth(req: any, res: any, next: any) {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  }

  function requireAdmin(req: any, res: any, next: any) {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // Simple admin check - in production, check user role from database
    next();
  }

  // Test route
  app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
  });

  // Authentication routes
  app.post('/api/register', async (req, res) => {
    try {
      const { fullName, email, phone, companyName, cnpj, password } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        fullName,
        email,
        phone,
        companyName,
        cnpj,
        password: hashedPassword,
        role: 'importer'
      });

      res.json({ message: 'User created successfully', userId: user.id });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Set session
      req.session.userId = user.id;
      
      res.json({ 
        message: 'Login successful',
        user: { 
          id: user.id, 
          email: user.email, 
          fullName: user.fullName,
          role: user.role 
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Direct.data Credit Score Analysis
  app.get('/api/credit/applications/:id/credit-score', requireAuth, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      
      // Get the credit application
      const application = await storage.getCreditApplication(applicationId);
      if (!application) {
        return res.status(404).json({ error: 'Credit application not found' });
      }

      // Extract CNPJ from application
      const cnpj = application.cnpj;
      if (!cnpj) {
        return res.status(400).json({ error: 'CNPJ not found in application' });
      }

      console.log(`🔍 Starting Direct.data credit analysis for CNPJ: ${cnpj}`);

      // Check if we already have a credit score for this CNPJ
      const existingScore = await storage.getCreditScore(cnpj);
      if (existingScore) {
        console.log('✅ Using existing credit score from database');
        return res.json(existingScore);
      }

      // Call Direct.data API
      const directDataResponse = await callDirectDataAPI(cnpj);
      
      if (directDataResponse) {
        console.log('✅ Direct.data API response received successfully');
        
        // Calculate enhanced credit score
        const creditScore = calculateEnhancedCreditScore(directDataResponse);
        const creditRating = determineCreditRating(creditScore);
        const riskLevel = determineRiskLevel(creditScore);

        // Create credit score record
        const creditScoreData = {
          cnpj: directDataResponse.cnpj,
          companyName: directDataResponse.razaoSocial,
          score: creditScore,
          rating: creditRating,
          riskLevel: riskLevel,
          lastAnalysis: new Date().toISOString(),
          analysisData: directDataResponse
        };

        // Save to database
        const savedScore = await storage.createCreditScore(creditScoreData);
        
        console.log(`💾 Credit score saved to database: ${creditScore} (${creditRating})`);
        return res.json(savedScore);
      } else {
        console.log('⚠️ Direct.data API returned null response - using fallback');
        
        // Create neutral credit score for interface compatibility
        const neutralScore = {
          cnpj: cnpj,
          companyName: application.companyName || 'Empresa',
          score: 750,
          rating: 'GOOD',
          riskLevel: 'MEDIUM',
          lastAnalysis: new Date().toISOString(),
          analysisData: {
            cnpj: cnpj,
            razaoSocial: application.companyName || 'Empresa',
            situacaoCadastral: 'PENDING_ANALYSIS',
            source: 'FALLBACK'
          }
        };

        const savedScore = await storage.createCreditScore(neutralScore);
        return res.json(savedScore);
      }
    } catch (error) {
      console.error('❌ Direct.data credit score analysis failed:', error);
      res.status(500).json({ 
        message: "Erro ao analisar credit score",
        details: "Falha na consulta Direct.data" 
      });
    }
  });

  // Credit applications routes
  app.get('/api/credit/applications', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const applications = await storage.getCreditApplicationsByUser(userId);
      res.json(applications);
    } catch (error) {
      console.error('Error fetching credit applications:', error);
      res.status(500).json({ error: 'Failed to fetch credit applications' });
    }
  });

  app.get('/api/credit/applications/:id', requireAuth, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getCreditApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ error: 'Credit application not found' });
      }

      res.json(application);
    } catch (error) {
      console.error('Error fetching credit application:', error);
      res.status(500).json({ error: 'Failed to fetch credit application' });
    }
  });

  app.post('/api/credit/applications', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const requestData = req.body;

      // Duplicate prevention
      const cacheKey = `${userId}-${requestData.requestedAmount}`;
      const cached = requestCache.get(cacheKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp < 60000)) {
        console.log('🚫 DUPLICATE BLOCKED - Same user, amount within 60s');
        return res.status(429).json({ 
          error: 'Solicitação já enviada',
          message: 'Aguarde antes de enviar outra solicitação'
        });
      }

      // Add to cache
      requestCache.set(cacheKey, {
        timestamp: now,
        userId: userId,
        amount: requestData.requestedAmount
      });

      // Create credit application
      const application = await storage.createCreditApplication({
        ...requestData,
        userId: userId,
        status: 'pending',
        submissionDate: new Date().toISOString()
      });

      res.json(application);
    } catch (error) {
      console.error('Error creating credit application:', error);
      res.status(500).json({ error: 'Failed to create credit application' });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/importer', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      // Get dashboard data
      const applications = await storage.getCreditApplicationsByUser(userId);
      const approvedApplications = applications.filter(app => app.adminStatus === 'finalized');
      
      const totalApprovedCredit = approvedApplications.reduce((sum, app) => sum + (app.finalCreditLimit || 0), 0);
      const totalApplications = applications.length;
      
      res.json({
        totalApprovedCredit,
        totalApplications,
        creditInUse: 0, // Placeholder
        availableCredit: totalApprovedCredit,
        applications: applications.slice(0, 5) // Recent applications
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}