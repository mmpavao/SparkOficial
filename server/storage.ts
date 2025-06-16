import { 
  users, 
  creditApplications, 
  imports,
  suppliers,
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
import { eq, desc, and, getTableColumns } from "drizzle-orm";
import bcrypt from "bcrypt";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByCnpj(cnpj: string): Promise<User | undefined>;
  createUser(insertUser: Omit<InsertUser, 'confirmPassword'>): Promise<User>;
  
  // Credit application operations
  createCreditApplication(application: InsertCreditApplication): Promise<CreditApplication>;
  getCreditApplicationsByUser(userId: number): Promise<CreditApplication[]>;
  getCreditApplication(id: number): Promise<CreditApplication | undefined>;
  updateCreditApplicationStatus(id: number, status: string, reviewData?: any): Promise<CreditApplication>;
  updateCreditApplication(id: number, data: Partial<InsertCreditApplication>): Promise<CreditApplication>;
  
  // Import operations
  createImport(importData: InsertImport): Promise<Import>;
  getImportsByUser(userId: number): Promise<Import[]>;
  getImport(id: number): Promise<Import | undefined>;
  updateImportStatus(id: number, status: string, updateData?: any): Promise<Import>;
  
  // Supplier operations
  createSupplier(supplierData: InsertSupplier): Promise<Supplier>;
  getSuppliersByUser(userId: number): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllCreditApplications(): Promise<CreditApplication[]>;
  getAllImports(): Promise<Import[]>;
  getAllSuppliers(): Promise<Supplier[]>;
  
  // User management operations
  createUserByAdmin(userData: Omit<InsertUser, 'confirmPassword'>, createdBy: number): Promise<User>;
  updateUserRole(userId: number, role: string): Promise<User>;
  deactivateUser(userId: number): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByCnpj(cnpj: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.cnpj, cnpj));
    return user || undefined;
  }

  async createUser(insertUser: Omit<InsertUser, 'confirmPassword'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Credit application operations
  async createCreditApplication(application: InsertCreditApplication): Promise<CreditApplication> {
    const [creditApp] = await db
      .insert(creditApplications)
      .values([application])
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
    const [application] = await db
      .select()
      .from(creditApplications)
      .where(eq(creditApplications.id, id));
    return application || undefined;
  }

  async updateCreditApplicationStatus(id: number, status: string, reviewData?: any): Promise<CreditApplication> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (reviewData) {
      if (reviewData.reviewedBy) updateData.reviewedBy = reviewData.reviewedBy;
      if (reviewData.approvedAmount) updateData.approvedAmount = reviewData.approvedAmount;
      if (reviewData.interestRate) updateData.interestRate = reviewData.interestRate;
      if (reviewData.paymentTerms) updateData.paymentTerms = reviewData.paymentTerms;
      if (reviewData.notes) updateData.reviewNotes = reviewData.notes;
      updateData.reviewedAt = new Date();

      // Administrative analysis fields
      if (reviewData.preAnalysisStatus) updateData.preAnalysisStatus = reviewData.preAnalysisStatus;
      if (reviewData.riskLevel) updateData.riskLevel = reviewData.riskLevel;
      if (reviewData.analysisNotes) updateData.analysisNotes = reviewData.analysisNotes;
      if (reviewData.requestedDocuments) updateData.requestedDocuments = reviewData.requestedDocuments;
      if (reviewData.adminObservations) updateData.adminObservations = reviewData.adminObservations;
      if (reviewData.analyzedBy) updateData.analyzedBy = reviewData.analyzedBy;
      if (reviewData.analyzedBy) updateData.analyzedAt = new Date();
    }

    const [application] = await db
      .update(creditApplications)
      .set(updateData)
      .where(eq(creditApplications.id, id))
      .returning();
    return application;
  }

  async updateCreditApplication(id: number, data: any): Promise<CreditApplication> {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    const [application] = await db
      .update(creditApplications)
      .set(updateData)
      .where(eq(creditApplications.id, id))
      .returning();
    return application;
  }

  // Import operations
  async createImport(importData: InsertImport): Promise<Import> {
    // Convert estimatedDelivery string to Date if present
    const processedData = {
      ...importData,
      estimatedDelivery: importData.estimatedDelivery ? new Date(importData.estimatedDelivery) : null
    };
    
    const [importRecord] = await db
      .insert(imports)
      .values([processedData as any])
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
    const [importRecord] = await db
      .select()
      .from(imports)
      .where(eq(imports.id, id));
    return importRecord || undefined;
  }

  async updateImportStatus(id: number, status: string, updateData?: any): Promise<Import> {
    const data: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (updateData) {
      if (updateData.trackingNumber) data.trackingNumber = updateData.trackingNumber;
      if (updateData.customsStatus) data.customsStatus = updateData.customsStatus;
      if (updateData.estimatedDelivery) data.estimatedDelivery = updateData.estimatedDelivery;
      if (updateData.notes) data.notes = updateData.notes;
      if (updateData.documents) data.documents = updateData.documents;
    }

    const [importRecord] = await db
      .update(imports)
      .set(data)
      .where(eq(imports.id, id))
      .returning();
    return importRecord;
  }

  // Supplier operations
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
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier> {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    const [supplier] = await db
      .update(suppliers)
      .set(updateData)
      .where(eq(suppliers.id, id))
      .returning();
    return supplier;
  }

  async deleteSupplier(id: number): Promise<void> {
    await db
      .delete(suppliers)
      .where(eq(suppliers.id, id));
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllCreditApplications(): Promise<CreditApplication[]> {
    return await db.select().from(creditApplications).orderBy(desc(creditApplications.createdAt));
  }

  async getAllImports(): Promise<Import[]> {
    const result = await db
      .select({
        id: imports.id,
        userId: imports.userId,
        creditApplicationId: imports.creditApplicationId,
        supplierId: imports.supplierId,
        importName: imports.importName,
        importNumber: imports.importNumber,
        cargoType: imports.cargoType,
        containerNumber: imports.containerNumber,
        sealNumber: imports.sealNumber,
        products: imports.products,
        totalValue: imports.totalValue,
        currency: imports.currency,
        fobPrice: imports.fobPrice,
        cifPrice: imports.cifPrice,
        freightCost: imports.freightCost,
        insuranceCost: imports.insuranceCost,
        weight: imports.weight,
        volume: imports.volume,
        dimensions: imports.dimensions,
        shippingMethod: imports.shippingMethod,
        containerType: imports.containerType,
        incoterms: imports.incoterms,
        currentStage: imports.currentStage,
        status: imports.status,
        stageEstimativa: imports.stageEstimativa,
        stageInvoice: imports.stageInvoice,
        stageProducao: imports.stageProducao,
        stageEmbarque: imports.stageEmbarque,
        stageTransporte: imports.stageTransporte,
        stageAtracacao: imports.stageAtracacao,
        stageDesembaraco: imports.stageDesembaraco,
        stageTransporteTerrestre: imports.stageTransporteTerrestre,
        stageEntrega: imports.stageEntrega,
        estimatedDelivery: imports.estimatedDelivery,
        actualDelivery: imports.actualDelivery,
        invoiceDate: imports.invoiceDate,
        productionStartDate: imports.productionStartDate,
        shippingDate: imports.shippingDate,
        trackingNumber: imports.trackingNumber,
        bl_number: imports.bl_number,
        port_of_loading: imports.port_of_loading,
        port_of_discharge: imports.port_of_discharge,
        customs_status: imports.customs_status,
        customs_clearance_date: imports.customs_clearance_date,
        notes: imports.notes,
        createdAt: imports.createdAt,
        updatedAt: imports.updatedAt,
        companyName: users.companyName,
      })
      .from(imports)
      .leftJoin(users, eq(imports.userId, users.id))
      .orderBy(desc(imports.createdAt));
    
    return result as any[];
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    const result = await db
      .select({
        id: suppliers.id,
        userId: suppliers.userId,
        name: suppliers.name,
        email: suppliers.email,
        phone: suppliers.phone,
        address: suppliers.address,
        city: suppliers.city,
        province: suppliers.province,
        country: suppliers.country,
        businessLicense: suppliers.businessLicense,
        contactPerson: suppliers.contactPerson,
        website: suppliers.website,
        notes: suppliers.notes,
        createdAt: suppliers.createdAt,
        updatedAt: suppliers.updatedAt,
        companyName: users.companyName,
      })
      .from(suppliers)
      .leftJoin(users, eq(suppliers.userId, users.id))
      .orderBy(desc(suppliers.createdAt));
    
    return result as any[];
  }

  // User management operations
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
      .set({ role: "inactive", updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }
}

export const storage = new DatabaseStorage();