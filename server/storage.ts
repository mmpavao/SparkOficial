import { 
  users, 
  creditApplications, 
  imports,
  suppliers,
  creditUsage,
  adminFees,
  paymentSchedules,
  payments,
  importDocuments,
  notifications,
  type User, 
  type InsertUser,
  type CreditApplication,
  type InsertCreditApplication,
  type Import,
  type InsertImport,
  type Supplier,
  type InsertSupplier,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, getTableColumns, or, sql, isNull, isNotNull, gte, lte, like, asc, lt } from "drizzle-orm";
import bcrypt from "bcrypt";

export class DatabaseStorage {
  // ===== USER OPERATIONS =====

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      console.log("Searching for user with email:", normalizedEmail);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (user) {
        console.log("User found - ID:", user.id, "Email:", user.email, "Status:", user.status);
        console.log("Password hash exists:", !!user.password);
      } else {
        console.log("No user found for email:", normalizedEmail);
      }

      return user || null;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      throw error;
    }
  }

  async getUserByCnpj(cnpj: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.cnpj, cnpj)).limit(1);
    return result[0];
  }

  async createUser(insertUser: Omit<InsertUser, 'confirmPassword'>): Promise<User> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(insertUser.password, saltRounds);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateImporterData(id: number, data: Partial<User>): Promise<User> {
    // Clean the data to only include valid fields and convert dates properly
    const cleanData: Partial<User> = {};
    
    // Only include fields that are actually being updated
    if (data.defaultAdminFeeRate !== undefined) cleanData.defaultAdminFeeRate = data.defaultAdminFeeRate;
    if (data.defaultDownPaymentRate !== undefined) cleanData.defaultDownPaymentRate = data.defaultDownPaymentRate;
    if (data.defaultPaymentTerms !== undefined) cleanData.defaultPaymentTerms = data.defaultPaymentTerms;
    
    // Always set updatedAt to current timestamp
    cleanData.updatedAt = new Date();
    
    const [user] = await db
      .update(users)
      .set(cleanData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // ===== CREDIT APPLICATION OPERATIONS =====

  async createCreditApplication(application: InsertCreditApplication): Promise<CreditApplication> {
    // Convert documents to JSON strings for database storage
    const processedApplication = { ...application };
    
    console.log('🔄 DOCUMENTS DEBUG - Processing application with documents:');
    console.log('Required docs received:', application.requiredDocuments ? Object.keys(application.requiredDocuments) : 'NONE');
    console.log('Optional docs received:', application.optionalDocuments ? Object.keys(application.optionalDocuments) : 'NONE');
    
    // CRITICAL FIX: Ensure documents are properly stringified with fallback
    if (processedApplication.requiredDocuments && typeof processedApplication.requiredDocuments === 'object') {
      const docString = JSON.stringify(processedApplication.requiredDocuments);
      console.log('✅ Required documents stringified:', docString.substring(0, 100) + '...');
      processedApplication.requiredDocuments = docString;
    } else {
      console.log('⚠️ No required documents to save');
      processedApplication.requiredDocuments = null;
    }
    
    if (processedApplication.optionalDocuments && typeof processedApplication.optionalDocuments === 'object') {
      const docString = JSON.stringify(processedApplication.optionalDocuments);
      console.log('✅ Optional documents stringified:', docString.substring(0, 100) + '...');
      processedApplication.optionalDocuments = docString;
    } else {
      console.log('⚠️ No optional documents to save');
      processedApplication.optionalDocuments = null;
    }

    const [creditApp] = await db
      .insert(creditApplications)
      .values(processedApplication)
      .returning();
      
    console.log('💾 Credit application saved with ID:', creditApp.id);
    console.log('📄 Documents saved successfully:', {
      requiredSaved: !!creditApp.requiredDocuments,
      optionalSaved: !!creditApp.optionalDocuments
    });
    
    return creditApp;
  }

  async getCreditApplicationsByUser(userId: number): Promise<CreditApplication[]> {
    const applications = await db
      .select()
      .from(creditApplications)
      .where(eq(creditApplications.userId, userId))
      .orderBy(desc(creditApplications.createdAt));
    
    // Parse JSON documents back to objects for each application
    return applications.map(application => {
      const app = { ...application };
      
      if (app.requiredDocuments && typeof app.requiredDocuments === 'string') {
        try {
          app.requiredDocuments = JSON.parse(app.requiredDocuments);
        } catch (e) {
          console.log('Error parsing requiredDocuments for app', app.id, ':', e);
        }
      }
      
      if (app.optionalDocuments && typeof app.optionalDocuments === 'string') {
        try {
          app.optionalDocuments = JSON.parse(app.optionalDocuments);
        } catch (e) {
          console.log('Error parsing optionalDocuments for app', app.id, ':', e);
        }
      }
      
      return app;
    });
  }

  async getCreditApplication(id: number): Promise<CreditApplication | undefined> {
    const result = await db
      .select()
      .from(creditApplications)
      .where(eq(creditApplications.id, id))
      .limit(1);
    
    if (result[0]) {
      const application = { ...result[0] };
      
      // Parse JSON documents back to objects
      if (application.requiredDocuments && typeof application.requiredDocuments === 'string') {
        try {
          application.requiredDocuments = JSON.parse(application.requiredDocuments);
        } catch (e) {
          console.log('Error parsing requiredDocuments:', e);
        }
      }
      
      if (application.optionalDocuments && typeof application.optionalDocuments === 'string') {
        try {
          application.optionalDocuments = JSON.parse(application.optionalDocuments);
        } catch (e) {
          console.log('Error parsing optionalDocuments:', e);
        }
      }
      
      return application;
    }
    
    return result[0];
  }

  async updateCreditApplicationStatus(id: number, status: string, reviewData?: any): Promise<CreditApplication> {
    // Obter dados da aplicação antes da atualização para comparar mudanças
    const currentApp = await this.getCreditApplication(id);
    
    const [creditApp] = await db
      .update(creditApplications)
      .set({ 
        status,
        ...reviewData,
        updatedAt: new Date()
      })
      .where(eq(creditApplications.id, id))
      .returning();
    
    // Enviar notificação automática se houve mudança relevante
    if (currentApp && this.shouldNotifyStatusChange(currentApp.status, status)) {
      await this.createStatusChangeNotification(creditApp, currentApp.status, status);
    }
    
    return creditApp;
  }

  // Função para determinar se deve notificar sobre mudança de status
  private shouldNotifyStatusChange(oldStatus: string, newStatus: string): boolean {
    const notifiableChanges = [
      { from: 'pending', to: 'pre_approved' },
      { from: 'pre_approved', to: 'submitted_to_financial' },
      { from: 'submitted_to_financial', to: 'approved' },
      { from: 'approved', to: 'admin_finalized' },
      { from: 'pending', to: 'rejected' },
      { from: 'pre_approved', to: 'rejected' },
      { from: 'submitted_to_financial', to: 'rejected' }
    ];
    
    return notifiableChanges.some(change => 
      change.from === oldStatus && change.to === newStatus
    );
  }

  // Criar notificação automática para mudança de status
  private async createStatusChangeNotification(app: CreditApplication, oldStatus: string, newStatus: string): Promise<void> {
    const statusMessages = {
      pre_approved: {
        title: "Crédito Pré-Aprovado",
        message: `Sua solicitação de crédito de ${app.requestedAmount} foi pré-aprovada e enviada para análise financeira.`,
        type: "success" as const,
        priority: "high" as const
      },
      submitted_to_financial: {
        title: "Enviado para Análise Final",
        message: `Sua solicitação de crédito está em análise final pela equipe financeira.`,
        type: "info" as const,
        priority: "normal" as const
      },
      approved: {
        title: "Crédito Aprovado",
        message: `Parabéns! Sua solicitação de crédito de ${app.requestedAmount} foi aprovada.`,
        type: "success" as const,
        priority: "urgent" as const
      },
      admin_finalized: {
        title: "Crédito Disponível",
        message: `Seu crédito foi finalizado e está disponível para uso. Valor aprovado: ${app.finalCreditLimit || app.requestedAmount}`,
        type: "success" as const,
        priority: "urgent" as const
      },
      rejected: {
        title: "Solicitação Rejeitada",
        message: `Sua solicitação de crédito foi rejeitada. Entre em contato conosco para mais informações.`,
        type: "error" as const,
        priority: "high" as const
      }
    };

    const notificationData = statusMessages[newStatus as keyof typeof statusMessages];
    if (notificationData && app.userId) {
      await this.createNotification({
        userId: app.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority,
        relatedEntityType: 'credit_application',
        relatedEntityId: app.id
      });
      
      console.log(`🔔 NOTIFICAÇÃO AUTOMÁTICA: ${notificationData.title} enviada para usuário ${app.userId}`);
    }
  }

  async updateCreditApplication(id: number, data: Partial<InsertCreditApplication>): Promise<CreditApplication> {
    const [creditApp] = await db
      .update(creditApplications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(creditApplications.id, id))
      .returning();
    return creditApp;
  }

  // ===== IMPORT OPERATIONS =====

  async createImport(importData: InsertImport): Promise<Import> {
    const [importRecord] = await db
      .insert(imports)
      .values(importData)
      .returning();
    return importRecord;
  }

  async getImportsByUser(userId: number): Promise<Import[]> {
    console.log(`🔍 Storage: Getting imports for user ${userId}`);
    
    try {
      const result = await db
        .select()
        .from(imports)
        .where(eq(imports.userId, userId))
        .orderBy(desc(imports.createdAt));
      
      console.log(`📊 Storage: Query executed successfully - Found ${result.length} imports for user ${userId}`);
      
      if (result.length > 0) {
        console.log(`📋 Import IDs:`, result.map(imp => imp.id));
        console.log(`📋 First import sample:`, {
          id: result[0].id,
          name: result[0].importName,
          userId: result[0].userId,
          status: result[0].status
        });
      } else {
        console.log(`⚠️ No imports found for user ${userId} - checking if user exists in any imports`);
        
        // Debug query to check if user has any imports at all
        const allImports = await db.select().from(imports);
        const userInAnyImport = allImports.find(imp => imp.userId === userId);
        console.log(`🔍 User ${userId} found in any imports:`, !!userInAnyImport);
        
        if (userInAnyImport) {
          console.log(`🎯 Sample user import:`, {
            id: userInAnyImport.id,
            name: userInAnyImport.importName,
            userId: userInAnyImport.userId
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Database error in getImportsByUser for user ${userId}:`, error);
      throw error;
    }
  }

  async getImport(id: number): Promise<Import | undefined> {
    const result = await db
      .select()
      .from(imports)
      .where(eq(imports.id, id))
      .limit(1);
    return result[0];
  }

  // Get import by ID (admin access)
  async getImportById(importId: number) {
    const result = await db.select()
      .from(imports)
      .where(eq(imports.id, importId))
      .limit(1);
    return result[0] || null;
  }

  // Get import by ID and user (user access control)
  async getImportByIdAndUser(importId: number, userId: number) {
    const result = await db.select()
      .from(imports)
      .where(and(eq(imports.id, importId), eq(imports.userId, userId)))
      .limit(1);
    return result[0] || null;
  }

  // Payment schedules methods
  async getPaymentSchedulesByImport(importId: number) {
    const result = await db.select()
      .from(paymentSchedules)
      .where(eq(paymentSchedules.importId, importId))
      .orderBy(paymentSchedules.dueDate);
    return result;
  }

  // Import documents methods
  async getImportDocuments(importId: number) {
    const result = await db.select()
      .from(importDocuments)
      .where(eq(importDocuments.importId, importId))
      .orderBy(desc(importDocuments.uploadedAt));
    return result;
  }

  async createImportDocument(data: {
    importId: number;
    documentType: string;
    fileName: string;
    fileData: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: number;
  }) {
    const result = await db.insert(importDocuments).values({
      importId: data.importId,
      documentType: data.documentType,
      fileName: data.fileName,
      fileData: data.fileData,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      uploadedBy: data.uploadedBy,
    }).returning();
    return result[0];
  }

  async getImportDocumentById(documentId: number) {
    const result = await db.select()
      .from(importDocuments)
      .where(eq(importDocuments.id, documentId))
      .limit(1);
    return result[0] || null;
  }

  async updateImportStatus(id: number, status: string, updateData?: any): Promise<Import> {
    const [importRecord] = await db
      .update(imports)
      .set({ status, ...updateData, updatedAt: new Date() })
      .where(eq(imports.id, id))
      .returning();
    return importRecord;
  }

  async updateImport(id: number, updateData: any): Promise<Import> {
    const [importRecord] = await db
      .update(imports)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(imports.id, id))
      .returning();
    return importRecord;
  }

  async releaseCredit(creditApplicationId: number, importId: number): Promise<void> {
    // Remove credit usage record
    await db
      .delete(creditUsage)
      .where(and(
        eq(creditUsage.creditApplicationId, creditApplicationId),
        eq(creditUsage.importId, importId)
      ));
  }

  // Add missing storage methods for payments and credit management
  async updateCreditBalance(creditApplicationId: number, usedAmount: string, availableAmount: string): Promise<void> {
    await db
      .update(creditApplications)
      .set({ 
        creditUsed: usedAmount,
        updatedAt: new Date()
      })
      .where(eq(creditApplications.id, creditApplicationId));
  }

  async getPaymentsByImport(importId: number) {
    return await db
      .select()
      .from(paymentSchedules)
      .where(eq(paymentSchedules.importId, importId))
      .orderBy(paymentSchedules.dueDate);
  }

  async confirmPayment(paymentId: number, confirmationData: any) {
    return await db
      .update(paymentSchedules)
      .set({
        status: "paid",
        paidAt: new Date(),
        receiptData: confirmationData.receiptData,
        updatedAt: new Date()
      })
      .where(eq(paymentSchedules.id, paymentId))
      .returning();
  }

  async rejectPayment(paymentId: number, reason: string) {
    return await db
      .update(paymentSchedules)
      .set({
        status: "rejected",
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(paymentSchedules.id, paymentId))
      .returning();
  }

  // ===== SUPPLIER OPERATIONS =====

  async createSupplier(supplierData: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db
      .insert(suppliers)
      .values(supplierData)
      .returning();
    return supplier;
  }

  async getSuppliersByUser(userId: number): Promise<Supplier[]> {
    return await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.userId, userId))
      .orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const result = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);
    return result[0];
  }

  async updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier> {
    const [supplier] = await db
      .update(suppliers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return supplier;
  }

  async deleteSupplier(id: number): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  // ===== ADMIN OPERATIONS =====

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllCreditApplications(): Promise<CreditApplication[]> {
    const applications = await db
      .select()
      .from(creditApplications)
      .orderBy(desc(creditApplications.createdAt));

    return applications;
  }

  async getAllCreditApplicationsOptimized(): Promise<CreditApplication[]> {
    // Query otimizada sem dados pesados desnecessários
    const applications = await db
      .select({
        id: creditApplications.id,
        userId: creditApplications.userId,
        legalCompanyName: creditApplications.legalCompanyName,
        requestedAmount: creditApplications.requestedAmount,
        status: creditApplications.status,
        preAnalysisStatus: creditApplications.preAnalysisStatus,
        financialStatus: creditApplications.financialStatus,
        adminStatus: creditApplications.adminStatus,
        createdAt: creditApplications.createdAt,
        updatedAt: creditApplications.updatedAt,
        finalCreditLimit: creditApplications.finalCreditLimit,
        creditLimit: creditApplications.creditLimit,
        approvedTerms: creditApplications.approvedTerms,
        finalApprovedTerms: creditApplications.finalApprovedTerms
      })
      .from(creditApplications)
      .orderBy(desc(creditApplications.createdAt));

    return applications;
  }

  async getAllImports(): Promise<Import[]> {
    const importsTable = imports;
    const importsResult = await db
      .select()
      .from(importsTable)
      .orderBy(desc(importsTable.createdAt));

    return importsResult;
  }

  async getAllImportsOptimized(): Promise<Import[]> {
    const importsTable = imports;
    // Query otimizada sem dados JSON pesados
    const importsResult = await db
      .select({
        id: importsTable.id,
        userId: importsTable.userId,
        creditApplicationId: importsTable.creditApplicationId,
        importName: importsTable.importName,
        importNumber: importsTable.importNumber,
        cargoType: importsTable.cargoType,
        totalValue: importsTable.totalValue,
        currency: importsTable.currency,
        status: importsTable.status,
        currentStage: importsTable.currentStage,
        estimatedDelivery: importsTable.estimatedDelivery,
        createdAt: importsTable.createdAt,
        updatedAt: importsTable.updatedAt,
        incoterms: importsTable.incoterms,
        shippingMethod: importsTable.shippingMethod,
        containerType: importsTable.containerType,
        paymentStatus: importsTable.paymentStatus,
        downPaymentStatus: importsTable.downPaymentStatus
      })
      .from(importsTable)
      .orderBy(desc(importsTable.createdAt));

    return importsResult;
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  // ===== CREDIT MANAGEMENT =====

  async calculateAvailableCredit(creditApplicationId: number): Promise<{ used: number, available: number, limit: number }> {
    const application = await this.getCreditApplication(creditApplicationId);
    if (!application) throw new Error("Credit application not found");

    const creditLimit = parseFloat(application.finalCreditLimit || application.creditLimit || "0");

    // Get all active imports linked to this credit application
    // Include both English and Portuguese status values for compatibility
    const activeImports = await db
      .select()
      .from(imports)
      .where(
        and(
          eq(imports.creditApplicationId, creditApplicationId),
          inArray(imports.status, [
            // Portuguese status values
            "planejamento", "producao", "entregue_agente", "transporte_maritimo", "transporte_aereo", "desembaraco", "transporte_nacional",
            // English status values
            "planning", "production", "delivered_agent", "maritime_transport", "air_transport", "customs_clearance", "national_transport"
          ])
        )
      );

    // Calculate total used credit from active imports (full FOB value - credit covers entire import)
    const usedCredit = activeImports.reduce((total, importRecord) => {
      const importValue = parseFloat(importRecord.totalValue || "0");
      // Credit usage is the full FOB value, not just financed amount
      return total + importValue;
    }, 0);

    const availableCredit = creditLimit - usedCredit;

    console.log(`Credit calculation for app ${creditApplicationId}:`, {
      creditLimit,
      activeImports: activeImports.length,
      usedCredit,
      availableCredit
    });

    return {
      used: usedCredit,
      available: Math.max(0, availableCredit),
      limit: creditLimit
    };
  }

  async reserveCredit(creditApplicationId: number, importId: number, amount: string) {
    return await db
      .insert(creditUsage)
      .values({
        creditApplicationId,
        importId,
        amountUsed: amount,
        status: "reserved",
        reservedAt: new Date(),
      })
      .returning();
  }

  async confirmCreditUsage(creditApplicationId: number, importId: number) {
    return await db
      .update(creditUsage)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(creditUsage.creditApplicationId, creditApplicationId),
          eq(creditUsage.importId, importId)
        )
      )
      .returning();
  }



  // Generate payment schedule for import based on credit terms
  async generatePaymentSchedule(importId: number, totalValue: string, creditApplicationId: number) {
    // Get credit application to fetch payment terms
    const creditApp = await this.getCreditApplication(creditApplicationId);
    if (!creditApp) throw new Error("Credit application not found");

    const totalAmount = parseFloat(totalValue);

    // Use fixed down payment percentage of 30% (as shown in financial analysis)
    const downPaymentPercent = 0.30; // 30% down payment for all imports

    const downPaymentAmount = totalAmount * downPaymentPercent;
    const remainingAmount = totalAmount - downPaymentAmount;

    // Parse payment terms (e.g., "30,60,90,120" days)
    const paymentTerms = creditApp.adminStatus === 'admin_finalized'
      ? (creditApp as any).finalApprovedTerms || (creditApp as any).approvedTerms || "30,60,90,120"
      : (creditApp as any).approvedTerms || "30,60,90,120";

    const termsDays = paymentTerms.split(',').map((term: string) => parseInt(term.trim()));
    const installmentAmount = remainingAmount / termsDays.length;

    const schedules = [];

    // Down payment - due when import status changes to "entregue_agente"
    schedules.push({
      importId,
      paymentType: "down_payment",
      amount: downPaymentAmount.toFixed(2),
      currency: "USD",
      dueDate: new Date(), // Will be updated when status changes
      status: "pending",
      installmentNumber: null,
      totalInstallments: null
    });

    // Installments based on payment terms - start counting from "entregue_agente" status
    for (let i = 0; i < termsDays.length; i++) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + termsDays[i]);

      schedules.push({
        importId,
        paymentType: "installment",
        amount: installmentAmount.toFixed(2),
        currency: "USD",
        dueDate,
        status: "pending",
        installmentNumber: i + 1,
        totalInstallments: termsDays.length
      });
    }

    // Insert all payment schedules
    return await db.insert(paymentSchedules).values(schedules).returning();
  }

  // ===== ADMIN FEES =====

  async getAdminFeeForUser(userId: number) {
    const result = await db
      .select()
      .from(adminFees)
      .where(
        and(
          eq(adminFees.userId, userId),
          eq(adminFees.isActive, true)
        )
      )
      .limit(1);

    return result[0] || null;
  }

  async setAdminFeeForUser(userId: number, feePercentage: string, createdBy: number) {
    return await db
      .insert(adminFees)
      .values({
        userId,
        feePercentage,
        createdBy,
        isActive: true,
        createdAt: new Date(),
      })
      .returning();
  }

  async getAllAdminFees() {
    return await db.select().from(adminFees).where(eq(adminFees.isActive, true));
  }

  // ===== PAYMENT SCHEDULES =====

  async createPaymentSchedule(importId: number, paymentData: any) {
    return await db
      .insert(paymentSchedules)
      .values({
        importId,
        paymentType: paymentData.paymentType || "down_payment",
        dueDate: paymentData.dueDate || new Date(),
        amount: paymentData.amount || "0",
        currency: paymentData.currency || "USD",
        status: "pending",
        installmentNumber: paymentData.installmentNumber,
        totalInstallments: paymentData.totalInstallments,
      })
      .returning();
  }

  async getPaymentScheduleByImport(importId: number) {
    const result = await db
      .select()
      .from(paymentSchedules)
      .where(eq(paymentSchedules.importId, importId))
      .orderBy(asc(paymentSchedules.dueDate));
    return result;
  }

  async updatePaymentScheduleStatus(scheduleId: number, status: string) {
    return await db
      .update(paymentSchedules)
      .set({ status, updatedAt: new Date() })
      .where(eq(paymentSchedules.id, scheduleId))
      .returning();
  }

  // ===== PAYMENTS =====

  async createPayment(paymentData: any) {
    return await db
      .insert(payments)
      .values({
        ...paymentData,
        createdAt: new Date(),
      })
      .returning();
  }

  async getPaymentsBySchedule(scheduleId: number) {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.paymentScheduleId, scheduleId));
  }

  async updatePaymentStatus(paymentId: number, status: string) {
    return await db
      .update(payments)
      .set({ status, updatedAt: new Date() })
      .where(eq(payments.id, paymentId))
      .returning();
  }

  // ===== USER MANAGEMENT =====

  async createUserByAdmin(userData: Omit<InsertUser, 'confirmPassword'>, createdBy: number): Promise<User> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    const [user] = await db
      .insert(users)
      .values({ 
        ...userData, 
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async updateUserRole(userId: number, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deactivateUser(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, role))
      .orderBy(desc(users.createdAt));
  }

  // ===== FINANCIAL OPERATIONS =====

  async getPreApprovedCreditApplications(): Promise<CreditApplication[]> {
    return await db
      .select()
      .from(creditApplications)
      .where(eq(creditApplications.preAnalysisStatus, "pre_approved"))
      .orderBy(desc(creditApplications.createdAt));
  }

  async getSubmittedCreditApplications(): Promise<CreditApplication[]> {
    return await db
      .select()
      .from(creditApplications)
      .where(
        or(
          eq(creditApplications.status, "submitted_to_financial"),
          eq(creditApplications.financialStatus, "approved"),
          eq(creditApplications.financialStatus, "rejected"),
          eq(creditApplications.status, "approved"),
          eq(creditApplications.status, "rejected")
        )
      )
      .orderBy(desc(creditApplications.createdAt));
  }

  async updateFinancialStatus(id: number, status: string, financialData?: any): Promise<CreditApplication> {
    const [creditApp] = await db
      .update(creditApplications)
      .set({ 
        status,
        ...financialData,
        updatedAt: new Date()
      })
      .where(eq(creditApplications.id, id))
      .returning();
    return creditApp;
  }

  async getSuppliersByPreApprovedUsers(): Promise<Supplier[]> {
    const preApprovedApps = await this.getPreApprovedCreditApplications();
    const userIds = preApprovedApps.map(app => app.userId);

    if (userIds.length === 0) return [];

    return await db
      .select()
      .from(suppliers)
      .where(inArray(suppliers.userId, userIds))
      .orderBy(desc(suppliers.createdAt));
  }

  async getImportsByPreApprovedUsers(): Promise<Import[]> {
    const preApprovedApps = await this.getPreApprovedCreditApplications();
    const userIds = preApprovedApps.map(app => app.userId);

    if (userIds.length === 0) return [];

    const allImports = await db.select().from(imports);
    const allUsers = await db.select().from(users);

    return allImports
      .filter(importItem => userIds.includes(importItem.userId))
      .map(importItem => {
        const user = allUsers.find(u => u.id === importItem.userId);
        return {
          ...importItem,
          companyName: user?.companyName || 'Empresa não encontrada'
        };
      }) as Import[];
  }

  async getFinanceiraDashboardMetrics() {
    try {
      // Get all applications that were submitted to financeira (pre-approved or higher)
      const [submittedApplications, allUsers, allImports] = await Promise.all([
        db.select().from(creditApplications)
        .where(
          or(
            eq(creditApplications.preAnalysisStatus, "pre_approved"),
            eq(creditApplications.status, "submitted_to_financial"),
            eq(creditApplications.financialStatus, "approved"),
            eq(creditApplications.financialStatus, "rejected"),
            eq(creditApplications.status, "approved"),
            eq(creditApplications.status, "rejected")
          )
        )
        .orderBy(desc(creditApplications.createdAt)),

        db.select().from(users),

        db.select().from(imports).where(isNotNull(imports.creditApplicationId))
      ]);

      // Calculate metrics
      const totalApplicationsSubmitted = submittedApplications.length;
      const totalCreditRequested = submittedApplications.reduce((sum, app) => {
        const amount = app.requestedAmount || '0';
        return sum + parseFloat(amount.toString());
      }, 0);

      // Calculate approved applications and total credit approved
      const approvedApplications = submittedApplications.filter(app => 
        app.financialStatus === 'approved' || app.status === 'approved'
      );
      const totalCreditApproved = approvedApplications.reduce((sum, app) => {
        const approvedAmount = app.finalCreditLimit || app.creditLimit || app.requestedAmount || '0';
        return sum + parseFloat(approvedAmount.toString());
      }, 0);

      // Calculate credit in use from active imports
      const totalCreditInUse = allImports
        .filter(imp => imp.status !== 'cancelado' && imp.status !== 'cancelled' && imp.status !== 'planejamento')
        .reduce((sum, imp) => sum + parseFloat(imp.totalValue || '0'), 0);

      const totalCreditAvailable = totalCreditApproved - totalCreditInUse;

      // Calculate applications by status
      const applicationsByStatus = {
        pending: submittedApplications.filter(app => 
          app.preAnalysisStatus === 'pre_approved' && 
          !app.financialStatus && 
          app.status !== 'approved' && 
          app.status !== 'rejected'
        ).length,
        under_review: submittedApplications.filter(app => 
          app.financialStatus === 'under_review' || 
          app.status === 'submitted_to_financial'
        ).length,
        approved: submittedApplications.filter(app => 
          app.financialStatus === 'approved' || app.status === 'approved'
        ).length,
        rejected: submittedApplications.filter(app => 
          app.financialStatus === 'rejected' || app.status === 'rejected'
        ).length,
        cancelled: submittedApplications.filter(app => 
          app.status === 'cancelled'
        ).length
      };

      // Calculate approval rate
      const totalProcessed = applicationsByStatus.approved + applicationsByStatus.rejected;
      const approvalRate = totalProcessed > 0 ? (applicationsByStatus.approved / totalProcessed) * 100 : 0;

      // Calculate average approval time (in days)
      const approvedWithTimes = approvedApplications.filter(app => 
        app.submittedToFinancialAt && app.financialAnalyzedAt
      );
      const averageApprovalTime = approvedWithTimes.length > 0 
        ? approvedWithTimes.reduce((sum, app) => {
            const submitted = new Date(app.submittedToFinancialAt!);
            const analyzed = new Date(app.financialAnalyzedAt!);
            const diffDays = Math.ceil((analyzed.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
            return sum + diffDays;
          }, 0) / approvedWithTimes.length
        : 0;

      // Recent activity - last 10 applications
      const recentActivity = submittedApplications
        .slice(0, 10)
        .map(app => {
          const user = allUsers.find(u => u.id === app.userId);
          return {
            id: app.id || 0,
            companyName: user?.companyName || 'Empresa não encontrada',
            status: app.financialStatus || app.status || 'pending',
            requestedAmount: (app.requestedAmount || '0').toString(),
            approvedAmount: (app.finalCreditLimit || app.creditLimit || '0').toString(),
            submittedAt: (app.submittedToFinancialAt || app.createdAt || new Date()).toString()
          };
        });

      // Monthly stats (current month)
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthlyApplications = submittedApplications.filter(app => {
        const appDate = app.createdAt ? new Date(app.createdAt) : new Date(0);
        return appDate >= monthStart;
      });

      const monthlyApprovals = monthlyApplications.filter(app => 
        app.financialStatus === 'approved' || app.status === 'approved'
      );

      const monthlyVolume = monthlyApprovals.reduce((sum, app) => {
        const approvedAmount = app.finalCreditLimit || app.creditLimit || app.requestedAmount || '0';
        return sum + parseFloat(approvedAmount.toString());
      }, 0);

      return {
        totalApplicationsSubmitted,
        totalCreditRequested,
        totalCreditApproved,
        totalCreditInUse,
        totalCreditAvailable,
        applicationsByStatus,
        approvalRate: Math.round(approvalRate * 100) / 100,
        averageApprovalTime: Math.round(averageApprovalTime * 100) / 100,
        recentActivity,
        monthlyStats: {
          applications: monthlyApplications.length,
          approvals: monthlyApprovals.length,
          volume: monthlyVolume
        }
      };
    } catch (error) {
      console.error("Error calculating financeira dashboard metrics:", error);
      throw error;
    }
  }

  // ===== NOTIFICATIONS =====

  async createNotification(notificationData: {
    userId: number;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: any;
    priority?: string;
    isRead?: boolean;
  }) {
    return await db
      .insert(notifications)
      .values({
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.metadata || {},
        priority: notificationData.priority || "medium",
        status: notificationData.isRead ? "read" : "unread",
        createdAt: new Date(),
      })
      .returning();
  }

  async getUserNotifications(userId: number, limit: number = 10) {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotificationsCount(userId: number) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.status, "unread")
        )
      );
    return result[0]?.count || 0;
  }

  async markNotificationAsRead(notificationId: number, userId: number) {
    return await db
      .update(notifications)
      .set({
        status: "read",
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();
  }

  async markAllNotificationsAsRead(userId: number) {
    return await db
      .update(notifications)
      .set({
        status: "read",
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.status, "unread")
        )
      )
      .returning();
  }

  // ===== ADDITIONAL NOTIFICATION HELPER METHODS =====

  async getUsersByRole(role: string) {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, role));
  }

  async getAllActiveUsers() {
    return await db
      .select()
      .from(users)
      .where(eq(users.status, 'active'));
  }

  async getPaymentsDueBefore(date: Date) {
    return await db
      .select()
      .from(paymentSchedules)
      .where(
        and(
          lte(paymentSchedules.dueDate, date),
          eq(paymentSchedules.status, 'pending')
        )
      );
  }

  async getOverduePayments(currentDate: Date) {
    return await db
      .select()
      .from(paymentSchedules)
      .where(
        and(
          lt(paymentSchedules.dueDate, currentDate),
          eq(paymentSchedules.status, 'pending')
        )
      );
  }

  async getNotificationByPaymentReminder(paymentId: number) {
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.type, 'payment_due_reminder'),
          sql`notifications.data->>'paymentId' = ${paymentId.toString()}`
        )
      )
      .limit(1);
  }

  async getCreditInfoByUser(userId: number) {
    try {
      // Get approved credit applications for user
      const creditApplications = await this.getCreditApplicationsByUser(userId);
      const approvedApplications = creditApplications.filter(app => 
        app.financialStatus === 'approved' && 
        (app.adminStatus === 'admin_finalized' || app.adminStatus === 'finalized')
      );

      if (approvedApplications.length === 0) {
        return { totalCredit: 0, usedCredit: 0, availableCredit: 0 };
      }

      // Calculate total credit limit
      const totalCredit = approvedApplications.reduce((sum, app) => {
        const creditLimit = app.finalCreditLimit ? 
          parseFloat(app.finalCreditLimit) : 
          parseFloat(app.requestedAmount || '0');
        return sum + creditLimit;
      }, 0);

      // Get user's imports and calculate used credit
      const imports = await this.getImportsByUser(userId);
      const approvedIds = approvedApplications.map(app => app.id);
      
      const activeImports = imports.filter(imp => {
        const isActiveStatus = imp.status !== 'cancelado' && 
                              imp.status !== 'cancelled' &&
                              imp.status !== 'planejamento';
        const hasLinkedCredit = imp.creditApplicationId && approvedIds.includes(imp.creditApplicationId);
        return isActiveStatus && hasLinkedCredit;
      });

      const usedCredit = activeImports.reduce((sum, imp) => {
        return sum + parseFloat(imp.totalValue || '0');
      }, 0);

      return {
        totalCredit,
        usedCredit,
        availableCredit: Math.max(0, totalCredit - usedCredit)
      };
    } catch (error) {
      console.error('Error getting credit info for user:', error);
      return { totalCredit: 0, usedCredit: 0, availableCredit: 0 };
    }
  }

  // Helper function to create notifications for credit events
  async notifyCreditStatusChange(
    userId: number,
    applicationId: number,
    newStatus: string,
    additionalData?: any
  ) {
    const statusMessages = {
      approved: {
        title: "Crédito Aprovado!",
        message: `Sua solicitação de crédito #${applicationId} foi aprovada. Você já pode criar importações.`,
        priority: "high",
      },
      rejected: {
        title: "Solicitação de Crédito Rejeitada",
        message: `Sua solicitação de crédito #${applicationId} foi rejeitada. Entre em contato conosco para mais informações.`,
        priority: "high",
      },
      under_review: {
        title: "Análise em Andamento",
        message: `Sua solicitação de crédito #${applicationId} está sendo analisada por nossa equipe.`,
        priority: "normal",
      },
      needs_documents: {
        title: "Documentos Necessários",
        message: `Documentos adicionais são necessários para sua solicitação de crédito #${applicationId}.`,
        priority: "high",
      },
      pre_approved: {
        title: "Crédito Pré-Aprovado",
        message: `Sua solicitação de crédito #${applicationId} foi pré-aprovada e enviada para análise final.`,
        priority: "normal",
      },
      submitted_to_financial: {
        title: "Enviado à Financeira",
        message: `Sua solicitação de crédito #${applicationId} foi enviada para análise financeira final.`,
        priority: "normal",
      },
      admin_finalized: {
        title: "Crédito Finalizado",
        message: `Os termos finais do seu crédito #${applicationId} foram definidos e estão disponíveis para consulta.`,
        priority: "high",
      },
    };

    const config = statusMessages[newStatus as keyof typeof statusMessages];
    if (config) {
      await this.createNotification({
        userId,
        type: "credit_status_change",
        title: config.title,
        message: config.message,
        priority: config.priority,
        data: {
          applicationId,
          status: newStatus,
          ...additionalData,
        },
      });
    }
  }

  // New method for message notifications
  async notifyNewMessage(
    userId: number,
    applicationId: number,
    messageType: string,
    senderRole: string
  ) {
    const messageTypes = {
      observation: {
        title: "Nova Observação Administrativa",
        message: `Nova observação recebida para crédito #${applicationId}. Verifique os detalhes.`,
      },
      document_request: {
        title: "Documentos Solicitados",
        message: `Novos documentos foram solicitados para crédito #${applicationId}. Envie o quanto antes.`,
      },
      analysis_note: {
        title: "Nova Nota de Análise",
        message: `Nova nota de análise disponível para crédito #${applicationId}.`,
      },
    };

    const config = messageTypes[messageType as keyof typeof messageTypes];
    if (config) {
      await this.createNotification({
        userId,
        type: "new_message",
        title: config.title,
        message: config.message,
        priority: messageType === 'document_request' ? "high" : "normal",
        data: {
          applicationId,
          messageType,
          senderRole,
        },
      });
    }
  }

  // Method for document-related notifications
  async notifyDocumentStatus(
    userId: number,
    applicationId: number,
    documentsNeeded: number,
    documentsUploaded: number
  ) {
    if (documentsNeeded > documentsUploaded) {
      await this.createNotification({
        userId,
        type: "documents_pending",
        title: "Documentos Pendentes",
        message: `Você possui ${documentsNeeded - documentsUploaded} documento(s) pendente(s) para crédito #${applicationId}.`,
        priority: "high",
        data: {
          applicationId,
          documentsNeeded,
          documentsUploaded,
          documentsPending: documentsNeeded - documentsUploaded,
        },
      });
    }
  }

  // ===== ADMIN DASHBOARD METRICS =====

  async getAdminDashboardMetrics(): Promise<{
    totalImporters: number;
    totalApplications: number;
    applicationsByStatus: { [key: string]: number };
    totalCreditVolume: number;
    approvedCreditVolume: number;
    totalImports: number;
    totalSuppliers: number;
    recentActivity: any[];
  }> {
    const allUsers = await this.getAllUsers();
    const allApplications = await this.getAllCreditApplications();
    const allImports = await this.getAllImports();
    const allSuppliers = await this.getAllSuppliers();

    const totalImporters = allUsers.filter(u => u.role === 'importer').length;
    const totalApplications = allApplications.length;

    // Mapear status combinados financeiro + admin para labels mais claros
    const applicationsByStatus = allApplications.reduce((acc, app) => {
      let displayStatus = app.status;

      // Para aplicações aprovadas financeiramente, mostrar status admin
      if (app.financialStatus === 'approved') {
        if (app.adminStatus === 'admin_finalized') {
          displayStatus = 'approved';
        } else {
          displayStatus = 'under_review';
        }
      } else if (app.preAnalysisStatus === 'pre_approved') {
        displayStatus = 'under_review';
      } else if (app.status === 'rejected') {
        displayStatus = 'rejected';
      } else {
        displayStatus = 'under_review';
      }

      acc[displayStatus] = (acc[displayStatus] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const totalCreditVolume = allApplications.reduce((sum, app) => {
      return sum + parseFloat(app.requestedAmount || "0");
    }, 0);

    const approvedCreditVolume = allApplications
      .filter(app => app.financialStatus === 'approved' && app.adminStatus === 'admin_finalized')
      .reduce((sum, app) => {
        return sum + parseFloat(app.finalCreditLimit || app.creditLimit || "0");
      }, 0);

    // Atividade recente com dados mais ricos
    const recentActivityData = allApplications
      .map(app => ({
        id: app.id,
        type: 'credit_application',
        companyName: app.legalCompanyName || 'Empresa não informada',
        amount: app.requestedAmount || '0',
        status: app.financialStatus === 'approved' && app.adminStatus === 'admin_finalized' ? 'approved' : 
                app.preAnalysisStatus === 'pre_approved' ? 'under_review' : 
                app.status,
        createdAt: app.createdAt || new Date(),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalImporters,
      totalApplications,
      applicationsByStatus,
      totalCreditVolume,
      approvedCreditVolume,
      totalImports: allImports.length,
      totalSuppliers: allSuppliers.length,
      recentActivity: recentActivityData,
    };
  }



  // Get imports by credit application
  async getImportsByCreditApplication(creditApplicationId: number) {
    return await db
      .select()
      .from(imports)
      .where(eq(imports.creditApplicationId, creditApplicationId));
  }

  // Create credit usage record
  async createCreditUsage(data: {
    creditApplicationId: number;
    importId: number;
    amountUsed: string;
    status: string;
  }) {
    return await db
      .insert(creditUsage)
      .values({
        creditApplicationId: data.creditApplicationId,
        importId: data.importId,
        amountUsed: data.amountUsed,
        status: data.status,
        confirmedAt: new Date(),
      })
      .returning();
  }



  // Get individual payment by ID
  async getPaymentById(paymentId: number) {
    const result = await db
      .select()
      .from(paymentSchedules)
      .where(eq(paymentSchedules.id, paymentId))
      .limit(1);
    return result[0] || null;
  }

  // Update payment details
  async updatePayment(paymentId: number, updates: any) {
    const result = await db
      .update(paymentSchedules)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(paymentSchedules.id, paymentId))
      .returning();
    return result[0];
  }

  // Delete payment
  async deletePayment(paymentId: number) {
    await db
      .delete(paymentSchedules)
      .where(eq(paymentSchedules.id, paymentId));
  }

  // Get all suppliers for a user (for admin or user's own suppliers)
  async getSuppliers(userId?: number) {
    if (userId) {
      return await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.userId, userId));
    } else {
      return await db
        .select()
        .from(suppliers);
    }
  }

  // ===== ADMIN IMPORTERS MANAGEMENT =====

  // Get all importers (admin only)
  async getAllImporters() {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.role, 'importer'))
      .orderBy(desc(users.createdAt));
    
    return result;
  }

  // Get importer details with additional information
  async getImporterDetails(importerId: number) {
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.id, importerId), eq(users.role, 'importer')))
      .limit(1);
    
    if (!result[0]) return null;

    // Get additional statistics
    const [creditAppsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(creditApplications)
      .where(eq(creditApplications.userId, importerId));

    const [importsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(imports)
      .where(eq(imports.userId, importerId));

    return {
      ...result[0],
      statistics: {
        creditApplications: creditAppsCount?.count || 0,
        imports: importsCount?.count || 0,
      }
    };
  }

  // Update user password
  async updateUserPassword(userId: number, hashedPassword: string) {
    await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Update user status
  async updateUserStatus(userId: number, status: string) {
    const result = await db
      .update(users)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    return result[0];
  }

  // Get importer activity logs (simplified for now)
  async getImporterActivityLogs(importerId: number) {
    // For now, return basic activity from credit applications and imports
    const creditApps = await db
      .select({
        id: creditApplications.id,
        type: sql<string>`'credit_application'`,
        action: creditApplications.status,
        createdAt: creditApplications.createdAt,
        description: sql<string>`CONCAT('Solicitação de Crédito #', ${creditApplications.id}, ' - ', ${creditApplications.status})`
      })
      .from(creditApplications)
      .where(eq(creditApplications.userId, importerId))
      .orderBy(desc(creditApplications.createdAt))
      .limit(10);

    const importsData = await db
      .select({
        id: imports.id,
        type: sql<string>`'import'`,
        action: imports.status,
        createdAt: imports.createdAt,
        description: sql<string>`CONCAT('Importação #', ${imports.id}, ' - ', ${imports.status})`
      })
      .from(imports)
      .where(eq(imports.userId, importerId))
      .orderBy(desc(imports.createdAt))
      .limit(10);

    return [...creditApps, ...importsData]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .map(item => ({
        action: item.action,
        description: item.description,
        timestamp: item.createdAt
      }));
  }

  // ===== PAYMENT SCHEDULES MANAGEMENT =====

  // Get all payment schedules (admin/financeira)
  async getAllPaymentSchedules() {
    return await db
      .select({
        id: paymentSchedules.id,
        importId: paymentSchedules.importId,
        paymentType: paymentSchedules.paymentType,
        dueDate: paymentSchedules.dueDate,
        amount: paymentSchedules.amount,
        currency: paymentSchedules.currency,
        status: paymentSchedules.status,
        installmentNumber: paymentSchedules.installmentNumber,
        totalInstallments: paymentSchedules.totalInstallments,
        createdAt: paymentSchedules.createdAt,
        updatedAt: paymentSchedules.updatedAt
      })
      .from(paymentSchedules)
      .orderBy(desc(paymentSchedules.dueDate));
  }

  // Get payment schedules by user
  async getPaymentSchedulesByUser(userId: number) {
    return await db
      .select({
        id: paymentSchedules.id,
        importId: paymentSchedules.importId,
        paymentType: paymentSchedules.paymentType,
        dueDate: paymentSchedules.dueDate,
        amount: paymentSchedules.amount,
        currency: paymentSchedules.currency,
        status: paymentSchedules.status,
        installmentNumber: paymentSchedules.installmentNumber,
        totalInstallments: paymentSchedules.totalInstallments,
        createdAt: paymentSchedules.createdAt,
        updatedAt: paymentSchedules.updatedAt
      })
      .from(paymentSchedules)
      .innerJoin(imports, eq(paymentSchedules.importId, imports.id))
      .where(eq(imports.userId, userId))
      .orderBy(desc(paymentSchedules.dueDate));
  }

  // Get payment schedule by ID
  async getPaymentScheduleById(scheduleId: number) {
    const result = await db
      .select()
      .from(paymentSchedules)
      .where(eq(paymentSchedules.id, scheduleId))
      .limit(1);
    
    return result[0];
  }

  // Delete payment schedule
  async deletePaymentSchedule(scheduleId: number) {
    return await db
      .delete(paymentSchedules)
      .where(eq(paymentSchedules.id, scheduleId))
      .returning();
  }

  // Update payment schedule
  async updatePaymentSchedule(scheduleId: number, updateData: any) {
    return await db
      .update(paymentSchedules)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(paymentSchedules.id, scheduleId))
      .returning();
  }

  // Create multiple payment schedules
  async createMultiplePaymentSchedules(schedules: any[]) {
    return await db
      .insert(paymentSchedules)
      .values(schedules.map(schedule => ({
        ...schedule,
        createdAt: new Date(),
        updatedAt: new Date()
      })))
      .returning();
  }

  // ===== DATABASE VIEWER METHODS =====
  
  async getAllUsers() {
    return await db.select().from(users);
  }

  async getAllCreditApplications() {
    return await db.select().from(creditApplications);
  }

  async getAllImports() {
    return await db.select().from(imports);
  }

  async getAllSuppliers() {
    return await db.select().from(suppliers);
  }

  async getAllPaymentSchedules() {
    return await db.select().from(paymentSchedules);
  }
}

export const storage = new DatabaseStorage();