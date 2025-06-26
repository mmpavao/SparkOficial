import { db } from "./db";
import { users, creditApplications, imports, suppliers } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// Diagnostic functions to test production environment
export class ProductionDiagnostics {
  
  static async testDatabaseConnection(): Promise<{ status: string; details: any }> {
    try {
      console.log("🔍 Testing database connection...");
      
      // Test basic connection
      const result = await db.execute(sql`SELECT 1 as test`);
      console.log("✅ Basic database connection: OK");
      
      // Test table existence
      const tableTests = await Promise.allSettled([
        db.select().from(users).limit(1),
        db.select().from(creditApplications).limit(1),
        db.select().from(imports).limit(1),
        db.select().from(suppliers).limit(1)
      ]);
      
      const tablesStatus = {
        users: tableTests[0].status === 'fulfilled' ? 'OK' : 'ERROR',
        creditApplications: tableTests[1].status === 'fulfilled' ? 'OK' : 'ERROR',
        imports: tableTests[2].status === 'fulfilled' ? 'OK' : 'ERROR',
        suppliers: tableTests[3].status === 'fulfilled' ? 'OK' : 'ERROR'
      };
      
      console.log("📊 Tables status:", tablesStatus);
      
      // Count records in each table
      const counts = await Promise.allSettled([
        db.execute(sql`SELECT COUNT(*) as count FROM users`),
        db.execute(sql`SELECT COUNT(*) as count FROM credit_applications`),
        db.execute(sql`SELECT COUNT(*) as count FROM imports`),
        db.execute(sql`SELECT COUNT(*) as count FROM suppliers`)
      ]);
      
      const recordCounts = {
        users: counts[0].status === 'fulfilled' ? counts[0].value[0]?.count : 'ERROR',
        creditApplications: counts[1].status === 'fulfilled' ? counts[1].value[0]?.count : 'ERROR',
        imports: counts[2].status === 'fulfilled' ? counts[2].value[0]?.count : 'ERROR',
        suppliers: counts[3].status === 'fulfilled' ? counts[3].value[0]?.count : 'ERROR'
      };
      
      console.log("📈 Record counts:", recordCounts);
      
      return {
        status: 'SUCCESS',
        details: {
          connection: 'OK',
          tables: tablesStatus,
          counts: recordCounts,
          environment: process.env.NODE_ENV,
          databaseUrl: process.env.DATABASE_URL ? 'SET' : 'MISSING'
        }
      };
      
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      return {
        status: 'FAILED',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : null,
          environment: process.env.NODE_ENV,
          databaseUrl: process.env.DATABASE_URL ? 'SET' : 'MISSING'
        }
      };
    }
  }
  
  static async testUserAuthentication(userId?: number): Promise<{ status: string; details: any }> {
    try {
      console.log("🔐 Testing user authentication...");
      
      if (!userId) {
        // Get first user for testing
        const users_list = await db.select().from(users).limit(1);
        if (users_list.length === 0) {
          return {
            status: 'NO_USERS',
            details: { message: 'No users found in database' }
          };
        }
        userId = users_list[0].id;
      }
      
      // Test user retrieval
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (user.length === 0) {
        return {
          status: 'USER_NOT_FOUND',
          details: { userId, message: 'User not found' }
        };
      }
      
      console.log("✅ User authentication test: OK");
      
      return {
        status: 'SUCCESS',
        details: {
          userId: user[0].id,
          email: user[0].email,
          role: user[0].role,
          status: user[0].status
        }
      };
      
    } catch (error) {
      console.error("❌ User authentication test failed:", error);
      return {
        status: 'FAILED',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId
        }
      };
    }
  }
  
  static async testDataQueries(): Promise<{ status: string; details: any }> {
    try {
      console.log("📋 Testing data queries...");
      
      // Test getting credit applications for first user
      const users_list = await db.select().from(users).limit(1);
      if (users_list.length === 0) {
        return {
          status: 'NO_USERS',
          details: { message: 'No users to test with' }
        };
      }
      
      const testUserId = users_list[0].id;
      
      // Test credit applications query
      const creditApps = await db.select()
        .from(creditApplications)
        .where(eq(creditApplications.userId, testUserId));
      
      // Test imports query  
      const userImports = await db.select()
        .from(imports)
        .where(eq(imports.userId, testUserId));
      
      // Test suppliers query
      const userSuppliers = await db.select()
        .from(suppliers)
        .where(eq(suppliers.userId, testUserId));
      
      console.log("✅ Data queries test: OK");
      
      return {
        status: 'SUCCESS',
        details: {
          testUserId,
          creditApplications: creditApps.length,
          imports: userImports.length,
          suppliers: userSuppliers.length,
          sampleCreditApp: creditApps[0] || null,
          sampleImport: userImports[0] || null,
          sampleSupplier: userSuppliers[0] || null
        }
      };
      
    } catch (error) {
      console.error("❌ Data queries test failed:", error);
      return {
        status: 'FAILED',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
  
  static async runFullDiagnostic(): Promise<any> {
    console.log("🚀 Starting full production diagnostic...");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Database URL set:", !!process.env.DATABASE_URL);
    
    const results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: await this.testDatabaseConnection(),
      authentication: await this.testUserAuthentication(),
      dataQueries: await this.testDataQueries()
    };
    
    console.log("📊 Full diagnostic results:", JSON.stringify(results, null, 2));
    
    return results;
  }
}