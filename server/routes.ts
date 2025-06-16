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
    saveUninitialized: false,
    cookie: {
      httpOnly: false, // Allow JavaScript access for debugging
      secure: false, // HTTP for development
      maxAge: sessionTtl,
      sameSite: 'lax',
      path: '/',
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
      
      // Save session explicitly
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Erro ao salvar sessão" });
        }
        console.log("Session saved successfully");
        
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
      
      // Get current user to check permissions
      const currentUser = await storage.getUser(req.session.userId);
      
      // Allow access if:
      // 1. User owns the application
      // 2. User is admin or super admin
      const isOwner = application.userId === req.session.userId;
      const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'pavaosmart@gmail.com';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      res.json(application);
    } catch (error) {
      console.error("Error fetching credit application:", error);
      res.status(500).json({ message: "Erro ao buscar solicitação de crédito" });
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
      
      // Only allow editing of pending applications
      if (application.status !== 'pending') {
        return res.status(400).json({ 
          message: "Apenas solicitações pendentes podem ser editadas" 
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
      if (currentUser?.role !== "admin" && currentUser?.email !== "pavaosmart@gmail.com") {
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
          approvedBy: userId,
          approvedAt: new Date(),
          approvalReason: req.body.reason || 'Pré-aprovado pela administração'
        }
      );
      
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
      if (currentUser?.role !== "admin" && currentUser?.email !== "pavaosmart@gmail.com") {
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
      if (currentUser?.role !== "admin" && currentUser?.email !== "pavaosmart@gmail.com") {
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
      
      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating analysis:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Import routes
  app.post('/api/imports', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = { ...req.body, userId };
      
      // Clean and convert data to match the new schema
      const cleanedData: any = {
        userId,
        importName: data.importName,
        cargoType: data.cargoType || "FCL",
        containerNumber: data.containerNumber || null,
        sealNumber: data.sealNumber || null,
        products: data.products || [],
        totalValue: data.totalValue,
        currency: data.currency || "USD",
        incoterms: data.incoterms,
        shippingMethod: data.shippingMethod,
        containerType: data.containerType || null,
        estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
        status: "planning",
        currentStage: "estimativa"
      };
      
      const importRecord = await storage.createImport(cleanedData);
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
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      const isAdmin = currentUser?.email === "pavaosmart@gmail.com" || currentUser?.role === "admin";
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
      const isAdmin = currentUser?.email === "pavaosmart@gmail.com" || currentUser?.role === "admin";
      
      const importRecord = await storage.getImport(id);
      if (!importRecord) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }
      
      // Allow editing if user owns the import or is admin
      if (!isAdmin && importRecord.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Only allow editing if status is 'planejamento'
      if (importRecord.status !== 'planejamento') {
        return res.status(400).json({ message: "Só é possível editar importações em planejamento" });
      }
      
      const updatedImport = await storage.updateImportStatus(id, importRecord.status, req.body);
      res.json(updatedImport);
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
      const isAdmin = currentUser?.email === "pavaosmart@gmail.com" || currentUser?.role === "admin";
      
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

  // Pipeline update route
  app.put('/api/imports/:id/pipeline', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { stage, data, currentStage } = req.body;
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      const isAdmin = currentUser?.email === "pavaosmart@gmail.com" || currentUser?.role === "admin";
      
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
      const updateData = {
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

  // Admin import routes
  app.get('/api/admin/imports', requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId);
      
      // Verificar se é admin ou super admin
      if (currentUser?.email !== "pavaosmart@gmail.com" && currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const imports = await storage.getAllImports();
      res.json(imports);
    } catch (error) {
      console.error("Error fetching all imports:", error);
      res.status(500).json({ message: "Erro ao buscar importações" });
    }
  });

  app.patch('/api/admin/imports/:id/status', requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId);
      
      // Verificar se é admin ou super admin
      if (currentUser?.email !== "pavaosmart@gmail.com" && currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const id = parseInt(req.params.id);
      const { status, ...updateData } = req.body;
      
      const updatedImport = await storage.updateImportStatus(id, status, {
        ...updateData,
        updatedBy: req.session.userId,
        updatedAt: new Date()
      });
      
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
  app.put('/api/admin/credit-applications/:id/pre-analysis', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { preAnalysisStatus, riskAssessment, adminRecommendation } = req.body;
      
      const reviewData = {
        preAnalysisStatus,
        riskAssessment,
        adminRecommendation,
        analyzedBy: req.session.userId,
        analyzedAt: new Date().toISOString()
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



  // Supplier routes
  app.post('/api/suppliers', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const supplierData = { 
        ...req.body, 
        userId,
        contactPerson: req.body.contactName, // Map contactName to contactPerson for database
        contactName: req.body.contactName
      };
      
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Erro ao criar fornecedor" });
    }
  });

  app.get('/api/suppliers', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const suppliers = await storage.getSuppliersByUser(userId);
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Erro ao buscar fornecedores" });
    }
  });

  app.get('/api/suppliers/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      const isAdmin = currentUser?.email === "pavaosmart@gmail.com" || currentUser?.role === "admin";
      const isFinanceira = currentUser?.role === "financeira";
      
      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Fornecedor não encontrado" });
      }
      
      // Allow access if user owns the supplier, is admin, or is financeira
      if (!isAdmin && !isFinanceira && supplier.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      res.json(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ message: "Erro ao buscar fornecedor" });
    }
  });

  app.put('/api/suppliers/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Fornecedor não encontrado" });
      }
      
      if (supplier.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const updatedSupplier = await storage.updateSupplier(id, req.body);
      res.json(updatedSupplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Erro ao atualizar fornecedor" });
    }
  });

  app.delete('/api/suppliers/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Fornecedor não encontrado" });
      }
      
      if (supplier.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      await storage.deleteSupplier(id);
      res.json({ message: "Fornecedor removido com sucesso" });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Erro ao remover fornecedor" });
    }
  });

  // Administrative suppliers endpoint
  app.get("/api/admin/suppliers", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      
      // Only admins can access all suppliers
      if (currentUser?.role !== "admin" && currentUser?.email !== "pavaosmart@gmail.com") {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }
      
      const allSuppliers = await storage.getAllSuppliers();
      res.json(allSuppliers);
    } catch (error) {
      console.error("Error fetching all suppliers:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/suppliers/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      
      // Only admins can access supplier details
      if (currentUser?.role !== "admin" && currentUser?.email !== "pavaosmart@gmail.com") {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }
      
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Fornecedor não encontrado" });
      }
      
      res.json(supplier);
    } catch (error) {
      console.error("Error fetching supplier details:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes do fornecedor" });
    }
  });

  // Admin routes for credit analysis
  app.get("/api/admin/credit-applications/:id", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getCreditApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      res.json(application);
    } catch (error) {
      console.error("Error fetching admin credit application:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/admin/credit-applications/:id/analysis", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { adminNotes, preAnalysisStatus, adminRecommendation, riskAssessment } = req.body;

      // Update the application with admin analysis data
      const analysisData = {
        adminNotes,
        preAnalysisStatus, 
        adminRecommendation,
        riskAssessment,
        analyzedBy: req.session.userId,
        analyzedAt: new Date().toISOString()
      };

      const updatedApplication = await storage.updateCreditApplication(applicationId, { reviewNotes: JSON.stringify(analysisData) });

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating credit analysis:", error);
      res.status(500).json({ message: "Erro ao salvar análise" });
    }
  });

  app.post("/api/admin/credit-applications/:id/submit-financial", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      
      const updatedApplication = await storage.updateCreditApplicationStatus(applicationId, 'submitted_to_financial', {
        submittedBy: req.session.userId,
        submittedAt: new Date().toISOString()
      });

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error submitting to financial:", error);
      res.status(500).json({ message: "Erro ao enviar para financeira" });
    }
  });

  // ===== FINANCEIRA ROUTES =====
  
  // Middleware para verificar role financeira
  const requireFinanceira = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    
    storage.getUser(req.session.userId).then(user => {
      if (user?.role !== "financeira") {
        return res.status(403).json({ message: "Acesso negado - apenas financeira" });
      }
      next();
    }).catch(error => {
      console.error("Error checking financeira role:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    });
  };

  // Get pre-approved credit applications for financeira
  app.get('/api/financeira/credit-applications', requireAuth, requireFinanceira, async (req: any, res) => {
    try {
      const applications = await storage.getPreApprovedCreditApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching pre-approved applications:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update financial status of credit application
  app.put('/api/financeira/credit-applications/:id/financial-status', requireAuth, requireFinanceira, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, creditLimit, approvedTerms, financialNotes } = req.body;
      
      if (!['approved_financial', 'rejected_financial', 'needs_documents_financial'].includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }

      const financialData = {
        creditLimit,
        approvedTerms,
        financialNotes,
        financialAnalyzedBy: req.session.userId
      };

      const updatedApplication = await storage.updateFinancialStatus(
        parseInt(id), 
        status, 
        financialData
      );
      
      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating financial status:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get suppliers from pre-approved users for financeira
  app.get('/api/financeira/suppliers', requireAuth, requireFinanceira, async (req: any, res) => {
    try {
      const suppliers = await storage.getSuppliersByPreApprovedUsers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching financeira suppliers:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get imports from pre-approved users for financeira
  app.get('/api/financeira/imports', requireAuth, requireFinanceira, async (req: any, res) => {
    try {
      const imports = await storage.getImportsByPreApprovedUsers();
      res.json(imports);
    } catch (error) {
      console.error("Error fetching financeira imports:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get specific credit application details for financeira
  app.get('/api/financeira/credit-applications/:id', requireAuth, requireFinanceira, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getCreditApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      // Verify it's pre-approved
      if (application.preAnalysisStatus !== "pre_approved") {
        return res.status(403).json({ message: "Solicitação não está pré-aprovada" });
      }
      
      res.json(application);
    } catch (error) {
      console.error("Error fetching application for financeira:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Financeira final approval endpoint
  app.put('/api/financeira/credit-applications/:id/approve', requireAuth, requireFinanceira, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { creditLimit, approvedTerms, financialNotes } = req.body;
      
      if (!creditLimit) {
        return res.status(400).json({ message: "Limite de crédito é obrigatório" });
      }

      const financialData = {
        creditLimit: parseFloat(creditLimit),
        approvedTerms: parseInt(approvedTerms) || 30,
        financialNotes: financialNotes || '',
        financialStatus: 'approved',
        approvedBy: req.session.userId,
        approvedAt: new Date().toISOString()
      };

      const updatedApplication = await storage.updateCreditApplicationStatus(
        applicationId,
        'approved',
        financialData
      );

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error approving credit application:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Financeira final rejection endpoint
  app.put('/api/financeira/credit-applications/:id/reject', requireAuth, requireFinanceira, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { financialNotes } = req.body;

      const financialData = {
        financialNotes: financialNotes || 'Rejeitado após análise financeira',
        financialStatus: 'rejected',
        rejectedBy: req.session.userId,
        rejectedAt: new Date().toISOString()
      };

      const updatedApplication = await storage.updateCreditApplicationStatus(
        applicationId,
        'rejected',
        financialData
      );

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error rejecting credit application:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Financeira update financial data endpoint
  app.put('/api/financeira/credit-applications/:id/update-financial', requireAuth, requireFinanceira, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const financialData = {
        ...req.body,
        updatedBy: req.session.userId,
        updatedAt: new Date().toISOString()
      };

      const updatedApplication = await storage.updateCreditApplication(
        applicationId,
        financialData
      );

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating financial data:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}


