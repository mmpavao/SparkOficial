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
import { eq, desc, and, inArray, getTableColumns, or } from "drizzle-orm";
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
          inArray(imports.status, ["planning", "in_transit", "production"])
        )
      );

    // Calculate total used credit from active imports
    const usedCredit = activeImports.reduce((total, importRecord) => {
      const importValue = parseFloat(importRecord.totalValue || "0");
      return total + importValue;
    }, 0);

    const availableCredit = creditLimit - usedCredit;

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
    const downPaymentPercent = 0.10; // 10% down payment
    const downPaymentAmount = totalAmount * downPaymentPercent;
    const remainingAmount = totalAmount - downPaymentAmount;

    // Parse payment terms (e.g., "30,60,90" days)
    const paymentTerms = creditApp.finalApprovedTerms || creditApp.approvedTerms || "30,60,90";
    const termsDays = paymentTerms.split(',').map(term => parseInt(term.trim()));
    const installmentAmount = remainingAmount / termsDays.length;

    const schedules = [];
    
    // Down payment - due immediately
    schedules.push({
      importId,
      paymentType: "down_payment",
      amount: downPaymentAmount.toFixed(2),
      currency: "USD",
      dueDate: new Date(), // Due immediately
      status: "pending",
      installmentNumber: null,
      totalInstallments: null
    });

    // Installments based on payment terms
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
        totalAmount: paymentData.totalAmount,
        downPaymentAmount: paymentData.downPaymentAmount,
        downPaymentDueDate: paymentData.downPaymentDueDate,
        finalPaymentAmount: paymentData.finalPaymentAmount,
        finalPaymentDueDate: paymentData.finalPaymentDueDate,
        adminFeeAmount: paymentData.adminFeeAmount,
        adminFeeRate: paymentData.adminFeeRate,
        status: "pending",
        createdAt: new Date(),
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
        createdBy,
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

    const applicationsByStatus = allApplications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const totalCreditVolume = allApplications.reduce((sum, app) => {
      return sum + parseFloat(app.requestedAmount || "0");
    }, 0);

    const approvedCreditVolume = allApplications
      .filter(app => app.status === 'approved')
      .reduce((sum, app) => {
        return sum + parseFloat(app.finalCreditLimit || app.creditLimit || "0");
      }, 0);

    const recentActivity = [
      ...allApplications.slice(0, 5).map(app => ({ type: 'credit_application', data: app })),
      ...allImports.slice(0, 5).map(imp => ({ type: 'import', data: imp })),
    ].sort((a, b) => {
      const dateA = new Date(a.data.createdAt);
      const dateB = new Date(b.data.createdAt);
      return dateB.getTime() - dateA.getTime();
    }).slice(0, 10);

    return {
      totalImporters,
      totalApplications,
      applicationsByStatus,
      totalCreditVolume,
      approvedCreditVolume,
      totalImports: allImports.length,
      totalSuppliers: allSuppliers.length,
      recentActivity,
    };
  }

  // Credit usage calculation
  async calculateAvailableCredit(creditApplicationId: number): Promise<{ used: number, available: number, limit: number }> {
    const application = await this.getCreditApplication(creditApplicationId);
    if (!application) throw new Error("Credit application not found");

    const creditLimit = parseFloat(application.finalCreditLimit || application.requestedAmount || "0");

    // Get imports linked to this credit application
    const linkedImports = await db
      .select()
      .from(imports)
      .where(eq(imports.creditApplicationId, creditApplicationId));

    // Calculate used credit from active imports
    const usedCredit = linkedImports
      .filter(imp => ['planning', 'in_transit', 'production'].includes(imp.status))
      .reduce((total, imp) => total + parseFloat(imp.totalValue || "0"), 0);

    const availableCredit = creditLimit - usedCredit;

    return {
      used: usedCredit,
      available: Math.max(0, availableCredit),
      limit: creditLimit
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

  // Create payment schedule for an import
  async createPaymentSchedule(importId: number, totalValue: number) {
    const downPayment = totalValue * 0.1; // 10% down payment
    const remainingAmount = totalValue - downPayment;
    const installmentAmount = remainingAmount / 3; // 3 equal installments

    const schedules = [
      {
        importId,
        paymentType: 'down_payment',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        amount: downPayment.toString(),
        currency: 'USD',
        status: 'pending',
        installmentNumber: 1,
        totalInstallments: 4,
      },
      {
        importId,
        paymentType: 'installment',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        amount: installmentAmount.toString(),
        currency: 'USD',
        status: 'pending',
        installmentNumber: 2,
        totalInstallments: 4,
      },
      {
        importId,
        paymentType: 'installment',
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        amount: installmentAmount.toString(),
        currency: 'USD',
        status: 'pending',
        installmentNumber: 3,
        totalInstallments: 4,
      },
      {
        importId,
        paymentType: 'installment',
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        amount: installmentAmount.toString(),
        currency: 'USD',
        status: 'pending',
        installmentNumber: 4,
        totalInstallments: 4,
      },
    ];

    return await db.insert(paymentSchedules).values(schedules).returning();
  }

  // Get payment schedules for an import
  async getPaymentSchedulesByImport(importId: number) {
    return await db
      .select()
      .from(paymentSchedules)
      .where(eq(paymentSchedules.importId, importId))
      .orderBy(paymentSchedules.dueDate);
  }
}

export const storage = new DatabaseStorage();