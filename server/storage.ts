import { 
  users, 
  creditApplications, 
  imports,
  type User, 
  type InsertUser,
  type CreditApplication,
  type InsertCreditApplication,
  type Import,
  type InsertImport,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
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
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllCreditApplications(): Promise<CreditApplication[]>;
  getAllImports(): Promise<Import[]>;
  
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
      if (reviewData.notes) updateData.notes = reviewData.notes;
      updateData.reviewedAt = new Date();
    }

    const [application] = await db
      .update(creditApplications)
      .set(updateData)
      .where(eq(creditApplications.id, id))
      .returning();
    return application;
  }

  // Import operations
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

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllCreditApplications(): Promise<CreditApplication[]> {
    return await db.select().from(creditApplications).orderBy(desc(creditApplications.createdAt));
  }

  async getAllImports(): Promise<Import[]> {
    return await db.select().from(imports).orderBy(desc(imports.createdAt));
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