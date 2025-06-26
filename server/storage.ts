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
import { eq, desc, and, inArray, getTableColumns, or, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export class DatabaseStorage {
  // ===== USER OPERATIONS =====

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByCnpj(cnpj: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.cnpj, cnpj)).limit(1);
    return result[0];
  }

  async createUser(insertUser: Omit<InsertUser, 'confirmPassword'>): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
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

  // ===== CREDIT APPLICATION OPERATIONS =====

  async createCreditApplication(application: InsertCreditApplication): Promise<CreditApplication> {
    const [creditApp] = await db
      .insert(creditApplications)
      .values(application)
      .returning();
    return creditApp;
  }

  async getCreditApplicationsByUser(userId: number): Promise<CreditApplication[]> {
    return await db
      .select()
      .from(creditApplications)
      .where(eq(creditApplications.userId, userId))
      .orderBy(desc(creditApplications.createdAt));
  }

  async getCreditApplication(id: number): Promise<CreditApplication | undefined> {
    const result = await db
      .select()
      .from(creditApplications)
      .where(eq(creditApplications.id, id))
      .limit(1);
    return result[0];
  }

  async updateCreditApplicationStatus(id: number, status: string, reviewData?: any): Promise<CreditApplication> {
    const [creditApp] = await db
      .update(creditApplications)
      .set({ 
        status,
        ...reviewData,
        updatedAt: new Date()
      })
      .where(eq(creditApplications.id, id))
      .returning();
    return creditApp;
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
    return await db
      .select()
      .from(imports)
      .where(eq(imports.userId, userId))
      .orderBy(desc(imports.createdAt));
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
    return await db.select().from(creditApplications).orderBy(desc(creditApplications.createdAt));
  }

  async getAllImports(): Promise<Import[]> {
    return await db.select().from(imports).orderBy(desc(imports.createdAt));
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
    const activeImports = await db
      .select()
      .from(imports)
      .where(
        and(
          eq(imports.creditApplicationId, creditApplicationId),
          inArray(imports.status, ["planejamento", "producao", "entregue_agente", "transporte_maritimo", "transporte_aereo", "desembaraco", "transporte_nacional"])
        )
      );

    // Calculate total used credit from active imports (only the financed amount, excluding down payment)
    const usedCredit = activeImports.reduce((total, importRecord) => {
      const importValue = parseFloat(importRecord.totalValue || "0");
      const downPaymentPercent = parseFloat(application.finalDownPayment || "30");
      const financedAmount = importValue * (1 - downPaymentPercent / 100);
      return total + financedAmount;
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

  async releaseCredit(creditApplicationId: number, importId: number) {
    return await db
      .delete(creditUsage)
      .where(
        and(
          eq(creditUsage.creditApplicationId, creditApplicationId),
          eq(creditUsage.importId, importId)
        )
      );
  }

  // Generate payment schedule for import based on credit terms
  async generatePaymentSchedule(importId: number, totalValue: string, creditApplicationId: number) {
    // Get credit application to fetch payment terms
    const creditApp = await this.getCreditApplication(creditApplicationId);
    if (!creditApp) throw new Error("Credit application not found");

    const totalAmount = parseFloat(totalValue);

    // Get down payment percentage from credit application (admin finalized or financial terms)
    const downPaymentPercent = creditApp.adminStatus === 'admin_finalized' 
      ? (parseFloat((creditApp as any).finalDownPayment || "30")) / 100
      : (parseFloat((creditApp as any).downPayment || "30")) / 100;

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
      .limit(1);
    return result[0];
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
    const hashedPassword = await bcrypt.hash(userData.password, 10);
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

    return await db
      .select()
      .from(imports)
      .where(inArray(imports.userId, userIds))
      .orderBy(desc(imports.createdAt));
  }

  // ===== NOTIFICATIONS =====

  async createNotification(notificationData: {
    userId: number;
    type: string;
    title: string;
    message: string;
    data?: any;
    priority?: string;
  }) {
    return await db
      .insert(notifications)
      .values({
        ...notificationData,
        priority: notificationData.priority || "normal",
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

  // Helper function to create notifications for credit events
  async notifyCreditStatusChange(
    userId: number,
    applicationId: number,
    newStatus: string,
    additionalData?: any
  ) {
    const statusMessages = {
      approved: {
        title: "Crédito Aprovado! 🎉",
        message: "Sua solicitação de crédito foi aprovada. Você já pode criar importações.",
        priority: "high",
      },
      rejected: {
        title: "Solicitação de Crédito",
        message: "Sua solicitação de crédito foi rejeitada. Entre em contato conosco para mais informações.",
        priority: "high",
      },
      under_review: {
        title: "Análise em Andamento",
        message: "Sua solicitação de crédito está sendo analisada por nossa equipe.",
        priority: "normal",
      },
      needs_documents: {
        title: "Documentos Necessários",
        message: "Documentos adicionais são necessários para sua solicitação de crédito.",
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
}

export const storage = new DatabaseStorage();