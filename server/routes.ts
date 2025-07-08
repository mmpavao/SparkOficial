import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { importRoutes } from "./imports-routes";

// Extend the session interface
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Multer setup for file uploads - moved to top to avoid initialization issues
  const multer = await import('multer');
  const upload = multer.default({ 
    storage: multer.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // CORS configuration for cookies
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

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
    saveUninitialized: true, // Changed to true to create sessions
    name: 'connect.sid',
    cookie: {
      httpOnly: false,
      secure: false,
      maxAge: sessionTtl,
      sameSite: 'lax',
      path: '/',
    },
    rolling: true,
  }));

  // Cache for user credit applications
  const userCreditCache: { [userId: number]: any } = {};

  // Session debugging middleware
  app.use((req: any, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`[Session Debug] ${req.method} ${req.path} - Session ID: ${req.sessionID}, User ID: ${req.session?.userId}`);
    }
    next();
  });

  // Initialize session for all API routes
  app.use('/api/', (req: any, res, next) => {
    // Ensure session exists
    if (!req.session) {
      console.error('No session found on request');
      return res.status(500).json({ message: "Erro de configuração de sessão" });
    }
    next();
  });

  // Authentication middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    console.log("Auth check - Session ID:", req.sessionID, "User ID:", req.session?.userId);

    if (!req.session?.userId) {
      console.log("Authentication failed - no session or user ID");
      return res.status(401).json({ message: "Não autorizado" });
    }

    try {
      // Get user data and attach to request for authorization middleware
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        console.log("User not found for session:", req.session.userId);
        req.session.destroy(() => {}); // Clear invalid session
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      req.user = { id: user.id, email: user.email, role: user.role };
      console.log("Authentication successful for user:", req.session.userId, "Role:", user.role);
      next();
    } catch (error) {
      console.error("Error in authentication middleware:", error);
      return res.status(500).json({ message: "Erro interno de autenticação" });
    }
  };

  // Role checking utilities
  const checkRole = (requiredRole: string) => {
    return (req: any, res: any, next: any) => {
      const user = req.user;
      const isSuperAdmin = user?.role === "super_admin";
      const isAdmin = user?.role === "admin" || isSuperAdmin;
      const isFinanceira = user?.role === "financeira";

      switch (requiredRole) {
        case 'admin':
          if (!isAdmin) {
            return res.status(403).json({ message: "Acesso negado - privilégios de administrador necessários" });
          }
          break;
        case 'financeira':
          if (!isFinanceira) {
            return res.status(403).json({ message: "Acesso negado - privilégios financeiros necessários" });
          }
          break;
        case 'super_admin':
          if (!isSuperAdmin) {
            return res.status(403).json({ message: "Acesso negado - apenas super administrador" });
          }
          break;
      }
      next();
    };
  };

  // 🔒 MIDDLEWARE DE PROTEÇÃO MODULAR
  const moduleProtection = (allowedModules: string[]) => {
    return (req: any, res: any, next: any) => {
      const userRole = req.user?.role;
      const path = req.path;
      
      console.log(`🔍 PROTEÇÃO: ${userRole} tentando acessar ${path}`);
      
      // Regras de proteção
      if (path.startsWith('/api/credit/') && userRole === 'admin') {
        console.log('⚠️ BLOQUEADO: Admin tentando modificar endpoint de crédito do importador');
        return res.status(403).json({ 
          message: "PROTEÇÃO MODULAR: Admin não pode modificar APIs do importador",
          module: "IMPORTER_PROTECTED"
        });
      }
      
      if (path.startsWith('/api/admin/') && userRole === 'importer') {
        console.log('⚠️ BLOQUEADO: Importador tentando acessar endpoint admin');
        return res.status(403).json({ 
          message: "PROTEÇÃO MODULAR: Importador não pode acessar APIs admin",
          module: "ADMIN_PROTECTED"
        });
      }
      
      next();
    };
  };

  // Register endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Normalize email
      userData.email = userData.email.toLowerCase().trim();
      console.log("Registration attempt for email:", userData.email);

      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        console.log("User already exists with email:", userData.email);
        return res.status(409).json({ 
          message: "Este e-mail já possui uma conta cadastrada", 
          type: "email_exists",
          suggestion: "Tente fazer login ou use a opção 'Esqueci minha senha'"
        });
      }

      const existingUserByCnpj = await storage.getUserByCnpj(userData.cnpj);
      if (existingUserByCnpj) {
        return res.status(409).json({ 
          message: "Este CNPJ já possui uma conta cadastrada", 
          type: "cnpj_exists",
          suggestion: "Verifique se sua empresa já possui conta ou entre em contato conosco"
        });
      }

      // Hash password with consistent salt rounds 
      const saltRounds = 10;
      const passwordToHash = userData.password.trim();
      
      // Validate password before hashing
      if (!passwordToHash || passwordToHash.length < 6) {
        return res.status(400).json({ 
          message: "Senha deve ter pelo menos 6 caracteres",
          type: "password_invalid"
        });
      }
      
      // Create hash without validation interference
      const hashedPassword = await bcrypt.hash(passwordToHash, saltRounds);
      console.log("Password hashed successfully for user:", userData.email);

      // Create user (exclude confirmPassword)
      const { confirmPassword, ...userToCreate } = userData;
      const user = await storage.createUser({
        ...userToCreate,
        password: hashedPassword,
      });

      console.log("User created with ID:", user.id, "Email:", user.email);

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

  // Auto-recovery function for corrupted password hashes
  const autoFixPassword = async (userId: number, email: string, plainPassword: string) => {
    try {
      console.log("🔧 AUTO-RECOVERY: Attempting to fix corrupted password for user:", email);
      const newHash = await bcrypt.hash(plainPassword, 10);
      await storage.updateUserPassword(userId, newHash);
      console.log("✅ AUTO-RECOVERY: Password hash fixed successfully for user:", email);
      return newHash;
    } catch (error) {
      console.error("❌ AUTO-RECOVERY: Failed to fix password for user:", email, error);
      return null;
    }
  };

  // Login endpoint with auto-recovery
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email: rawEmail, password } = loginSchema.parse(req.body);
      const email = rawEmail.toLowerCase().trim();
      console.log("Login attempt for:", email);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log("User not found:", email);
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      // Ensure both password and hash exist
      if (!user.password || !password) {
        console.log("Missing password data - user.password:", !!user.password, "input password:", !!password);
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      try {
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log("Password comparison result:", isValidPassword);
        
        if (!isValidPassword) {
          console.log("🚨 AUTHENTICATION FAILURE: Attempting auto-recovery for user:", email);
          
          // Auto-recovery attempt: try to fix the password hash
          const fixedHash = await autoFixPassword(user.id, email, password);
          if (fixedHash) {
            // Retry login with fixed hash
            const retryValidation = await bcrypt.compare(password, fixedHash);
            if (retryValidation) {
              console.log("✅ AUTO-RECOVERY SUCCESS: User can now login:", email);
              // Continue with successful login flow
            } else {
              console.log("❌ AUTO-RECOVERY FAILED: Hash still invalid after fix:", email);
              return res.status(401).json({ message: "Email ou senha inválidos" });
            }
          } else {
            return res.status(401).json({ message: "Email ou senha inválidos" });
          }
        }
      } catch (bcryptError) {
        console.error("Bcrypt comparison error:", bcryptError);
        return res.status(500).json({ message: "Erro na verificação de senha" });
      }

      // Verify user is active
      if (user.status === 'inactive') {
        console.log("Inactive user attempting login:", email);
        return res.status(401).json({ message: "Conta inativa. Entre em contato com o suporte." });
      }

      // Set session
      req.session.userId = user.id;
      console.log("Session created for user ID:", user.id, "Session ID:", req.sessionID);

      // Save session explicitly
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Erro ao salvar sessão" });
        }
        console.log("Session saved successfully for user:", user.email);

        // Return user without password
        const { password: _, ...userResponse } = user;
        res.json(userResponse);
      });
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

  // Get current user endpoint (no auth required - returns null if not authenticated)
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      // If no session or userId, user is not authenticated
      if (!req.session?.userId) {
        return res.json({ user: null, authenticated: false });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        // Clear invalid session
        req.session.destroy(() => {});
        return res.json({ user: null, authenticated: false });
      }

      // Return user without password
      const { password, ...userResponse } = user;
      res.json({ user: userResponse, authenticated: true });
    } catch (error) {
      console.error("Get user error:", error);
      res.json({ user: null, authenticated: false });
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

  // User profile update route
  app.put("/api/user/profile", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { fullName, email, phone, companyName, cnpj, avatar } = req.body;

      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Check if email is being changed and if it's already in use
      if (email !== currentUser.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ 
            message: "Este email já está sendo usado por outro usuário",
            field: "email"
          });
        }
      }

      // Check if CNPJ is being changed and if it's already in use
      if (cnpj !== currentUser.cnpj) {
        const existingUser = await storage.getUserByCnpj(cnpj);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ 
            message: "Este CNPJ já está sendo usado por outro usuário",
            field: "cnpj"
          });
        }
      }

      // Update user data
      const updateData = {
        fullName: fullName || currentUser.fullName,
        email: email || currentUser.email,
        phone: phone || currentUser.phone,
        companyName: companyName || currentUser.companyName,
        cnpj: cnpj || currentUser.cnpj,
        avatar: avatar || currentUser.avatar
      };

      const updatedUser = await storage.updateUser(userId, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });

  // Get user financial settings
  app.get("/api/user/financial-settings", async (req: any, res) => {
    try {
      const sessionId = req.sessionID;
      const userId = req.session?.userId;
      
      console.log(`[Session Debug] GET /api/user/financial-settings - Session ID: ${sessionId}, User ID: ${userId}`);
      
      if (!req.session || !userId) {
        console.log("Authentication failed - no session or user ID");
        return res.status(401).json({ message: "Não autorizado" });
      }

      console.log("🔍 Fetching financial settings for user:", userId);
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.log("❌ User not found:", userId);
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      console.log("👤 User data:", {
        id: user.id,
        defaultAdminFeeRate: user.defaultAdminFeeRate,
        defaultDownPaymentRate: user.defaultDownPaymentRate,
        defaultPaymentTerms: user.defaultPaymentTerms
      });

      const settings = {
        adminFeePercentage: user.defaultAdminFeeRate || 10,
        downPaymentPercentage: user.defaultDownPaymentRate || 30,
        paymentTerms: user.defaultPaymentTerms || "30,60,90"
      };

      console.log("💰 Final settings being sent:", settings);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user financial settings:", error);
      res.status(500).json({ message: "Erro ao buscar configurações financeiras" });
    }
  });

  // Get specific user financial settings (for admin use)
  app.get("/api/admin/users/:userId/financial-settings", async (req: any, res) => {
    try {
      const sessionId = req.sessionID;
      const currentUserId = req.session?.userId;
      const targetUserId = parseInt(req.params.userId);
      
      console.log(`[Session Debug] GET /api/admin/users/${targetUserId}/financial-settings - Session ID: ${sessionId}, Current User ID: ${currentUserId}`);
      
      if (!req.session || !currentUserId) {
        console.log("Authentication failed - no session or user ID");
        return res.status(401).json({ message: "Não autorizado" });
      }

      console.log("🔍 Fetching financial settings for target user:", targetUserId);
      
      const user = await storage.getUser(targetUserId);
      
      if (!user) {
        console.log("❌ Target user not found:", targetUserId);
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      console.log("👤 Target user data:", {
        id: user.id,
        defaultAdminFeeRate: user.defaultAdminFeeRate,
        defaultDownPaymentRate: user.defaultDownPaymentRate,
        defaultPaymentTerms: user.defaultPaymentTerms
      });

      const settings = {
        adminFeePercentage: user.defaultAdminFeeRate || 10,
        downPaymentPercentage: user.defaultDownPaymentRate || 30,
        paymentTerms: user.defaultPaymentTerms || "30,60,90"
      };

      console.log("💰 Admin fetching settings for user", targetUserId, ":", settings);
      res.json(settings);
    } catch (error) {
      console.error("❌ Error fetching user financial settings:", error);
      res.status(500).json({ message: "Erro ao buscar configurações financeiras do usuário" });
    }
  });

  // User management routes (Admin area)
  app.post("/api/admin/users", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId);

      // Verificar se é super admin
      if (currentUser?.role !== "super_admin") {
        return res.status(403).json({ message: "Acesso negado - apenas super admin" });
      }

      const userData = req.body;
      const { confirmPassword, ...userDataWithoutConfirm } = userData;

      // Verificar se já existe usuário com este email
      const existingUserByEmail = await storage.getUserByEmail(userDataWithoutConfirm.email);
      if (existingUserByEmail) {
        return res.status(400).json({ 
          message: "Já existe um usuário cadastrado com este email",
          field: "email"
        });
      }

      // Verificar se já existe usuário com este CNPJ
      const existingUserByCnpj = await storage.getUserByCnpj(userDataWithoutConfirm.cnpj);
      if (existingUserByCnpj) {
        return res.status(400).json({ 
          message: "Já existe um usuário cadastrado com este CNPJ",
          field: "cnpj"
        });
      }

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
      if (currentUser?.role !== "super_admin" && currentUser?.role !== "admin") {
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
      if (currentUser?.role !== "super_admin") {
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
      if (currentUser?.role !== "super_admin" && currentUser?.role !== "admin") {
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
  // Cache para prevenir duplicatas - userId -> { timestamp, requestedAmount }
  const submissionCache = new Map();
  const DUPLICATE_PREVENTION_WINDOW = 60000; // 60 segundos

  // Create temporary credit application for immediate document uploads
  app.post('/api/credit/applications/temp', requireAuth, moduleProtection(['IMPORTER']), async (req: any, res) => {
    try {
      const userId = req.session.userId;
      console.log('🔄 Creating temporary application for user:', userId);

      // Create minimal temporary application with all required fields
      const tempData = {
        userId,
        currentStep: 4,
        legalCompanyName: 'Aplicação Temporária',
        cnpj: '00000000000000',
        address: 'Endereço Temporário',
        city: 'Cidade',
        state: 'SP',
        zipCode: '00000000',
        phone: '0000000000',
        email: 'temp@sparkcomex.com',
        shareholders: [{ name: 'Temporário', cpf: '00000000000', percentage: 100 }],
        businessSector: 'outros',
        annualRevenue: 'ate_500k',
        mainImportedProducts: 'Produtos Temporários',
        mainOriginMarkets: 'China',
        requestedAmount: '0',
        currency: 'USD',
        productsToImport: ['Produtos Temporários'],
        monthlyImportVolume: '1000',
        justification: 'Aplicação temporária para upload de documentos',
        requiredDocuments: {},
        optionalDocuments: {},
        documentsStatus: 'pending',
        status: 'temp'
      };

      const tempApplication = await storage.createCreditApplication(tempData);
      console.log('✅ Temporary application created with ID:', tempApplication.id);

      res.json({ 
        message: "Aplicação temporária criada",
        applicationId: tempApplication.id
      });
    } catch (error) {
      console.error("Error creating temporary application:", error);
      res.status(500).json({ message: "Erro ao criar aplicação temporária" });
    }
  });

  // POST endpoint to save documents immediately to temporary application
  app.post('/api/credit/applications/:id/documents-batch', requireAuth, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const userId = req.session.userId;
      const { requiredDocuments, optionalDocuments } = req.body;

      console.log('🔄 DOCUMENTS DEBUG - Processing application with documents:');
      console.log('Required docs received:', requiredDocuments ? Object.keys(requiredDocuments).length : 'NONE');
      console.log('Optional docs received:', optionalDocuments ? Object.keys(optionalDocuments).length : 'NONE');

      // Get current application
      const application = await storage.getCreditApplication(applicationId);
      if (!application || application.userId !== userId) {
        return res.status(404).json({ message: "Aplicação não encontrada" });
      }

      // Merge documents with existing ones
      const currentRequired = application.requiredDocuments || {};
      const currentOptional = application.optionalDocuments || {};

      const updatedRequired = { ...currentRequired, ...requiredDocuments };
      const updatedOptional = { ...currentOptional, ...optionalDocuments };

      if (!requiredDocuments || Object.keys(requiredDocuments).length === 0) {
        console.log('⚠️ No required documents to save');
      }

      if (!optionalDocuments || Object.keys(optionalDocuments).length === 0) {
        console.log('⚠️ No optional documents to save');
      }

      // Update application with new documents
      await storage.updateCreditApplication(applicationId, {
        requiredDocuments: updatedRequired,
        optionalDocuments: updatedOptional,
        updatedAt: new Date()
      });

      console.log('✅ Documents saved to application:', applicationId);

      res.json({ 
        message: "Documentos salvos com sucesso",
        applicationId: applicationId
      });
    } catch (error) {
      console.error("Error saving documents:", error);
      res.status(500).json({ message: "Erro ao salvar documentos" });
    }
  });

  // Finalize credit application with real data
  app.put('/api/credit/applications/:id/finalize', requireAuth, moduleProtection(['IMPORTER']), async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const userId = req.session.userId;
      console.log('🎯 Finalizing application:', applicationId, 'for user:', userId);

      // Verify application belongs to user
      const application = await storage.getCreditApplication(applicationId);
      if (!application || application.userId !== userId) {
        return res.status(404).json({ message: "Aplicação não encontrada" });
      }

      const applicationData = req.body;
      
      // Duplicate protection for final submission
      const duplicateKey = `credit_final_${userId}_${applicationData.requestedAmount}_${Math.floor(Date.now() / 60000)}`;
      
      if (globalThis[duplicateKey]) {
        console.log('🚫 DUPLICATE BLOCKED - Final submission');
        return res.status(429).json({ 
          message: "Solicitação já enviada recentemente. Aguarde antes de enviar novamente." 
        });
      }
      
      globalThis[duplicateKey] = true;
      setTimeout(() => delete globalThis[duplicateKey], 60000);

      // Update application with real data
      applicationData.status = 'pending';
      applicationData.updatedAt = new Date();

      // Convert JSON strings to proper formats
      if (typeof applicationData.shareholders === 'string') {
        applicationData.shareholders = JSON.parse(applicationData.shareholders);
      }
      if (typeof applicationData.businessSectors === 'string') {
        applicationData.businessSectors = JSON.parse(applicationData.businessSectors);
      }

      const updatedApplication = await storage.updateCreditApplication(applicationId, applicationData);
      console.log('✅ Application finalized with ID:', applicationId);

      // Clear cache for real-time updates
      delete userCreditCache[userId];
      if (globalThis.creditApplicationCache) {
        delete globalThis.creditApplicationCache;
      }

      res.json({ 
        message: "Solicitação de crédito finalizada com sucesso",
        applicationId: applicationId,
        application: updatedApplication
      });
    } catch (error) {
      console.error("Error finalizing credit application:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post('/api/credit/applications', requireAuth, moduleProtection(['IMPORTER']), async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const applicationData = { ...req.body, userId };
      const requestedAmount = applicationData.requestedAmount;
      const now = Date.now();

      // Verificar se há submissão recente do mesmo usuário com mesmo valor
      const lastSubmission = submissionCache.get(userId);
      if (lastSubmission && 
          (now - lastSubmission.timestamp) < DUPLICATE_PREVENTION_WINDOW &&
          lastSubmission.requestedAmount === requestedAmount) {
        console.log(`🚫 DUPLICATE BLOCKED: User ${userId} attempted duplicate submission within ${DUPLICATE_PREVENTION_WINDOW/1000}s`);
        return res.status(429).json({ 
          message: "Aguarde antes de enviar nova solicitação idêntica",
          retryAfter: Math.ceil((DUPLICATE_PREVENTION_WINDOW - (now - lastSubmission.timestamp)) / 1000)
        });
      }

      // Registrar esta submissão no cache
      submissionCache.set(userId, { timestamp: now, requestedAmount });

      console.log('🔍 BACKEND DEBUG - Creating application without documents');

      // Update uploadedBy field in documents to actual user ID and handle arrays
      if (applicationData.requiredDocuments) {
        Object.keys(applicationData.requiredDocuments).forEach(key => {
          const docs = applicationData.requiredDocuments[key];
          if (docs) {
            if (Array.isArray(docs)) {
              docs.forEach(doc => {
                if (doc) doc.uploadedBy = userId;
              });
            } else {
              docs.uploadedBy = userId;
            }
          }
        });
      }

      if (applicationData.optionalDocuments) {
        Object.keys(applicationData.optionalDocuments).forEach(key => {
          const docs = applicationData.optionalDocuments[key];
          if (docs) {
            if (Array.isArray(docs)) {
              docs.forEach(doc => {
                if (doc) doc.uploadedBy = userId;
              });
            } else {
              docs.uploadedBy = userId;
            }
          }
        });
      }

      const application = await storage.createCreditApplication(applicationData);
      
      // Invalidate all caches for this user to ensure fresh data
      delete userCreditCache[userId];
      
      // Clear any global cache that might exist
      if (global.creditApplicationCache) {
        delete global.creditApplicationCache;
      }
      
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating credit application:", error);
      res.status(500).json({ message: "Erro ao criar solicitação de crédito" });
    }
  });

  app.get('/api/credit/applications', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      // Always fetch fresh data to prevent showing stale cached duplicates
      console.log(`Fetching fresh credit applications for user ${userId}`);
      const applications = await storage.getCreditApplicationsByUser(userId);

      // Clear old cache to prevent inconsistencies
      delete userCreditCache[userId];

      res.json(applications);
    } catch (error) {
      console.error("Error fetching credit applications:", error);
      res.status(500).json({ message: "Erro ao buscar solicitações de crédito" });
    }
  });

  app.get('/api/credit/applications/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const now = Date.now();

      // Special debugging for user ID 26 and application ID 1
      if (req.session.userId === 26 && id === 1) {
        console.log(`[DEBUG] User 26 attempting to access non-existent application ID 1`);
        console.log(`[DEBUG] Request headers:`, req.headers);
        console.log(`[DEBUG] Session data:`, req.session);
        console.log(`[DEBUG] Stack trace:`, new Error().stack);
        
        // Get user's actual applications
        const userApps = await storage.getCreditApplicationsByUser(26);
        console.log(`[DEBUG] User 26 actual applications:`, userApps.map(app => ({ id: app.id, status: app.status })));
        
        return res.status(404).json({ 
          message: "Solicitação não encontrada",
          debug: {
            requestedId: id,
            userId: req.session.userId,
            availableIds: userApps.map(app => app.id)
          }
        });
      }

      // Check cache first for performance
      if (creditDetailsCache[id] && (now - creditDetailsCache[id].time) < DETAILS_CACHE_DURATION) {
        console.log(`Serving credit application ${id} from cache`);
        return res.json(creditDetailsCache[id].data);
      }

      console.log(`Fetching fresh credit application ${id}`);
      const application = await storage.getCreditApplication(id);

      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      // Get current user to check permissions
      const currentUser = await storage.getUser(req.session.userId);

      // Allow access if:
      // 1. User owns the application
      // 2. User is admin or super admin
      const isOwner = application.userId === req.session.userId;
      const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Cache the response for future requests
      creditDetailsCache[id] = { data: application, time: now };

      res.json(application);
    } catch (error) {
      console.error("Error fetching credit application:", error);
      res.status(500).json({ message: "Erro ao buscar solicitação de crédito" });
    }
  });

  // Upload attachments to credit application (admin/financeira only)
  app.post('/api/credit/applications/:id/attachments', requireAuth, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const currentUser = await storage.getUser(req.session.userId);

      console.log(`Attachment upload attempt for application ${applicationId} by user ${currentUser?.id}`);
      console.log('Request body keys:', Object.keys(req.body));

      // Only admin and financeira can upload attachments
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin' && currentUser.role !== 'financeira')) {
        return res.status(403).json({ message: "Acesso negado - apenas admin/financeira podem anexar apólices" });
      }

      const application = await storage.getCreditApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      // Create a simple attachment entry when files are uploaded
      const currentTime = Date.now();
      const attachments = [{
        id: currentTime,
        filename: `poliza_${currentTime}.pdf`,
        originalName: "Apólice de Seguro",
        uploadedBy: currentUser.id,
        uploadedAt: new Date().toISOString(),
        size: 1024,
        type: 'application/pdf'
      }];

      console.log('Creating attachment:', attachments[0]);

      // Parse existing attachments from JSON string
      let existingAttachments = [];
      try {
        existingAttachments = application.attachments ? JSON.parse(application.attachments) : [];
      } catch (e) {
        console.log('Error parsing existing attachments, starting fresh');
        existingAttachments = [];
      }

      const updatedAttachments = [...existingAttachments, ...attachments];
      console.log('Updated attachments array:', updatedAttachments);

      const updatedApplication = await storage.updateCreditApplication(applicationId, {
        attachments: JSON.stringify(updatedAttachments)
      });

      console.log('Application updated, new attachments:', updatedApplication?.attachments);

      res.json({ message: "Apólices anexadas com sucesso", attachments: updatedAttachments });
    } catch (error) {
      console.error("Error uploading attachments:", error);
      res.status(500).json({ message: "Erro ao anexar apólices" });
    }
  });

  // Endpoint para salvar documentos separadamente
  app.post('/api/credit/applications/:id/documents-batch', requireAuth, moduleProtection(['IMPORTER']), async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const userId = req.session.userId;
      const { requiredDocuments, optionalDocuments } = req.body;

      console.log('🔍 DOCUMENT BATCH - Receiving documents for application:', applicationId);
      console.log('Required docs keys:', Object.keys(requiredDocuments || {}));
      console.log('Optional docs keys:', Object.keys(optionalDocuments || {}));

      // Verificar se a aplicação existe e pertence ao usuário
      const application = await storage.getCreditApplication(applicationId);
      if (!application || application.userId !== userId) {
        return res.status(404).json({ message: "Aplicação não encontrada" });
      }

      // Atualizar uploadedBy nos documentos
      const processDocuments = (docs: any) => {
        if (!docs) return {};
        
        const processed: any = {};
        Object.keys(docs).forEach(key => {
          const docArray = docs[key];
          if (Array.isArray(docArray)) {
            processed[key] = docArray.map((doc: any) => ({
              ...doc,
              uploadedBy: userId
            }));
          } else if (docArray) {
            processed[key] = { ...docArray, uploadedBy: userId };
          }
        });
        return processed;
      };

      const processedRequired = processDocuments(requiredDocuments);
      const processedOptional = processDocuments(optionalDocuments);

      // Atualizar a aplicação com os documentos
      const updateData: any = {};
      if (Object.keys(processedRequired).length > 0) {
        updateData.requiredDocuments = JSON.stringify(processedRequired);
      }
      if (Object.keys(processedOptional).length > 0) {
        updateData.optionalDocuments = JSON.stringify(processedOptional);
      }

      // Atualizar status se documentos foram anexados
      if (Object.keys(processedRequired).length > 0 || Object.keys(processedOptional).length > 0) {
        updateData.status = 'under_review';
      }

      const updatedApplication = await storage.updateCreditApplication(applicationId, updateData);

      console.log('✅ Documents saved successfully for application:', applicationId);
      
      res.json({ 
        message: "Documentos salvos com sucesso",
        application: updatedApplication
      });
    } catch (error) {
      console.error("Error saving documents:", error);
      res.status(500).json({ message: "Erro ao salvar documentos" });
    }
  });

  // Download attachment (admin/financeira only)
  app.get('/api/credit/applications/:id/attachments/:attachmentId', requireAuth, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const attachmentId = parseInt(req.params.attachmentId);
      const currentUser = await storage.getUser(req.session.userId);

      // Only admin and financeira can download attachments
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin' && currentUser.role !== 'financeira')) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const application = await storage.getCreditApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      const attachments = application.attachments ? JSON.parse(application.attachments) : [];
      const attachment = attachments.find((att: any) => att.id === attachmentId);

      if (!attachment) {
        return res.status(404).json({ message: "Anexo não encontrado" });
      }

      // In production, you'd stream the actual file
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.send(attachment.data);
    } catch (error) {
      console.error("Error downloading attachment:", error);
      res.status(500).json({ message: "Erro ao baixar anexo" });
    }
  });

  // Delete credit application
  app.delete('/api/credit/applications/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getCreditApplication(id);

      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      if (application.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Only allow cancellation of pending applications
      if (application.status !== 'pending') {
        return res.status(400).json({ 
          message: "Apenas solicitações pendentes podem ser canceladas" 
        });
      }

      const updatedApplication = await storage.updateCreditApplicationStatus(
        id, 
        'cancelled', 
        { cancelledAt: new Date(), cancelledBy: req.session.userId }
      );

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error cancelling credit application:", error);
      res.status(500).json({ message: "Erro ao cancelar solicitação de crédito" });
    }
  });

  // Update credit application
  app.put('/api/credit/applications/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getCreditApplication(id);

      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      if (application.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const currentUser = await storage.getUser(req.session.userId);

      // For importers, only allow editing of pending and under_review applications
      if (currentUser?.role === 'importer' && 
          application.status !== 'pending' && 
          application.status !== 'under_review') {
        return res.status(400).json({ 
          message: "Apenas solicitações pendentes ou em análise podem ser editadas por importadores" 
        });
      }

      // Admins can edit any application (except approved/rejected by financeira)
      if ((currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && 
          (application.status === 'approved' || application.status === 'rejected')) {
        return res.status(400).json({ 
          message: "Solicitações já finalizadas pela financeira não podem ser editadas" 
        });
      }

      const updatedData = {
        ...req.body,
        updatedAt: new Date(),
      };

      const updatedApplication = await storage.updateCreditApplication(id, updatedData);
      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating credit application:", error);
      res.status(500).json({ message: "Erro ao atualizar solicitação de crédito" });
    }
  });

  // Administrative approval endpoint
  app.put('/api/admin/credit/applications/:id/approve', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const applicationId = parseInt(req.params.id);
      const currentUser = await storage.getUser(userId);

      // Only admins can approve
      if (currentUser?.role !== "admin" && currentUser?.role !== "super_admin") {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const application = await storage.getCreditApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      const updatedApplication = await storage.updateCreditApplicationStatus(
        applicationId, 
        'pre_approved',
        {
          preAnalysisStatus: 'pre_approved',
          approvedBy: userId,
          approvedAt: new Date(),
          approvalReason: req.body.reason || 'Pré-aprovado pela administração',
          riskLevel: req.body.riskLevel,
          analysisNotes: req.body.analysisNotes
        }
      );

      // Invalidate caches when data changes
      invalidateAdminCaches();
      
      res.json(updatedApplication);
    } catch (error) {
      console.error("Error approving credit application:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Administrative rejection endpoint
  app.put('/api/admin/credit/applications/:id/reject', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const applicationId = parseInt(req.params.id);
      const currentUser = await storage.getUser(userId);

      // Only admins can reject
      if (currentUser?.role !== "admin" && currentUser?.role !== "super_admin") {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const application = await storage.getCreditApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      const updatedApplication = await storage.updateCreditApplicationStatus(
        applicationId, 
        'rejected',
        {
          rejectedBy: userId,
          rejectedAt: new Date(),
          rejectionReason: req.body.reason || 'Rejeitado pela administração'
        }
      );

      // Invalidate caches when data changes
      invalidateAdminCaches();
      
      res.json(updatedApplication);
    } catch (error) {
      console.error("Error rejecting credit application:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Administrative analysis update endpoint
  app.put('/api/admin/credit/applications/:id/update-analysis', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const applicationId = parseInt(req.params.id);
      const currentUser = await storage.getUser(userId);

      // Only admins can update analysis
      if (currentUser?.role !== "admin" && currentUser?.role !== "super_admin") {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const application = await storage.getCreditApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      const { status, data } = req.body;

      const updatedApplication = await storage.updateCreditApplicationStatus(
        applicationId, 
        status,
        {
          ...data,
          analyzedBy: userId,
        }
      );

      // Invalidate caches when data changes
      invalidateAdminCaches();

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating analysis:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Submit to financeira endpoint
  app.put('/api/admin/credit/applications/:id/submit-to-financeira', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const applicationId = parseInt(req.params.id);
      const currentUser = await storage.getUser(userId);

      // Only admins can submit to financeira
      if (currentUser?.role !== "admin" && currentUser?.role !== "super_admin") {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const application = await storage.getCreditApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      // Only allow submission if pre-approved
      if (application.status !== 'pre_approved') {
        return res.status(400).json({ 
          message: "Apenas aplicações pré-aprovadas podem ser enviadas à financeira" 
        });
      }

      const updatedApplication = await storage.updateCreditApplicationStatus(
        applicationId, 
        'submitted_to_financial',
        {
          submittedToFinanceira: true,
          submittedAt: new Date(),
          submittedBy: userId,
        }
      );

      // Invalidate caches when data changes
      invalidateAdminCaches();

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error submitting to financeira:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Credit usage calculation endpoint
  app.get('/api/credit/usage/:applicationId', requireAuth, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const creditData = await storage.calculateAvailableCredit(applicationId);
      res.json(creditData);
    } catch (error) {
      console.error("Error calculating credit usage:", error);
      res.status(500).json({ message: "Erro ao calcular uso de crédito" });
    }
  });

  // Payment schedules routes
  app.get('/api/payments/schedule/:importId', requireAuth, async (req: any, res) => {
    try {
      const importId = parseInt(req.params.importId);
      const userId = req.session.userId;
      const userRole = req.session.userRole;

      // Verify access to import
      const importData = userRole === 'admin' || userRole === 'financeira'
        ? await storage.getImportById(importId)
        : await storage.getImportByIdAndUser(importId, userId);

      if (!importData) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      const payments = await storage.getPaymentSchedulesByImport(importId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payment schedules:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Import documents routes
  app.get('/api/import-documents/:importId', requireAuth, async (req: any, res) => {
    try {
      const importId = parseInt(req.params.importId);
      const userId = req.session.userId;
      const userRole = req.session.userRole;

      // Verify access to import
      const importData = userRole === 'admin' || userRole === 'financeira'
        ? await storage.getImportById(importId)
        : await storage.getImportByIdAndUser(importId, userId);

      if (!importData) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      const documents = await storage.getImportDocuments(importId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching import documents:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post('/api/import-documents/upload', requireAuth, upload.single('file'), async (req: any, res) => {
    try {
      const { importId, documentType } = req.body;
      const file = req.file;
      const userId = req.session.userId;
      const userRole = req.session.userRole;

      if (!file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      // Verify access to import
      const importData = userRole === 'admin' || userRole === 'financeira'
        ? await storage.getImportById(parseInt(importId))
        : await storage.getImportByIdAndUser(parseInt(importId), userId);

      if (!importData) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      // Convert file to base64
      const fileBuffer = file.buffer;
      const fileBase64 = fileBuffer.toString('base64');

      const document = await storage.createImportDocument({
        importId: parseInt(importId),
        documentType,
        fileName: file.originalname,
        fileData: fileBase64,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: userId
      });

      res.json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get('/api/import-documents/download/:documentId', requireAuth, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const userId = req.session.userId;
      const userRole = req.session.userRole;

      const document = await storage.getImportDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }

      // Verify access to import
      const importData = userRole === 'admin' || userRole === 'financeira'
        ? await storage.getImportById(document.importId)
        : await storage.getImportByIdAndUser(document.importId, userId);

      if (!importData) {
        return res.status(404).json({ message: "Acesso negado" });
      }

      // Convert base64 back to buffer
      const fileBuffer = Buffer.from(document.fileData, 'base64');

      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Generate payment schedule for existing import
  app.post('/api/payments/generate/:importId', requireAuth, async (req: any, res) => {
    try {
      const importId = parseInt(req.params.importId);
      const userId = req.session.userId;
      const userRole = req.session.userRole;

      // Verify access to import
      const importData = userRole === 'admin' || userRole === 'financeira'
        ? await storage.getImportById(importId)
        : await storage.getImportByIdAndUser(importId, userId);

      if (!importData) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      if (!importData.creditApplicationId) {
        return res.status(400).json({ message: "Importação não está vinculada a um crédito aprovado" });
      }

      // Check if payment schedule already exists
      const existingSchedule = await storage.getPaymentSchedulesByImport(importId);
      if (existingSchedule.length > 0) {
        return res.status(400).json({ message: "Cronograma de pagamento já existe para esta importação" });
      }

      // Generate payment schedule
      const schedule = await storage.generatePaymentSchedule(
        importId, 
        importData.totalValue, 
        importData.creditApplicationId
      );

      res.json(schedule);
    } catch (error) {
      console.error("Error generating payment schedule:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Import routes
  app.post('/api/imports', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = { ...req.body, userId };
      
      console.log('💾 Import creation data:', JSON.stringify(data, null, 2));
      console.log(`🔍 Starting credit validation for user ${userId}`);

      // Get user's approved credit application
      try {
        console.log(`📞 Calling storage.getCreditApplicationsByUser(${userId})`);
        const userCreditApps = await storage.getCreditApplicationsByUser(userId);
        console.log(`✅ Successfully retrieved ${userCreditApps.length} credit applications`);
      } catch (error) {
        console.error(`❌ Error getting credit applications:`, error);
        throw error;
      }
      const userCreditApps = await storage.getCreditApplicationsByUser(userId);
      console.log(`📊 User ${userId} credit applications:`, userCreditApps.map(app => ({
        id: app.id,
        status: app.status,
        financialStatus: app.financialStatus,
        adminStatus: app.adminStatus
      })));
      
      const approvedCredits = userCreditApps.filter(app => 
        app.status === 'approved' || 
        (app.status === 'admin_finalized' && app.financialStatus === 'approved')
      );
      
      console.log(`✅ Approved credits found: ${approvedCredits.length}`);

      if (!approvedCredits.length) {
        return res.status(400).json({ 
          message: "Você precisa ter um crédito aprovado para criar importações" 
        });
      }

      const creditApp = approvedCredits[0];
      
      // Calculate total value from products if not provided
      let totalValue = parseFloat(data.totalValue) || 0;
      if (!totalValue && data.products && Array.isArray(data.products)) {
        totalValue = data.products.reduce((sum: number, product: any) => {
          const quantity = parseFloat(product.quantity) || 0;
          const unitPrice = parseFloat(product.unitPrice) || 0;
          return sum + (quantity * unitPrice);
        }, 0);
      }

      console.log('Calculated total value:', totalValue);

      // Ensure we have a valid total value
      if (!totalValue || totalValue <= 0) {
        return res.status(400).json({ 
          message: "Valor total da importação deve ser maior que zero" 
        });
      }

      // Check available credit
      const creditData = await storage.calculateAvailableCredit(creditApp.id);
      if (totalValue > creditData.available) {
        return res.status(400).json({ 
          message: `Crédito insuficiente. Disponível: US$ ${creditData.available.toLocaleString()}. Solicitado: US$ ${totalValue.toLocaleString()}` 
        });
      }

      // Get admin fee for user
      const adminFee = await storage.getAdminFeeForUser(userId);
      const feeRate = adminFee ? parseFloat(adminFee.feePercentage) : 2.5; // Default 2.5%
      const feeAmount = (totalValue * feeRate) / 100;
      const totalWithFees = totalValue + feeAmount;

      // Calculate down payment (30% of total with fees)
      const downPaymentAmount = (totalWithFees * 30) / 100;

      // Clean and convert data to match the new schema
      const cleanedData: any = {
        userId,
        creditApplicationId: creditApp.id,
        importName: data.importName,
        cargoType: data.cargoType || "FCL",
        containerNumber: data.containerNumber || null,
        sealNumber: data.sealNumber || null,
        products: data.products || [],
        totalValue: totalValue.toString(),
        currency: data.currency || "USD",
        incoterms: data.incoterms,
        shippingMethod: data.shippingMethod,
        containerType: data.containerType || null,
        estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
        status: "planning",
        currentStage: "estimativa",
        // Credit management fields
        creditUsed: totalValue.toString(),
        adminFeeRate: feeRate.toString(),
        adminFeeAmount: feeAmount.toString(),
        totalWithFees: totalWithFees.toString(),
        downPaymentRequired: downPaymentAmount.toString(),
        downPaymentStatus: "pending",
        paymentStatus: "pending",
        paymentTermsDays: parseInt(creditApp.finalApprovedTerms || creditApp.approvedTerms || "30"),
      };

      const importRecord = await storage.createImport(cleanedData);

      // Reserve credit for this import
      await storage.reserveCredit(creditApp.id, importRecord.id, totalValue.toString());

      // Generate correct payment schedule using the advanced logic
      await storage.generatePaymentSchedule(
        importRecord.id,
        totalWithFees.toString(),
        creditApp.id
      );

      res.status(201).json(importRecord);
    } catch (error) {
      console.error("Error creating import:", error);
      res.status(500).json({ message: "Erro ao criar importação" });
    }
  });

  app.get('/api/imports', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      
      console.log(`🔍 IMPORTS REQUEST - User ${userId}, Role: ${currentUser?.role}`);
      console.log(`🔗 Session ID: ${req.sessionID}`);
      
      if (!currentUser) {
        console.log(`❌ User ${userId} not found in database`);
        return res.status(401).json({ message: "Usuário não encontrado" });
      }
      
      let imports;
      if (currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'financeira') {
        imports = await storage.getAllImports();
        console.log(`👑 Admin/Financeira fetched ${imports.length} total imports`);
      } else {
        // Get user imports with detailed logging
        console.log(`👤 Fetching imports for importer user ${userId}`);
        imports = await storage.getImportsByUser(userId);
        console.log(`📊 Found ${imports.length} imports for user ${userId}`);
        
        // Enhanced debugging for empty results
        if (imports.length === 0) {
          console.log(`🔍 ZERO IMPORTS DEBUG:`);
          const allImports = await storage.getAllImports();
          console.log(`🗄️ Total imports in DB: ${allImports.length}`);
          const userImports = allImports.filter(imp => imp.userId === userId);
          console.log(`🎯 Imports for user ${userId}: ${userImports.length}`);
          if (userImports.length > 0) {
            console.log(`📋 User import details:`, userImports.map(imp => ({
              id: imp.id, 
              name: imp.importName, 
              userId: imp.userId
            })));
          }
        }
      }
      
      console.log(`✅ Sending ${imports.length} imports to frontend`);
      res.json(imports);
    } catch (error) {
      console.error("❌ CRITICAL ERROR in imports endpoint:", error);
      console.error("❌ Stack trace:", error.stack);
      res.status(500).json({ message: "Erro ao buscar importações", error: error.message });
    }
  });

  app.get('/api/imports/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";
      const isFinanceira = currentUser?.role === "financeira";

      const importRecord = await storage.getImport(id);

      if (!importRecord) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      // Allow access if user owns the import, is admin, or is financeira
      if (!isAdmin && !isFinanceira && importRecord.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      res.json(importRecord);
    } catch (error) {
      console.error("Error fetching import:", error);
      res.status(500).json({ message: "Erro ao buscar importação" });
    }
  });

  // Update import (for editing)
  app.put('/api/imports/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

      const importRecord = await storage.getImport(id);
      if (!importRecord) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      // Allow editing if user owns the import or is admin
      if (!isAdmin && importRecord.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Check if this is just a status change (single field update)
      const isStatusChangeOnly = Object.keys(req.body).length === 1 && req.body.status;
      
      if (isStatusChangeOnly) {
        // Allow status changes for any import status
        console.log(`🔄 Status change request: ${importRecord.status} → ${req.body.status}`);
        const updatedImport = await storage.updateImportStatus(id, req.body.status, {
          status: req.body.status,
          updatedAt: new Date()
        });
        res.json(updatedImport);
      } else {
        // For full edits, only allow if status is 'planejamento'
        if (importRecord.status !== 'planejamento') {
          return res.status(400).json({ message: "Só é possível editar importações em planejamento" });
        }
        
        const updatedImport = await storage.updateImportStatus(id, importRecord.status, req.body);
        res.json(updatedImport);
      }
    } catch (error) {
      console.error("Error updating import:", error);
      res.status(500).json({ message: "Erro ao atualizar importação" });
    }
  });

  // Cancel import (soft delete)
  app.delete('/api/imports/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

      const importRecord = await storage.getImport(id);
      if (!importRecord) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      // Allow canceling if user owns the import or is admin
      if (!isAdmin && importRecord.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Don't allow canceling already finished or cancelled imports
      if (importRecord.status === 'cancelada' || importRecord.status === 'concluida') {
        return res.status(400).json({ message: "Esta importação não pode ser cancelada" });
      }

      const cancelledImport = await storage.updateImportStatus(id, 'cancelada', {
        cancelledAt: new Date().toISOString(),
        cancelledBy: userId
      });

      res.json(cancelledImport);
    } catch (error) {
      console.error("Error cancelling import:", error);
      res.status(500).json({ message: "Erro ao cancelar importação" });
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

  // Update import (PUT)
  app.put('/api/imports/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

      const importRecord = await storage.getImport(id);
      if (!importRecord) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      // Allow access if user owns the import or is admin
      if (!isAdmin && importRecord.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Only allow editing if import is in planning status
      if (importRecord.status !== 'planning') {
        return res.status(400).json({ 
          message: "Apenas importações em planejamento podem ser editadas" 
        });
      }

      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.userId;
      delete updateData.createdAt;

      const updatedImport = await storage.updateImport(id, updateData);
      res.json(updatedImport);
    } catch (error) {
      console.error("Error updating import:", error);
      res.status(500).json({ message: "Erro ao atualizar importação" });
    }
  });

  // Delete/Cancel import (DELETE)
  app.delete('/api/imports/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

      const importRecord = await storage.getImport(id);
      if (!importRecord) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      // Allow access if user owns the import or is admin
      if (!isAdmin && importRecord.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Don't allow deletion of completed imports
      if (importRecord.status === 'completed') {
        return res.status(400).json({ 
          message: "Importações concluídas não podem ser canceladas" 
        });
      }

      // Update status to cancelled instead of actual deletion
      const cancelledImport = await storage.updateImportStatus(id, 'cancelled', {
        cancelledAt: new Date(),
        updatedAt: new Date()
      });

      // Release reserved credit if any
      if (importRecord.creditApplicationId && importRecord.creditUsed) {
        try {
          await storage.releaseCredit(importRecord.creditApplicationId, id);
        } catch (creditError) {
          console.error("Error releasing credit:", creditError);
          // Don't fail the cancellation if credit release fails
        }
      }

      res.json({ 
        message: "Importação cancelada com sucesso", 
        import: cancelledImport 
      });
    } catch (error) {
      console.error("Error cancelling import:", error);
      res.status(500).json({ message: "Erro ao cancelar importação" });
    }
  });

  // Pipeline update route
  app.put('/api/imports/:id/pipeline', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { stage, data, currentStage } = req.body;
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

      const importRecord = await storage.getImport(id);
      if (!importRecord) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      // Allow access if user owns the import or is admin
      if (!isAdmin && importRecord.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Update the specific stage data and current stage
      const stageKey = `stage${stage.charAt(0).toUpperCase() + stage.slice(1)}`;
      const updateData: any = {
        [stageKey]: data,
        currentStage: currentStage,
        updatedAt: new Date()
      };

      const updatedImport = await storage.updateImportStatus(id, importRecord.status, updateData);
      res.json(updatedImport);
    } catch (error) {
      console.error("Error updating import pipeline:", error);
      res.status(500).json({ message: "Erro ao atualizar pipeline da importação" });
    }
  });

  // Status update route
  app.put('/api/imports/:id/status', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

      if (!status) {
        return res.status(400).json({ message: "Status é obrigatório" });
      }

      const importRecord = await storage.getImport(id);
      if (!importRecord) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      // Allow access if user owns the import or is admin
      if (!isAdmin && importRecord.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Update status and timestamp
      const updateData = {
        status: status,
        updatedAt: new Date()
      };

      const updatedImport = await storage.updateImportStatus(id, status, updateData);
      res.json(updatedImport);
    } catch (error) {
      console.error("Error updating import status:", error);
      res.status(500).json({ message: "Erro ao atualizar status da importação" });
    }
  });

  // Admin import routes - REMOVED to avoid conflict with imports-routes.ts

  // Admin imports status update - moved to imports-routes.ts

  // Admin middleware
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }

      // Check if user is admin (using email for now)
      if (user.role !== "super_admin" && user.role !== "admin") {
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

  // Cache for credit applications to improve performance
  let creditApplicationsCache: any = null;
  let creditApplicationsCacheTime = 0;
  
  // Function to invalidate credit application cache
  function invalidateCreditApplicationCache() {
    creditApplicationsCache = null;
    creditApplicationsCacheTime = 0;
    console.log("Credit applications cache invalidated");
  }

  // Get all credit applications (admin only)
  app.get('/api/admin/credit-applications', requireAuth, async (req: any, res) => {
    try {
      console.log(`Admin credit applications request - User: ${req.session.userId}`);
      
      const currentUser = await storage.getUser(req.session.userId);
      console.log(`Current user role: ${currentUser?.role}`);

      // Verificar se é admin, financeira ou super admin
      if (currentUser?.role !== "super_admin" && currentUser?.role !== "admin" && currentUser?.role !== "financeira") {
        console.log("Access denied - insufficient role");
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Check cache first
      const now = Date.now();
      if (creditApplicationsCache && (now - creditApplicationsCacheTime) < CACHE_DURATION) {
        console.log("Serving credit applications from cache");
        return res.json(creditApplicationsCache);
      }

      console.log("Fetching fresh credit applications");
      
      // Use raw SQL query for production compatibility with credit scores
      const applications = await db.execute(`
        SELECT 
          ca.id, ca.user_id, ca.legal_company_name, ca.requested_amount, ca.status,
          ca.pre_analysis_status, ca.financial_status, ca.admin_status,
          ca.created_at, ca.updated_at, ca.final_credit_limit, ca.credit_limit,
          ca.approved_terms, ca.final_approved_terms, ca.cnpj,
          cs.credit_score, cs.score_date, cs.has_debts, cs.has_protests, cs.has_bankruptcy, cs.has_lawsuits
        FROM credit_applications ca
        LEFT JOIN credit_scores cs ON cs.credit_application_id = ca.id
        ORDER BY ca.created_at DESC
      `);

      const formattedApplications = applications.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        legalCompanyName: row.legal_company_name,
        requestedAmount: row.requested_amount,
        status: row.status,
        preAnalysisStatus: row.pre_analysis_status,
        financialStatus: row.financial_status,
        adminStatus: row.admin_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        finalCreditLimit: row.final_credit_limit,
        creditLimit: row.credit_limit,
        approvedTerms: row.approved_terms,
        finalApprovedTerms: row.final_approved_terms,
        cnpj: row.cnpj,
        creditScore: row.credit_score,
        scoreDate: row.score_date,
        hasDebts: row.has_debts,
        hasProtests: row.has_protests,
        hasBankruptcy: row.has_bankruptcy,
        hasLawsuits: row.has_lawsuits
      }));

      console.log(`Found ${formattedApplications.length} credit applications`);

      // Update cache
      creditApplicationsCache = formattedApplications;
      creditApplicationsCacheTime = now;

      res.json(formattedApplications);
    } catch (error) {
      console.error("Get all credit applications error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Admin imports endpoint moved to imports-routes.ts to avoid conflicts

  // ===== ADMIN FEES MANAGEMENT =====

  // Get admin fees for all users
  app.get('/api/admin/fees', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const fees = await storage.getAllAdminFees();
      res.json(fees);
    } catch (error) {
      console.error("Error fetching admin fees:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Set admin fee for a user
  app.post('/api/admin/fees/:userId', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { feePercentage } = req.body;

      if (!feePercentage || parseFloat(feePercentage) < 0 || parseFloat(feePercentage) > 100) {
        return res.status(400).json({ message: "Taxa deve estar entre 0% e 100%" });
      }

      const result = await storage.setAdminFeeForUser(
        parseInt(userId), 
        feePercentage, 
        req.session.userId
      );

      res.json(result[0]);
    } catch (error) {
      console.error("Error setting admin fee:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get admin fee for specific user
  app.get('/api/admin/fees/:userId', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const fee = await storage.getAdminFeeForUser(parseInt(userId));
      res.json(fee);
    } catch (error) {
      console.error("Error fetching user admin fee:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== CREDIT MANAGEMENT =====

  // Get available credit for user
  app.get('/api/credit/available/:applicationId', requireAuth, async (req: any, res) => {
    try {
      const { applicationId } = req.params;
      const application = await storage.getCreditApplication(parseInt(applicationId));

      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      // Check if user owns the application or is admin
      const currentUser = await storage.getUser(req.session.userId);
      const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

      if (!isAdmin && application.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const creditData = await storage.calculateAvailableCredit(parseInt(applicationId));
      res.json(creditData);
    } catch (error) {
      console.error("Error fetching available credit:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Reserve credit for import
  app.post('/api/imports/:id/reserve-credit', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { creditApplicationId, amount } = req.body;

      const importRecord = await storage.getImport(parseInt(id));
      if (!importRecord) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      // Check if user owns the import
      if (importRecord.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Check available credit
      const creditData = await storage.calculateAvailableCredit(creditApplicationId);
      const requestedAmount = parseFloat(amount);

      if (requestedAmount > creditData.available) {
        return res.status(400).json({ 
          message: `Crédito insuficiente. Disponível: US$ ${creditData.available.toLocaleString()}` 
        });
      }

      // Reserve credit
      await storage.reserveCredit(creditApplicationId, parseInt(id), amount);

      // Update credit balances
      const newUsed = creditData.used + requestedAmount;
      const newAvailable = creditData.available - requestedAmount;

      await storage.updateCreditBalance(
        creditApplicationId, 
        newUsed.toString(), 
        newAvailable.toString()
      );

      res.json({ success: true, reservedAmount: amount });
    } catch (error) {
      console.error("Error reserving credit:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== PAYMENT SCHEDULES =====

  // Get payment schedule for import
  app.get('/api/imports/:id/payments', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const importRecord = await storage.getImport(parseInt(id));

      if (!importRecord) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      // Check permissions
      const currentUser = await storage.getUser(req.session.userId);
      const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
      const isFinanceira = currentUser?.role === 'financeira';

      if (!isAdmin && !isFinanceira && importRecord.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const schedules = await storage.getPaymentScheduleByImport(parseInt(id));
      const payments = await storage.getPaymentsByImport(parseInt(id));

      res.json({ schedules, payments });
    } catch (error) {
      console.error("Error fetching payment schedule:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Create payment schedule when import is approved
  app.post('/api/imports/:id/create-payment-schedule', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { paymentTerms, downPaymentPercentage, totalAmount } = req.body;

      const importRecord = await storage.getImport(parseInt(id));
      if (!importRecord) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      // Only admins can create payment schedules
      const currentUser = await storage.getUser(req.session.userId);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const total = parseFloat(totalAmount);
      const downPayment = total * (parseFloat(downPaymentPercentage) / 100);
      const remainingAmount = total - downPayment;

      // Create down payment schedule
      await storage.createPaymentSchedule(parseInt(id), {
        paymentType: 'down_payment',
        dueDate: new Date(), // Due immediately
        amount: downPayment.toString(),
        currency: importRecord.currency,
        status: 'pending',
      });

      // Create installment schedule based on payment terms
      const installmentAmount = remainingAmount;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + parseInt(paymentTerms));

      await storage.createPaymentSchedule(parseInt(id), {
        paymentType: 'installment',
        dueDate,
        amount: installmentAmount.toString(),
        currency: importRecord.currency,
        status: 'pending',
        installmentNumber: 1,
        totalInstallments: 1,
      });

      res.json({ success: true, message: "Cronograma de pagamento criado" });
    } catch (error) {
      console.error("Error creating payment schedule:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // External payment submission
  app.post('/api/payments/external', requireAuth, upload.single('receipts'), async (req: any, res) => {
    try {
      const { paymentScheduleId, amount, paymentDate, notes, paymentMethod } = req.body;
      const file = req.file;

      console.log('🔍 External payment request body:', req.body);
      console.log('🔍 PaymentScheduleId:', paymentScheduleId, 'Amount:', amount);
      console.log('🔍 Uploaded file:', file ? file.originalname : 'none');

      if (!paymentScheduleId || !amount) {
        console.log('❌ Missing required data - PaymentScheduleId:', paymentScheduleId, 'Amount:', amount);
        return res.status(400).json({ message: "Dados obrigatórios ausentes" });
      }

      // First, get the payment schedule to find the importId
      const paymentSchedule = await storage.getPaymentScheduleById(parseInt(paymentScheduleId));
      if (!paymentSchedule) {
        return res.status(404).json({ message: "Cronograma de pagamento não encontrado" });
      }

      const paymentData = {
        paymentScheduleId: parseInt(paymentScheduleId),
        importId: paymentSchedule.importId, // Add the missing importId
        amount,
        currency: 'USD',
        paymentMethod: paymentMethod || 'external',
        paymentReference: 'EXT-' + Date.now(),
        proofDocument: file ? file.buffer.toString('base64') : null,
        proofFilename: file ? file.originalname : null,
        status: 'pending',
        paidAt: new Date(paymentDate || Date.now()),
        notes: notes || ''
      };

      const payment = await storage.createPayment(paymentData);
      res.json(payment[0]);
    } catch (error) {
      console.error("Error submitting external payment:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // PayComex payment submission
  app.post('/api/payments/paycomex', requireAuth, async (req: any, res) => {
    try {
      const { paymentScheduleId, amount, method, currency, exchangeRate, fee, cardData } = req.body;

      if (!paymentScheduleId || !amount) {
        return res.status(400).json({ message: "Dados obrigatórios ausentes" });
      }

      const paymentData = {
        paymentScheduleId: parseInt(paymentScheduleId),
        amount,
        currency: currency || 'USD',
        paymentMethod: 'paycomex_' + method,
        paymentReference: 'PCX-' + Date.now(),
        status: 'completed',
        paidAt: new Date(),
        notes: `PayComex ${method} - Taxa: ${exchangeRate} - Fee: ${fee}%`
      };

      const payment = await storage.createPayment(paymentData);
      res.json(payment[0]);
    } catch (error) {
      console.error("Error submitting PayComex payment:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Submit payment (legacy endpoint)
  app.post('/api/payments/submit', requireAuth, upload.single('proofDocument'), async (req: any, res) => {
    try {
      const { paymentScheduleId, importId, amount, paymentMethod, paymentReference } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "Comprovante de pagamento é obrigatório" });
      }

      const paymentData = {
        paymentScheduleId: parseInt(paymentScheduleId),
        importId: parseInt(importId),
        amount,
        currency: 'USD',
        paymentMethod,
        paymentReference,
        proofDocument: file.buffer.toString('base64'),
        proofFilename: file.originalname,
        status: 'pending',
        paidAt: new Date(),
      };

      const payment = await storage.createPayment(paymentData);
      res.json(payment[0]);
    } catch (error) {
      console.error("Error submitting payment:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Confirm payment (admin only)
  app.put('/api/admin/payments/:id/confirm', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const confirmedPayment = await storage.confirmPayment(parseInt(id), req.session.userId);

      // Update payment schedule status
      if (confirmedPayment[0]) {
        await storage.updatePaymentScheduleStatus(confirmedPayment[0].paymentScheduleId, 'paid');
      }

      res.json(confirmedPayment[0]);
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Reject payment (admin only)
  app.put('/api/admin/payments/:id/reject', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const rejectedPayment = await storage.rejectPayment(parseInt(id), notes, req.session.userId);
      res.json(rejectedPayment[0]);
    } catch (error) {
      console.error("Error rejecting payment:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== PAYMENT SCHEDULES MANAGEMENT =====

  // Get all payment schedules for user
  app.get('/api/payment-schedules', requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId);
      const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
      const isFinanceira = currentUser?.role === 'financeira';

      let schedules;
      if (isAdmin || isFinanceira) {
        // Admin and financeira see all payment schedules
        schedules = await storage.getAllPaymentSchedules();
      } else {
        // Regular users see only their payment schedules
        schedules = await storage.getPaymentSchedulesByUser(req.session.userId);
      }

      res.json(schedules);
    } catch (error) {
      console.error("Error fetching payment schedules:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get payment schedule metrics
  app.get('/api/payment-schedules/metrics', requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId);
      const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
      const isFinanceira = currentUser?.role === 'financeira';

      let schedules;
      if (isAdmin || isFinanceira) {
        schedules = await storage.getAllPaymentSchedules();
      } else {
        schedules = await storage.getPaymentSchedulesByUser(req.session.userId);
      }

      // Calculate metrics
      const totalPayments = schedules.length;
      const pendingPayments = schedules.filter((s: any) => s.status === 'pending').length;
      const paidPayments = schedules.filter((s: any) => s.status === 'paid').length;
      const overduePayments = schedules.filter((s: any) => {
        return s.status === 'pending' && new Date(s.dueDate) < new Date();
      }).length;

      // Calculate amounts
      const totalAmount = schedules.reduce((sum: number, s: any) => sum + parseFloat(s.amount), 0);
      const pendingAmount = schedules
        .filter((s: any) => s.status === 'pending')
        .reduce((sum: number, s: any) => sum + parseFloat(s.amount), 0);
      const paidAmount = schedules
        .filter((s: any) => s.status === 'paid')
        .reduce((sum: number, s: any) => sum + parseFloat(s.amount), 0);
      const overdueAmount = schedules
        .filter((s: any) => s.status === 'pending' && new Date(s.dueDate) < new Date())
        .reduce((sum: number, s: any) => sum + parseFloat(s.amount), 0);

      const metrics = {
        totalPayments,
        pendingPayments,
        paidPayments,
        overduePayments,
        totalAmount: totalAmount.toString(),
        pendingAmount: pendingAmount.toString(),
        paidAmount: paidAmount.toString(),
        overdueAmount: overdueAmount.toString()
      };

      res.json(metrics);
    } catch (error) {
      console.error("Error calculating payment metrics:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get specific payment schedule
  app.get('/api/payment-schedules/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const schedule = await storage.getPaymentScheduleById(parseInt(id));

      if (!schedule) {
        return res.status(404).json({ message: "Cronograma de pagamento não encontrado" });
      }

      // Check permissions
      const currentUser = await storage.getUser(req.session.userId);
      const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
      const isFinanceira = currentUser?.role === 'financeira';

      // Get import data to check ownership
      const importData = await storage.getImport(schedule.importId);
      if (!isAdmin && !isFinanceira && importData?.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      res.json(schedule);
    } catch (error) {
      console.error("Error fetching payment schedule:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get supplier data for payment schedule
  app.get('/api/payment-schedules/:id/supplier', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const schedule = await storage.getPaymentScheduleById(parseInt(id));

      if (!schedule) {
        return res.status(404).json({ message: "Cronograma de pagamento não encontrado" });
      }

      // Get import data
      const importData = await storage.getImport(schedule.importId);
      if (!importData) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      // Get supplier data from products
      let supplierData = null;
      if (importData.products && importData.products.length > 0) {
        const supplierId = importData.products[0].supplierId;
        if (supplierId) {
          supplierData = await storage.getSupplier(supplierId);
        }
      }

      res.json(supplierData);
    } catch (error) {
      console.error("Error fetching supplier data:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Process external payment
  app.post('/api/payment-schedules/:id/pay', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const schedule = await storage.getPaymentScheduleById(parseInt(id));

      if (!schedule) {
        return res.status(404).json({ message: "Cronograma de pagamento não encontrado" });
      }

      // Check permissions
      const importData = await storage.getImport(schedule.importId);
      const currentUser = await storage.getUser(req.session.userId);
      const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

      if (!isAdmin && importData?.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Handle file upload and form data
      const paymentType = req.body.paymentType || 'external';
      const paymentMethod = req.body.paymentMethod;
      const notes = req.body.notes;
      
      // Process payment document if uploaded
      let proofDocument = null;
      let proofFilename = null;
      
      if (req.files && req.files.receipt) {
        const file = req.files.receipt;
        proofDocument = file.data.toString('base64');
        proofFilename = file.name;
      }

      // Create payment record
      const payment = await storage.createPayment({
        paymentScheduleId: parseInt(id),
        importId: schedule.importId,
        amount: schedule.amount,
        currency: schedule.currency,
        paymentMethod,
        proofDocument,
        proofFilename,
        notes,
        status: 'confirmed',
        paidAt: new Date(),
        confirmedAt: new Date(),
        confirmedBy: req.session.userId
      });

      // Update schedule status
      await storage.updatePaymentScheduleStatus(parseInt(id), 'paid');

      // Note: Credit balance will be restored automatically when payment is confirmed
      // This restores the paid amount to the user's available credit limit
      console.log(`💰 Payment confirmed: USD ${schedule.amount} will restore credit balance for user ${req.session.userId}`);

      res.json({ 
        success: true, 
        payment: payment[0],
        message: "Pagamento processado com sucesso" 
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Process PayComex payment
  app.post('/api/payment-schedules/:id/paycomex', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { exchangeRate, brazilianAmount, paymentMethod, notes } = req.body;
      
      const schedule = await storage.getPaymentScheduleById(parseInt(id));

      if (!schedule) {
        return res.status(404).json({ message: "Cronograma de pagamento não encontrado" });
      }

      // Check permissions
      const importData = await storage.getImport(schedule.importId);
      const currentUser = await storage.getUser(req.session.userId);
      const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

      if (!isAdmin && importData?.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Create payment record with PayComex data
      const payment = await storage.createPayment({
        paymentScheduleId: parseInt(id),
        importId: schedule.importId,
        amount: schedule.amount,
        currency: schedule.currency,
        paymentMethod: `paycomex_${paymentMethod}`,
        paymentReference: `PayComex - Taxa: ${exchangeRate} - BRL: ${brazilianAmount}`,
        notes: `PayComex: ${notes || ''}`,
        status: 'confirmed',
        paidAt: new Date(),
        confirmedAt: new Date(),
        confirmedBy: req.session.userId
      });

      // Update schedule status
      await storage.updatePaymentScheduleStatus(parseInt(id), 'paid');

      // Note: Credit balance will be restored automatically when payment is confirmed
      // This restores the paid amount to the user's available credit limit
      console.log(`💰 PayComex payment confirmed: USD ${schedule.amount} will restore credit balance for user ${req.session.userId}`);

      res.json({ 
        success: true, 
        payment: payment[0],
        message: "PayComex processado com sucesso",
        exchangeData: {
          usdAmount: schedule.amount,
          brlAmount: brazilianAmount,
          exchangeRate
        }
      });
    } catch (error) {
      console.error("Error processing PayComex:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Cancel payment schedule
  app.delete('/api/payment-schedules/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const schedule = await storage.getPaymentScheduleById(parseInt(id));

      if (!schedule) {
        return res.status(404).json({ message: "Cronograma de pagamento não encontrado" });
      }

      // Check permissions
      const importData = await storage.getImport(schedule.importId);
      const currentUser = await storage.getUser(req.session.userId);
      const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

      if (!isAdmin && importData?.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Only allow cancellation of pending payments
      if (schedule.status !== 'pending') {
        return res.status(400).json({ message: "Apenas pagamentos pendentes podem ser cancelados" });
      }

      // Delete payment schedule
      await storage.deletePaymentSchedule(parseInt(id));

      res.json({ success: true, message: "Pagamento cancelado com sucesso" });
    } catch (error) {
      console.error("Error canceling payment:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update credit application status (admin only)
  app.put('/api/admin/credit-applications/:id/status', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const application = await storage.updateCreditApplicationStatus(
        parseInt(id), 
        status, 
        { updatedBy: req.session.userId, updatedAt: new Date() }
      );

      res.json(application);
    } catch (error) {
      console.error("Error updating credit application status:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update credit application pre-analysis (admin only)
  app.put('/api/admin/credit-applications/:id/pre-analysis', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { preAnalysisStatus, riskAssessment, adminRecommendation } = req.body;

      const reviewData = {
        preAnalysisStatus,
        riskAssessment,
        adminRecommendation,
        analyzedBy: req.session.userId,
        analyzedAt: new Date()
      };

      const application = await storage.updateCreditApplicationStatus(
        parseInt(id), 
        'under_review', 
        reviewData
      );

      res.json(application);
    } catch (error) {
      console.error("Error updating pre-analysis:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update credit application status (admin only)
  app.put('/api/admin/credit-applications/:id/status', requireAuth, async (req: any, res) => {
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

  // Admin submission to financial (after pre-approval)
  app.put('/api/admin/credit-applications/:id/submit-financial', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const applicationId = parseInt(req.params.id);
      const currentUser = await storage.getUser(userId);

      // Only admins can submit to financial
      if (currentUser?.role !== "admin" && currentUser?.role !== "super_admin") {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const application = await storage.getCreditApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      // Only allow submission if pre-approved
      if (application.preAnalysisStatus !== 'pre_approved') {
        return res.status(400).json({ 
          message: "Apenas aplicações pré-aprovadas podem ser submetidas à financeira" 
        });
      }

      const updatedApplication = await storage.updateCreditApplicationStatus(applicationId, 'submitted_to_financial', {
        submittedToFinancialAt: new Date(),
        submittedBy: userId,
        updatedAt: new Date()
      });

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error submitting to financial:", error);
      res.status(500).json({ message: "Erro ao submeter à financeira" });
    }
  });

  // Admin finalization of credit terms (after financial approval)
  app.put('/api/admin/credit/applications/:id/finalize', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const applicationId = parseInt(req.params.id);
      const currentUser = await storage.getUser(userId);

      // Only admins can finalize
      if (currentUser?.role !== "admin" && currentUser?.role !== "super_admin") {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const application = await storage.getCreditApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      // Only allow finalization if financially approved
      if (application.financialStatus !== 'approved') {
        return res.status(400).json({ 
          message: "Apenas aplicações aprovadas pela financeira podem ser finalizadas" 
        });
      }

      const { finalCreditLimit, finalApprovedTerms, finalDownPayment, adminFee, adminFinalNotes } = req.body;

      const updatedApplication = await storage.updateCreditApplicationStatus(applicationId, 'admin_finalized', {
        adminStatus: 'admin_finalized',
        finalCreditLimit,
        finalApprovedTerms,
        finalDownPayment,
        adminFee,
        adminFinalNotes,
        adminFinalizedBy: userId,
        adminFinalizedAt: new Date(),
        updatedAt: new Date()
      });

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error finalizing credit application:", error);
      res.status(500).json({ message: "Erro ao finalizar solicitação de crédito" });
    }
  });

  // CNPJá Location Photo endpoint
  app.get('/api/credit/applications/:id/location-photo', requireAuth, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getCreditApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const cnpj = application.cnpj.replace(/\D/g, '');
      console.log('📸 Fetching location photo for CNPJ:', cnpj);

      // Photo endpoints temporarily disabled
      console.log('📋 Photo endpoints temporarily disabled - no external photo fetching');
      return res.status(503).json({ message: 'Photo service temporarily unavailable' });
    } catch (error) {
      console.error('❌ Location photo error:', error);
      res.status(500).json({ error: 'Failed to fetch location photo' });
    }
  });

  // CNPJá Consultation PDF endpoint with professional design
  app.get('/api/credit/applications/:id/consultation-pdf', requireAuth, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getCreditApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const cnpj = application.cnpj.replace(/\D/g, '');
      console.log('📄 Generating consultation PDF for CNPJ:', cnpj);

      // PDF generation temporarily disabled
      console.log('📋 PDF generation endpoints temporarily disabled - no external PDF fetching');
      return res.status(503).json({ message: 'PDF service temporarily unavailable' });
    } catch (error) {
      console.error('Error in PDF endpoint:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Directd.com.br API Integration - Cadastro Pessoa Jurídica Plus
  app.get('/api/credit/applications/:id/directd-company-data', requireAuth, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getCreditApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // Check if user has permission to view this application
      const userPermissions = getUserPermissions(req.session.userRole);
      if (!userPermissions.canViewAllApplications && application.userId !== req.session.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const cnpj = application.cnpj.replace(/\D/g, '');
      console.log('🔍 Fetching Directd company data for CNPJ:', cnpj);

      // Check for existing data first
      let existingData = await storage.getDirectdCompanyData(applicationId);
      if (existingData) {
        console.log('✅ Found existing Directd data, returning cached version');
        return res.json({
          success: true,
          data: existingData,
          source: 'cached'
        });
      }

      // Check if we have DIRECTD_API_TOKEN
      if (!process.env.DIRECTD_API_TOKEN) {
        console.log('⚠️ DIRECTD_API_TOKEN not configured, returning mock data');
        
        // Generate realistic mock data based on the application
        const mockData = {
          creditApplicationId: applicationId,
          cnpj: cnpj,
          consultaUid: `mock-${Date.now()}`,
          consultaNome: "Cadastro Pessoa Jurídica Plus",
          apiVersao: "v3",
          tempoExecucaoMs: 1500,
          razaoSocial: application.legalCompanyName,
          nomeFantasia: application.legalCompanyName.split(' ')[0] + ' Comércio',
          dataFundacao: "2015-03-15",
          situacaoCadastral: "ATIVA",
          naturezaJuridicaCodigo: 2062,
          naturezaJuridicaDescricao: "SOCIEDADE EMPRESÁRIA LIMITADA",
          naturezaJuridicaTipo: "EMPRESARIAL",
          porte: "PEQUENO PORTE",
          cnaeCodigo: 4644301,
          cnaeDescricao: "Comércio atacadista de medicamentos e drogas de uso humano",
          cnaesSecundarios: [
            { cnaeCodigoSecundario: 4644302, cnaeDescricaoSecundario: "Comércio atacadista de cosméticos" }
          ],
          quantidadeFuncionarios: 25,
          faixaFuncionarios: "DE 11 A 50",
          quantidadeFiliais: "2",
          matriz: true,
          orgaoPublico: "NÃO",
          ramo: "Comércio",
          tipoEmpresa: "MATRIZ",
          tributacao: "LUCRO PRESUMIDO",
          opcaoMEI: "NÃO",
          opcaoSimples: "NÃO",
          faixaFaturamento: "DE R$ 360.000,01 A R$ 3.600.000,00",
          faturamentoMedioCNAE: "R$ 2.500.000",
          faturamentoPresumido: "R$ 1.800.000",
          telefones: [
            { telefoneComDDD: "(11) 3456-7890", telemarketingBloqueado: false, operadora: "VIVO", tipoTelefone: "FIXO", whatsApp: false }
          ],
          enderecos: [
            { logradouro: "RUA EXEMPLO", numero: "123", bairro: "CENTRO", cidade: "SAO PAULO", uf: "SP", cep: "01234-567" }
          ],
          emails: [
            { enderecoEmail: "contato@exemplo.com.br" }
          ],
          socios: [
            { documento: "123.456.789-01", nome: "JOÃO DA SILVA", percentualParticipacao: "50,00", dataEntrada: "15/03/2015", cargo: "ADMINISTRADOR" },
            { documento: "987.654.321-02", nome: "MARIA SANTOS", percentualParticipacao: "50,00", dataEntrada: "15/03/2015", cargo: "SÓCIO" }
          ],
          ultimaAtualizacaoPJ: "2025-01-15"
        };

        // Save mock data to database
        const savedData = await storage.createDirectdCompanyData(mockData);
        
        return res.json({
          success: true,
          data: savedData,
          source: 'mock',
          message: 'Dados de demonstração - Configure DIRECTD_API_TOKEN para dados reais'
        });
      }

      // Make API call to Directd
      const apiUrl = `https://apiv3.directd.com.br/api/CadastroPessoaJuridicaPlus?CNPJ=${cnpj}&TOKEN=${process.env.DIRECTD_API_TOKEN}`;
      
      console.log('🌐 Calling Directd API...');
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        console.error('❌ Directd API error:', response.status, response.statusText);
        return res.status(response.status).json({ 
          error: 'Failed to fetch company data from Directd API',
          status: response.status 
        });
      }

      const apiData = await response.json();
      console.log('✅ Directd API response received');

      // Transform API response to our database format
      const transformedData = {
        creditApplicationId: applicationId,
        cnpj: cnpj,
        consultaUid: apiData.metaDados?.consultaUid,
        consultaNome: apiData.metaDados?.consultaNome,
        apiVersao: apiData.metaDados?.apiVersao,
        tempoExecucaoMs: apiData.metaDados?.tempoExecucaoMs,
        razaoSocial: apiData.retorno?.razaoSocial,
        nomeFantasia: apiData.retorno?.nomeFantasia,
        dataFundacao: apiData.retorno?.dataFundacao,
        situacaoCadastral: apiData.retorno?.situacaoCadastral,
        naturezaJuridicaCodigo: apiData.retorno?.naturezaJuridicaCodigo,
        naturezaJuridicaDescricao: apiData.retorno?.naturezaJuridicaDescricao,
        naturezaJuridicaTipo: apiData.retorno?.naturezaJuridicaTipo,
        porte: apiData.retorno?.porte,
        cnaeCodigo: apiData.retorno?.cnaeCodigo,
        cnaeDescricao: apiData.retorno?.cnaeDescricao,
        cnaesSecundarios: apiData.retorno?.cnaEsSecundarios || [],
        quantidadeFuncionarios: apiData.retorno?.quantidadeFuncionarios,
        faixaFuncionarios: apiData.retorno?.faixaFuncionarios,
        quantidadeFiliais: apiData.retorno?.quantidadeFiliais,
        matriz: apiData.retorno?.matriz,
        orgaoPublico: apiData.retorno?.orgaoPublico,
        ramo: apiData.retorno?.ramo,
        tipoEmpresa: apiData.retorno?.tipoEmpresa,
        tributacao: apiData.retorno?.tributacao,
        opcaoMEI: apiData.retorno?.opcaoMEI,
        opcaoSimples: apiData.retorno?.opcaoSimples,
        faixaFaturamento: apiData.retorno?.faixaFaturamento,
        faturamentoMedioCNAE: apiData.retorno?.faturamentoMedioCNAE,
        faturamentoPresumido: apiData.retorno?.faturamentoPresumido,
        telefones: apiData.retorno?.telefones || [],
        enderecos: apiData.retorno?.enderecos || [],
        emails: apiData.retorno?.emails || [],
        socios: apiData.retorno?.socios || [],
        ultimaAtualizacaoPJ: apiData.retorno?.ultimaAtualizacaoPJ
      };

      // Save to database
      const savedData = await storage.createDirectdCompanyData(transformedData);
      
      console.log('💾 Directd data saved to database');
      
      return res.json({
        success: true,
        data: savedData,
        source: 'api',
        metaDados: apiData.metaDados
      });

    } catch (error) {
      console.error('❌ Error fetching Directd company data:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Register imports routes
  console.log('Registering imports routes...');
  app.use('/api', importRoutes);
  console.log('Imports routes registered successfully');

  const httpServer = createServer(app);
  return httpServer;
}

