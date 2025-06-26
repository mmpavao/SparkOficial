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
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
      httpOnly: false, // Allow JavaScript access for debugging
      secure: false, // HTTP for development
      maxAge: sessionTtl,
      sameSite: 'lax',
      path: '/',
      domain: undefined, // Let browser set domain automatically
    },
    rolling: true, // Reset expiration on each request
  }));

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

  // Register endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
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
  app.post('/api/credit/applications', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const applicationData = { ...req.body, userId };

      // Update uploadedBy field in documents to actual user ID
      if (applicationData.requiredDocuments) {
        Object.keys(applicationData.requiredDocuments).forEach(key => {
          if (applicationData.requiredDocuments[key]) {
            applicationData.requiredDocuments[key].uploadedBy = userId;
          }
        });
      }

      if (applicationData.optionalDocuments) {
        Object.keys(applicationData.optionalDocuments).forEach(key => {
          if (applicationData.optionalDocuments[key]) {
            applicationData.optionalDocuments[key].uploadedBy = userId;
          }
        });
      }

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
      const now = Date.now();

      // Check cache first
      if (userCreditCache[userId] && (now - userCreditCache[userId].time) < CACHE_DURATION) {
        console.log(`Serving credit applications from cache for user ${userId}`);
        return res.json(userCreditCache[userId].data);
      }

      console.log(`Fetching fresh credit applications for user ${userId}`);
      const applications = await storage.getCreditApplicationsByUser(userId);

      // Update cache
      userCreditCache[userId] = { data: applications, time: now };

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
          approvedBy: userId,
          approvedAt: new Date(),
          approvalReason: req.body.reason || 'Pré-aprovado pela administração'
        }
      );

      // Invalidate caches when data changes
      invalidateAdminCaches();
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

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating analysis:", error);
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

      // Get user's approved credit application
      const userCreditApps = await storage.getCreditApplicationsByUser(userId);
      const approvedCredits = userCreditApps.filter(app => app.status === 'approved');

      if (!approvedCredits.length) {
        return res.status(400).json({ 
          message: "Você precisa ter um crédito aprovado para criar importações" 
        });
      }

      const creditApp = approvedCredits[0];
      const totalValue = parseFloat(data.totalValue);

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

      // Calculate down payment (10% of total with fees)
      const downPaymentAmount = (totalWithFees * 10) / 100;

      // Clean and convert data to match the new schema
      const cleanedData: any = {
        userId,
        creditApplicationId: creditApp.id,
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

      // Create payment schedule
      await storage.createPaymentSchedule(importRecord.id, {
        totalAmount: totalWithFees.toString(),
        downPaymentAmount: downPaymentAmount.toString(),
        downPaymentDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        finalPaymentAmount: (totalWithFees - downPaymentAmount).toString(),
        finalPaymentDueDate: new Date(Date.now() + cleanedData.paymentTermsDays * 24 * 60 * 60 * 1000),
        adminFeeAmount: feeAmount.toString(),
        adminFeeRate: feeRate.toString(),
      });

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

  // Admin import routes
  app.get('/api/admin/imports', requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId);

      // Verificar se é admin ou super admin
      if (currentUser?.role !== "super_admin" && currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const imports = await storage.getAllImports();
      res.json(imports);
    } catch (error) {
      console.error("Error fetching all imports:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.patch('/api/admin/imports/:id/status', requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId);      // Verificar se é admin ou super admin
      if (currentUser?.role !== "super_admin" && currentUser?.role !== "admin") {
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

  // Get all credit applications (admin only)
  app.get('/api/admin/credit-applications', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      // Check cache first
      const now = Date.now();
      if (creditApplicationsCache && (now - creditApplicationsCacheTime) < CACHE_DURATION) {
        console.log("Serving credit applications from cache");
        return res.json(creditApplicationsCache);
      }

      console.log("Fetching fresh credit applications");
      const applications = await storage.getAllCreditApplications();

      // Update cache
      creditApplicationsCache = applications;
      creditApplicationsCacheTime = now;

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

  // Submit payment
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

      const updatedApplication = await storage.updateCreditApplication(applicationId, {
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

  // Get admin fee for current user
  app.get('/api/user/admin-fee', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const adminFee = await storage.getAdminFeeForUser(userId);

      if (!adminFee) {
        return res.json({ feePercentage: "10" }); // Default 10% if no fee configured
      }

      res.json(adminFee);
    } catch (error) {
      console.error("Error fetching admin fee:", error);
      res.status(500).json({ message: "Erro ao buscar taxa administrativa" });
    }
  });

  // Get user's credit information for financial calculations
  app.get('/api/user/credit-info', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;

      // Get user's approved credit applications
      const creditApps = await storage.getCreditApplicationsByUser(userId);
      const approvedCredit = creditApps.find(app => app.status === 'approved');

      if (!approvedCredit) {
        return res.json({
          totalCredit: 0,
          usedCredit: 0,
          availableCredit: 0,
          adminFeePercentage: 10
        });
      }

      // Calculate used credit from imports
      const imports = await storage.getImportsByUser(userId);
      const activeImports = imports.filter(imp => 
        imp.status !== 'cancelado' && 
        imp.status !== 'cancelled' &&
        imp.status !== 'planejamento' && // Crédito só é usado quando sai do planejamento
        imp.creditApplicationId === approvedCredit.id
      );

      const usedCredit = activeImports.reduce((total, imp) => {
        const importValue = parseFloat(imp.totalValue);
        // Credit usage is the full FOB value, not just financed amount
        return total + importValue;
      }, 0);

      // Get admin fee percentage
      const adminFee = await storage.getAdminFeeForUser(userId);
      const adminFeePercentage = adminFee ? parseFloat(adminFee.feePercentage) : 10;

      // Use final admin terms if available, otherwise use financial terms
      const totalCredit = approvedCredit.finalCreditLimit 
        ? parseFloat(approvedCredit.finalCreditLimit)
        : parseFloat(approvedCredit.creditAmount);

      const availableCredit = Math.max(0, totalCredit - usedCredit);

      res.json({
        totalCredit,
        usedCredit,
        availableCredit,
        adminFeePercentage
      });
    } catch (error) {
      console.error("Error fetching credit info:", error);
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
      const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";
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
      if (currentUser?.role !== "admin" && currentUser?.role !== "super_admin") {
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
      if (currentUser?.role !== "admin" && currentUser?.role !== "super_admin") {
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

  // Get all submitted credit applications for financeira
  app.get('/api/financeira/credit-applications', requireAuth, requireFinanceira, async (req: any, res) => {
    try {
      const applications = await storage.getSubmittedCreditApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching submitted applications:", error);
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

      // Financeira can view all applications (removed status restriction)
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

      // Fetch application to get user ID
      const application = await storage.getCreditApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      const financialData = {
        creditLimit: creditLimit,
        approvedTerms: approvedTerms,
        financialNotes: financialNotes || '',
        financialAnalyzedBy: req.session.userId,
        financialAnalyzedAt: new Date().toISOString()
      };

      // Update financial status to approved
      const updatedApplication = await storage.updateFinancialStatus(
        applicationId,
        'approved',
        financialData
      );

      // Also update main status to approved
      const finalApplication = await storage.updateCreditApplicationStatus(
        applicationId, 
        'approved',
        {}
      );

      // Create notification for user
      await storage.notifyCreditStatusChange(
        application.userId,
        applicationId,
        'approved',
        { creditLimit, approvedTerms }
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

  // Financeira dashboard metrics endpoint
  app.get('/api/financeira/dashboard/metrics', requireAuth, requireFinanceira, async (req: any, res) => {
    try {
      const metrics = await storage.getFinanceiraDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching financeira dashboard metrics:", error);
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

  // =========== DOCUMENT UPLOAD ROUTES ===========

  // Upload document to credit application
  app.post('/api/credit/applications/:id/documents', requireAuth, upload.single('document'), async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { documentType, isMandatory } = req.body;
      const file = req.file;

      console.log(`Document upload attempt: ${documentType} for application ${applicationId}`);

      if (!file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      if (!documentType) {
        return res.status(400).json({ message: "Tipo de documento não especificado" });
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "Arquivo muito grande (máximo 10MB)" });
      }

      // Check if user owns the application
      const application = await storage.getCreditApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      if (application.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Store document info with proper encoding
      const documentInfo = {
        filename: file.originalname,
        originalName: file.originalname,
        size: file.size,
        type: file.mimetype,
        uploadedAt: new Date().toISOString(),
        uploadedBy: req.session.userId,
        data: file.buffer.toString('base64'),
      };

      // Get current documents - ensure they're objects
      const currentRequired = typeof application.requiredDocuments === 'object' && application.requiredDocuments !== null 
        ? application.requiredDocuments 
        : {};
      const currentOptional = typeof application.optionalDocuments === 'object' && application.optionalDocuments !== null 
        ? application.optionalDocuments 
        : {};

      // Check if it's a mandatory document
      const mandatoryDocKeys = ['articles_of_incorporation', 'cnpj_certificate'];

      let updateData: any = {};

      if (mandatoryDocKeys.includes(documentType) || isMandatory === 'true') {
        const updatedRequired = { ...currentRequired };
        updatedRequired[documentType] = documentInfo;
        updateData.requiredDocuments = updatedRequired;

        // Update status based on mandatory documents
        const uploadedMandatory = Object.keys(updatedRequired).length;
        if (uploadedMandatory >= mandatoryDocKeys.length) {
          updateData.documentsStatus = 'complete';
          if (application.status === 'pending' || application.status === 'draft') {
            updateData.status = 'pre_analysis';
          }
        } else if (uploadedMandatory > 0) {
          updateData.documentsStatus = 'partial';
        }
      } else {
        const updatedOptional = { ...currentOptional };
        updatedOptional[documentType] = documentInfo;
        updateData.optionalDocuments = updatedOptional;
      }

      // Perform single database update with all changes
      await storage.updateCreditApplication(applicationId, updateData);

      console.log(`Document uploaded successfully: ${documentInfo.originalName} for application ${applicationId}`);
      res.json({ 
        success: true, 
        document: {
          filename: documentInfo.originalName,
          size: documentInfo.size,
          type: documentInfo.type,
          uploadedAt: documentInfo.uploadedAt
        }
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ 
        message: "Erro ao fazer upload do documento",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Payment endpoints

  // Get individual payment details
  app.get('/api/payments/:id', requireAuth, async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPaymentById(paymentId);

      if (!payment) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }

      // Check permissions
      const currentUser = await storage.getUser(req.session.userId);
      const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";
      const isFinanceira = currentUser?.role === "financeira";

      // Get import to check ownership
      const importData = await storage.getImport(payment.importId);
      const isOwner = importData?.userId === req.session.userId;

      if (!isOwner && !isAdmin && !isFinanceira) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      res.json(payment);
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get supplier data for payment
  app.get('/api/payments/:id/supplier', requireAuth, async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPaymentById(paymentId);

      if (!payment) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }

      // Get import and supplier data
      const importData = await storage.getImport(payment.importId);
      if (!importData) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      // Check permissions
      const currentUser = await storage.getUser(req.session.userId);
      const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";
      const isFinanceira = currentUser?.role === "financeira";
      const isOwner = importData.userId === req.session.userId;

      if (!isOwner && !isAdmin && !isFinanceira) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Get supplier from the first product (simplified)
      let supplierData = null;
      if (importData.products && importData.products.length > 0) {
        const firstProduct = importData.products[0];
        if (firstProduct.supplierName) {
          // Find supplier by name
          const suppliers = await storage.getSuppliers(importData.userId);
          supplierData = suppliers.find(s => s.companyName === firstProduct.supplierName);
        }
      }

      if (!supplierData) {
        return res.status(404).json({ message: "Dados do fornecedor não encontrados" });
      }

      res.json(supplierData);
    } catch (error) {
      console.error("Error fetching supplier data:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Process payment with receipt upload
  app.post('/api/payments/:id/pay', requireAuth, upload.single('receipt'), async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { paymentMethod, notes } = req.body;

      const payment = await storage.getPaymentById(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }

      // Check permissions
      const importData = await storage.getImport(payment.importId);
      const currentUser = await storage.getUser(req.session.userId);
      const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";
      const isOwner = importData?.userId === req.session.userId;

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      if (payment.status !== 'pending') {
        return res.status(400).json({ message: "Apenas pagamentos pendentes podem ser processados" });
      }

      // Handle receipt upload
      let receiptUrl = null;
      if (req.file) {
        const receiptData = req.file.buffer.toString('base64');
        receiptUrl = `data:${req.file.mimetype};base64,${receiptData}`;
      }

      // Update payment status
      const updatedPayment = await storage.updatePayment(paymentId, {
        status: 'paid',
        paymentMethod,
        notes,
        receiptUrl,
        paidDate: new Date()
      });

      res.json({
        message: "Pagamento processado com sucesso",
        payment: updatedPayment
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Erro ao processar pagamento" });
    }
  });

  // Update payment details
  app.put('/api/payments/:id', requireAuth, async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { dueDate, amount, notes } = req.body;

      const payment = await storage.getPaymentById(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }

      // Check permissions
      const importData = await storage.getImport(payment.importId);
      const currentUser = await storage.getUser(req.session.userId);
      const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";
      const isOwner = importData?.userId === req.session.userId;

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      if (payment.status !== 'pending') {
        return res.status(400).json({ message: "Apenas pagamentos pendentes podem ser editados" });
      }

      const updatedPayment = await storage.updatePayment(paymentId, {
        dueDate: new Date(dueDate),
        amount: amount.toString(),
        notes
      });

      res.json(updatedPayment);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Erro ao atualizar pagamento" });
    }
  });

  // Cancel payment
  app.delete('/api/payments/:id', requireAuth, async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);

      const payment = await storage.getPaymentById(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }

      // Check permissions
      const importData = await storage.getImport(payment.importId);
      const currentUser = await storage.getUser(req.session.userId);
      const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";
      const isOwner = importData?.userId === req.session.userId;

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      if (payment.status !== 'pending') {
        return res.status(400).json({ message: "Apenas pagamentos pendentes podem ser cancelados" });
      }

      await storage.deletePayment(paymentId);

      res.json({ message: "Pagamento cancelado com sucesso" });
    } catch (error) {
      console.error("Error canceling payment:", error);
      res.status(500).json({ message: "Erro ao cancelar pagamento" });
    }
  });

  // Download document endpoint with real file retrieval
  app.get('/api/documents/download/:documentKey/:applicationId', requireAuth, async (req: any, res) => {
    try {
      const { documentKey, applicationId } = req.params;

      // Get the application to retrieve document data
      const application = await storage.getCreditApplication(parseInt(applicationId));
      if (!application) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }

      // Check permissions: user must own the application or be admin/financeira
      const currentUser = await storage.getUser(req.session.userId);
      const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";
      const isFinanceira = currentUser?.role === "financeira";
      const isOwner = application.userId === req.session.userId;

      if (!isOwner && !isAdmin && !isFinanceira) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Find the document in required or optional documents
      let documentData = null;
      const mandatoryDocs = [
        'business_license', 'cnpj_certificate', 'financial_statements', 'bank_statements',
        'articles_of_incorporation', 'board_resolution', 'tax_registration', 
        'social_security_clearance', 'labor_clearance', 'income_tax_return'
      ];

      if (mandatoryDocs.includes(documentKey)) {
        documentData = application.requiredDocuments?.[documentKey];
      } else {
        documentData = application.optionalDocuments?.[documentKey];
      }

      if (!documentData || !documentData.data) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }

      // Use original filename if available, fallback to stored filename
      const filename = documentData.originalName || documentData.filename || `documento_${documentKey}`;

      // Set proper headers for download with original filename
      res.setHeader('Content-Type', documentData.type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Length', documentData.size || 0);

      // Send the actual file data
      const fileBuffer = Buffer.from(documentData.data, 'base64');
      console.log(`Document download: ${filename} for application ${applicationId} by user ${req.session.userId}`);
      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Erro ao fazer download do documento" });
    }
  });

  // Enhanced caching system for performance optimization
  let adminMetricsCache: any = null;
  let adminMetricsCacheTime = 0;
  let userCreditCache: { [userId: number]: { data: any, time: number } } = {};
  let creditDetailsCache: { [creditId: number]: { data: any, time: number } } = {};

  const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
  const DETAILS_CACHE_DURATION = 1 * 60 * 1000; // 1 minute for credit details

  // Function to invalidate admin caches
  function invalidateAdminCaches() {
    creditApplicationsCache = null;
    adminMetricsCache = null;
    adminMetricsCacheTime = 0;
    console.log("Admin caches invalidated");
  }

  // Admin dashboard metrics endpoint
  app.get('/api/admin/dashboard/metrics', requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId);

      // Only admins can access dashboard metrics
      if (currentUser?.role !== "admin" && currentUser?.role !== "super_admin") {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      // Check cache first
      const now = Date.now();
      if (adminMetricsCache && (now - adminMetricsCacheTime) < CACHE_DURATION) {
        console.log("Serving admin metrics from cache");
        return res.json(adminMetricsCache);
      }

      console.log("Fetching fresh admin metrics");
      const metrics = await storage.getAdminDashboardMetrics();

      // Update cache
      adminMetricsCache = metrics;
      adminMetricsCacheTime = now;

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching admin dashboard metrics:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Import document upload endpoint
  app.post('/api/imports/:id/documents', requireAuth, upload.single('document'), async (req: any, res) => {
    try {
      const importId = parseInt(req.params.id);
      const { category } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "Nenhum arquivo foi enviado" });
      }

      if (!category) {
        return res.status(400).json({ message: "Categoria do documento é obrigatória" });
      }

      // Get import to verify ownership
      const importData = await storage.getImport(importId);
      if (!importData) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Check permissions
      if (currentUser.role !== "admin" && currentUser.role !== "super_admin" && importData.userId !== req.session.userId) {
        return res.status(403).json({ message: "Sem permissão para esta importação" });
      }

      // Convert file to base64
      const base64File = file.buffer.toString('base64');
      const documentData = {
        category,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        data: base64File,
        uploadedAt: new Date().toISOString()
      };

      // Get current documents
      const currentDocuments = importData.documents ? JSON.parse(importData.documents) : {};
      currentDocuments[category] = documentData;

      // Update import with new document
      await storage.updateImport(importId, {
        documents: JSON.stringify(currentDocuments)
      });

      console.log(`Document uploaded successfully: ${file.originalname} for import ${importId}`);
      res.json({ 
        success: true, 
        message: "Documento enviado com sucesso",
        document: {
          category,
          filename: file.originalname,
          uploadedAt: documentData.uploadedAt
        }
      });

    } catch (error) {
      console.error("Error uploading import document:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Import document download endpoint
  app.get('/api/imports/:id/documents/:category', requireAuth, async (req: any, res) => {
    try {
      const importId = parseInt(req.params.id);
      const { category } = req.params;

      const importData = await storage.getImport(importId);
      if (!importData) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Check permissions
      if (currentUser.role !== "admin" && currentUser.role !== "super_admin" && importData.userId !== req.session.userId) {
        return res.status(403).json({ message: "Sem permissão para esta importação" });
      }

      const documents = importData.documents ? JSON.parse(importData.documents) : {};
      const document = documents[category];

      if (!document) {
        return res.status(404).json({ message: "Documento não encontrado" });
      }

      // Convert base64 back to buffer
      const buffer = Buffer.from(document.data, 'base64');

      res.set({
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${document.filename}"`
      });

      res.send(buffer);

    } catch (error) {
      console.error("Error downloading import document:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Import document delete endpoint
  app.delete('/api/imports/:id/documents/:category', requireAuth, async (req: any, res) => {
    try {
      const importId = parseInt(req.params.id);
      const { category } = req.params;

      const importData = await storage.getImport(importId);
      if (!importData) {
        return res.status(404).json({ message: "Importação não encontrada" });
      }

      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Check permissions
      if (currentUser.role !== "admin" && currentUser.role !== "super_admin" && importData.userId !== req.session.userId) {
        return res.status(403).json({ message: "Sem permissão para esta importação" });
      }

      // Get current documents and remove the specified category
      const currentDocuments = importData.documents ? JSON.parse(importData.documents) : {};
      delete currentDocuments[category];

      // Update import
      await storage.updateImport(importId, {
        documents: JSON.stringify(currentDocuments)
      });

      res.json({ 
        success: true, 
        message: "Documento removido com sucesso"
      });

    } catch (error) {
      console.error("Error deleting import document:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Importer dashboard endpoint
  app.get('/api/dashboard/importer', requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Get user's credit applications
      const creditApplications = await storage.getCreditApplicationsByUser(req.session.userId);
      const approvedApplication = creditApplications.find(app => 
        app.adminStatus === 'admin_finalized' || 
        app.adminStatus === 'finalized' || 
        app.status === 'approved' || 
        app.status === 'finalized'
      );

      // Get user's imports
      const imports = await storage.getImportsByUser(req.session.userId);

      // Get user's suppliers
      const suppliers = await storage.getSuppliersByUser(req.session.userId);

      // Calculate credit metrics
      let creditMetrics = {
        approvedAmount: 0,
        usedAmount: 0,
        availableAmount: 0,
        utilizationRate: 0
      };

      if (approvedApplication) {
        const creditLimit = parseFloat(
          approvedApplication.finalCreditLimit || 
          approvedApplication.requestedAmount || 
          '0'
        );

        // Calculate used credit from active imports (not in planning stage)
        // Credit usage is the full FOB value of imports, not just financed amount
        const activeImports = imports.filter(imp => 
          imp.status !== 'planejamento' && 
          imp.status !== 'cancelado' && 
          imp.creditApplicationId === approvedApplication.id
        );

        const usedAmount = activeImports.reduce((sum, imp) => {
          return sum + parseFloat(imp.totalValue || '0');
        }, 0);

        creditMetrics = {
          approvedAmount: creditLimit,
          usedAmount: usedAmount,
          availableAmount: creditLimit - usedAmount,
          utilizationRate: creditLimit > 0 ? (usedAmount / creditLimit) * 100 : 0
        };
      }

      // Calculate import metrics
      const totalValue = imports.reduce((sum, imp) => sum + parseFloat(imp.totalValue || '0'), 0);
      const activeImports = imports.filter(imp => 
        imp.status !== 'concluido' && imp.status !== 'cancelado'
      ).length;
      const completedImports = imports.filter(imp => imp.status === 'concluido').length;

      // Status breakdown
      const statusBreakdown = {
        planning: imports.filter(imp => imp.status === 'planejamento').length,
        production: imports.filter(imp => imp.status === 'producao').length,
        shipping: imports.filter(imp => 
          imp.status === 'transporte_maritimo' || 
          imp.status === 'transporte_aereo' ||
          imp.status === 'entregue_agente' ||
          imp.status === 'desembaraco' ||
          imp.status === 'transporte_nacional'
        ).length,
        completed: completedImports
      };

      // Recent activity - last 5 imports and credit applications
      const recentImports = imports
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5)
        .map(imp => ({
          id: imp.id,
          name: imp.importName || `Importação #${imp.id}`,
          status: imp.status,
          value: imp.totalValue || '0',
          date: imp.createdAt || new Date().toISOString()
        }));

      const recentCreditApplications = creditApplications
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 3)
        .map(app => ({
          id: app.id,
          status: app.adminStatus || app.status,
          amount: app.finalCreditLimit || app.requestedAmount || '0',
          date: app.createdAt || new Date().toISOString()
        }));

      const dashboardData = {
        creditMetrics,
        importMetrics: {
          totalImports: imports.length,
          activeImports,
          completedImports,
          totalValue
        },
        supplierMetrics: {
          totalSuppliers: suppliers.length,
          activeSuppliers: suppliers.filter(s => s.status === 'active').length
        },
        recentActivity: {
          imports: recentImports,
          creditApplications: recentCreditApplications
        },
        statusBreakdown
      };

      res.json(dashboardData);

    } catch (error) {
      console.error("Error fetching importer dashboard data:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}