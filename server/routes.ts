import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Extend the session interface
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || "spark-comex-secret-key-for-development",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Disabled for Replit deployment
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    console.log("Auth check - Session ID:", req.sessionID, "User ID:", req.session?.userId);
    if (!req.session?.userId) {
      console.log("Authentication failed - no session or user ID");
      return res.status(401).json({ message: "Não autorizado" });
    }
    console.log("Authentication successful for user:", req.session.userId);
    next();
  };

  // Register endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      const existingUserByCnpj = await storage.getUserByCnpj(userData.cnpj);
      if (existingUserByCnpj) {
        return res.status(400).json({ message: "CNPJ já está cadastrado" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Create user (exclude confirmPassword)
      const { confirmPassword, ...userToCreate } = userData;
      const user = await storage.createUser({
        ...userToCreate,
        password: hashedPassword,
      });

      // Set session
      req.session.userId = user.id;

      // Return user without password
      const { password, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Dados inválidos",
          errors: error.errors 
        });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt for:", req.body.email);
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log("User not found:", email);
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log("Invalid password for user:", email);
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      // Set session
      req.session.userId = user.id;
      console.log("Session created for user ID:", user.id, "Session ID:", req.sessionID);

      // Return user without password
      const { password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Dados inválidos",
          errors: error.errors 
        });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      // Return user without password
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: any, res) => {
    const sessionId = req.sessionID;
    
    // Clear session regardless of destroy success
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error during session destroy:", err);
        // Continue with cookie clearing even if session destroy fails
      }
      
      // Clear all possible cookie variations for production compatibility
      const cookieOptions = [
        // Standard cookie clearing
        {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const
        },
        // Additional clearing for production domains
        {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'none' as const
        },
        // Fallback clearing
        {
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'lax' as const
        }
      ];
      
      // Clear connect.sid cookie with multiple configurations
      cookieOptions.forEach(options => {
        res.clearCookie('connect.sid', options);
      });
      
      // Also clear any potential session variations
      res.clearCookie('session');
      res.clearCookie('sessionid');
      
      console.log("User logged out, session destroyed:", sessionId);
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // User management routes (Admin area)
  app.post("/api/admin/users", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId);
      
      // Verificar se é super admin
      if (currentUser?.email !== "pavaosmart@gmail.com") {
        return res.status(403).json({ message: "Acesso negado - apenas super admin" });
      }

      const userData = req.body;
      const { confirmPassword, ...userDataWithoutConfirm } = userData;
      
      const newUser = await storage.createUserByAdmin(userDataWithoutConfirm, currentUser.id);
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/admin/users/:id/role", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId);
      
      // Verificar se é super admin ou admin
      if (currentUser?.email !== "pavaosmart@gmail.com" && currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { id } = req.params;
      const { role } = req.body;
      
      const updatedUser = await storage.updateUserRole(parseInt(id), role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId);
      
      // Verificar se é super admin
      if (currentUser?.email !== "pavaosmart@gmail.com") {
        return res.status(403).json({ message: "Acesso negado - apenas super admin" });
      }

      const { id } = req.params;
      const deactivatedUser = await storage.deactivateUser(parseInt(id));
      res.json(deactivatedUser);
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get all users route (Admin area)
  app.get("/api/admin/users", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId);
      
      // Verificar se é super admin ou admin
      if (currentUser?.email !== "pavaosmart@gmail.com" && currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Credit application routes
  app.post('/api/credit/applications', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const applicationData = { ...req.body, userId };
      
      const application = await storage.createCreditApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating credit application:", error);
      res.status(500).json({ message: "Erro ao criar solicitação de crédito" });
    }
  });

  app.get('/api/credit/applications', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const applications = await storage.getCreditApplicationsByUser(userId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching credit applications:", error);
      res.status(500).json({ message: "Erro ao buscar solicitações de crédito" });
    }
  });

  app.get('/api/credit/applications/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getCreditApplication(id);
      
      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }
      
      if (application.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      res.json(application);
    } catch (error) {
      console.error("Error fetching credit application:", error);
      res.status(500).json({ message: "Erro ao buscar solicitação de crédito" });
    }
  });

  // Import routes
  app.post('/api/imports', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const importData = { ...req.body, userId };
      
      const importRecord = await storage.createImport(importData);
      res.status(201).json(importRecord);
    } catch (error) {
      console.error("Error creating import:", error);
      res.status(500).json({ message: "Erro ao criar importação" });
    }
  });

  app.get('/api/imports', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const imports = await storage.getImportsByUser(userId);
      res.json(imports);
    } catch (error) {
      console.error("Error fetching imports:", error);
      res.status(500).json({ message: "Erro ao buscar importações" });
    }
  });

  app.get('/api/imports/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const importRecord = await storage.getImport(id);
      
      if (!importRecord) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }
      
      if (importRecord.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      res.json(importRecord);
    } catch (error) {
      console.error("Error fetching import:", error);
      res.status(500).json({ message: "Erro ao buscar importação" });
    }
  });

  app.patch('/api/imports/:id/status', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, ...updateData } = req.body;
      
      const importRecord = await storage.getImport(id);
      if (!importRecord) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }
      
      if (importRecord.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const updatedImport = await storage.updateImportStatus(id, status, updateData);
      res.json(updatedImport);
    } catch (error) {
      console.error("Error updating import status:", error);
      res.status(500).json({ message: "Erro ao atualizar status da importação" });
    }
  });

  // Admin middleware
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }
      
      // Check if user is admin (using email for now)
      if (user.email !== "pavaosmart@gmail.com" && user.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado - privilégios de administrador necessários" });
      }
      
      next();
    } catch (error) {
      console.error("Admin check error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  };

  // Get all users (admin only)
  app.get('/api/admin/users', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get all credit applications (admin only)
  app.get('/api/admin/credit-applications', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const applications = await storage.getAllCreditApplications();
      res.json(applications);
    } catch (error) {
      console.error("Get all credit applications error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get all imports (admin only)
  app.get('/api/admin/imports', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const imports = await storage.getAllImports();
      res.json(imports);
    } catch (error) {
      console.error("Get all imports error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update credit application status (admin only)
  app.put('/api/admin/credit-applications/:id/status', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['pending', 'approved', 'rejected', 'under_review'].includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }

      const updatedApplication = await storage.updateCreditApplicationStatus(
        parseInt(id), 
        status, 
        { reviewedBy: req.session.userId, reviewedAt: new Date() }
      );
      
      res.json(updatedApplication);
    } catch (error) {
      console.error("Update credit status error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // AI Insights endpoint
  app.get("/api/insights/ai-recommendations", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      const creditApplications = await storage.getCreditApplicationsByUser(userId);
      const imports = await storage.getImportsByUser(userId);
      
      // Generate AI insights based on user data
      const insights = generateAIInsights(user, creditApplications, imports);
      const summary = calculateInsightsSummary(insights);
      
      res.json({ insights, summary });
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// AI Insights generation functions
function generateAIInsights(user: any, creditApplications: any[], imports: any[]) {
  const insights = [];
  
  // Credit opportunity insights
  if (creditApplications.length === 0) {
    insights.push({
      id: 'credit-opportunity-1',
      type: 'opportunity',
      priority: 'high',
      title: 'Apply for Your First Credit Line',
      description: 'Start importing with confidence by securing a credit line. Based on your company profile, you may qualify for up to $50,000.',
      actionable: true,
      action: {
        label: 'Apply for Credit',
        type: 'navigate',
        target: '/credit'
      },
      metadata: {
        value: 50000,
        timeline: '3-5 business days',
        impact: 'High'
      }
    });
  }

  // Credit limit optimization
  const approvedCredit = creditApplications.find(app => app.status === 'approved');
  if (approvedCredit && imports.length > 0) {
    const totalImportValue = imports.reduce((sum, imp) => sum + (imp.totalValue || 0), 0);
    const creditUtilization = totalImportValue / approvedCredit.approvedAmount;
    
    if (creditUtilization > 0.8) {
      insights.push({
        id: 'credit-limit-warning',
        type: 'warning',
        priority: 'high',
        title: 'High Credit Utilization Detected',
        description: `You're using ${Math.round(creditUtilization * 100)}% of your credit limit. Consider requesting an increase to maintain healthy cash flow.`,
        actionable: true,
        action: {
          label: 'Request Credit Increase',
          type: 'navigate',
          target: '/credit'
        },
        metadata: {
          impact: 'Cash Flow Risk',
          timeline: 'Immediate action needed'
        }
      });
    }
  }

  // Import efficiency insights
  if (imports.length >= 3) {
    const recentImports = imports.slice(-3);
    const avgProcessingTime = recentImports.reduce((sum, imp) => {
      const created = new Date(imp.createdAt);
      const updated = new Date(imp.updatedAt);
      return sum + (updated.getTime() - created.getTime());
    }, 0) / recentImports.length;

    const avgDays = Math.round(avgProcessingTime / (1000 * 60 * 60 * 24));
    
    if (avgDays > 30) {
      insights.push({
        id: 'import-efficiency',
        type: 'recommendation',
        priority: 'medium',
        title: 'Optimize Import Processing Time',
        description: `Your imports are taking an average of ${avgDays} days to process. Consider working with pre-approved suppliers to reduce delays.`,
        actionable: true,
        action: {
          label: 'View Import Tips',
          type: 'external',
          target: 'https://docs.sparkcomex.com/import-optimization'
        },
        metadata: {
          timeline: `Current: ${avgDays} days avg`,
          impact: 'Efficiency improvement'
        }
      });
    }
  }

  // Supplier diversification
  if (imports.length > 0) {
    const suppliers = [...new Set(imports.map(imp => imp.supplierName))];
    const supplierConcentration = imports.length / suppliers.length;
    
    if (supplierConcentration > 3) {
      insights.push({
        id: 'supplier-diversification',
        type: 'recommendation',
        priority: 'medium',
        title: 'Diversify Your Supplier Base',
        description: 'You have high concentration with few suppliers. Diversifying can reduce risk and potentially lower costs.',
        actionable: true,
        action: {
          label: 'Find New Suppliers',
          type: 'external',
          target: 'https://supplier.sparkcomex.com'
        },
        metadata: {
          impact: 'Risk reduction',
          timeline: '2-4 weeks'
        }
      });
    }
  }

  // Market trend insights
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 8 && currentMonth <= 10) { // Sep-Nov (high season)
    insights.push({
      id: 'seasonal-trend',
      type: 'trend',
      priority: 'medium',
      title: 'High Season Import Opportunity',
      description: 'We\'re in peak import season. Consider increasing your orders now to meet holiday demand and avoid year-end shipping delays.',
      actionable: true,
      action: {
        label: 'Plan Holiday Imports',
        type: 'navigate',
        target: '/imports'
      },
      metadata: {
        timeline: 'Next 2 months',
        impact: 'Revenue opportunity'
      }
    });
  }

  // New user onboarding
  const accountAge = Date.now() - new Date(user.createdAt).getTime();
  const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
  
  if (daysSinceCreation < 7 && imports.length === 0) {
    insights.push({
      id: 'onboarding-guidance',
      type: 'recommendation',
      priority: 'high',
      title: 'Complete Your Import Setup',
      description: 'Welcome to Spark Comex! Complete your first import setup to start leveraging our platform\'s full potential.',
      actionable: true,
      action: {
        label: 'Start First Import',
        type: 'navigate',
        target: '/imports'
      },
      metadata: {
        timeline: '15 minutes',
        impact: 'Getting started'
      }
    });
  }

  return insights.slice(0, 8); // Limit to 8 insights
}

function calculateInsightsSummary(insights: any[]) {
  return {
    totalOpportunities: insights.filter(i => i.type === 'opportunity').length,
    potentialValue: insights
      .filter(i => i.metadata?.value)
      .reduce((sum, i) => sum + i.metadata.value, 0),
    urgentActions: insights.filter(i => i.priority === 'high').length,
    completedActions: 0 // This would be tracked in a real implementation
  };
}
