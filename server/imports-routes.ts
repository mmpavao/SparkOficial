import { Router } from 'express';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { db } from './db';
import { 
  imports, 
  importProducts, 
  importDocuments, 
  importTimeline, 
  importPayments,
  insertImportSchema,
  insertImportProductSchema,
  insertImportDocumentSchema,
  IMPORT_STATUSES
} from '../shared/imports-schema';
import { suppliers, users, creditApplications } from '../shared/schema';

// Import storage for database operations
import { storage } from './storage';

// Middleware functions - Updated to work with current auth system
const requireAuth = async (req: any, res: any, next: any) => {
  const sessionId = req.sessionID;
  const userId = req.session?.user?.id;
  
  console.log(`Auth check - Session ID: ${sessionId} User ID: ${userId}`);
  
  if (!userId) {
    console.log('Authentication failed - no session or user ID');
    return res.status(401).json({ message: 'Não autorizado' });
  }
  
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      console.log('Authentication failed - user not found');
      return res.status(401).json({ message: 'Não autorizado' });
    }
    
    console.log(`Authentication successful for user: ${userId} Role: ${user.role}`);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Erro interno' });
  }
};

const requireAdminOrFinanceira = async (req: any, res: any, next: any) => {
  const userId = req.session?.user?.id;
  
  if (!userId) {
    return res.status(401).json({ message: 'Não autorizado' });
  }
  
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: 'Não autorizado' });
    }
    
    if (!['admin', 'financeira', 'super_admin'].includes(user.role || '')) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ message: 'Erro interno' });
  }
};

export const importRoutes = Router();

// GET /api/imports - List imports with filtering and pagination
importRoutes.get('/imports', requireAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      cargoType, 
      supplierId, 
      search,
      minValue,
      maxValue,
      startDate,
      endDate
    } = req.query;

    // Get user info from session (using correct session structure)
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Não autorizado' });
    }

    const currentUser = await storage.getUser(userId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    const offset = (Number(page) - 1) * Number(limit);

    console.log(`🚀 IMPORTS ENDPOINT - User: ${userId}, Role: ${currentUser.role}`);

    // Direct database query to verify data exists
    const allImportsCount = await db.select({ count: count() }).from(imports);
    console.log(`🗄️ Total imports in database: ${allImportsCount[0].count}`);

    // Use direct SQL query to avoid TypeScript compilation issues
    let sqlQuery = `
      SELECT 
        i.*,
        s.company_name as supplier_company_name,
        s.contact_person as supplier_contact_person,
        u.company_name as importer_company_name,
        u.full_name as importer_full_name
      FROM imports i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN users u ON i.user_id = u.id
    `;

    const queryParams: any[] = [];
    const whereClauses: string[] = [];
    let paramIndex = 1;

    // Role-based access control - only filter by user for importers
    if (currentUser.role === 'importer') {
      whereClauses.push(`i.user_id = $${paramIndex}`);
      queryParams.push(userId);
      paramIndex++;
      console.log(`🔒 Filtering imports for importer: ${userId}`);
    } else {
      console.log(`🔓 Admin/Financeira access - showing ALL imports`);
    }

    // Apply additional filters
    if (status && status !== 'all') {
      whereClauses.push(`i.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    
    if (cargoType && cargoType !== 'all') {
      whereClauses.push(`i.cargo_type = $${paramIndex}`);
      queryParams.push(cargoType);
      paramIndex++;
    }
    
    if (supplierId && supplierId !== 'all') {
      whereClauses.push(`i.supplier_id = $${paramIndex}`);
      queryParams.push(Number(supplierId));
      paramIndex++;
    }

    if (search) {
      whereClauses.push(`(i.import_name ILIKE $${paramIndex} OR i.import_code ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Add WHERE clause if we have conditions
    if (whereClauses.length > 0) {
      sqlQuery += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Add ordering and pagination
    sqlQuery += ` ORDER BY i.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(Number(limit), offset);

    console.log(`📝 Executing SQL query for role ${currentUser.role}`);
    console.log(`🔧 Parameters: [${queryParams.join(', ')}]`);

    const importsResult = await db.execute(sql.raw(sqlQuery, queryParams));
    const importsData = importsResult.rows || [];

    console.log(`✅ Raw SQL query returned ${importsData.length} imports`);

    // Get total count with same conditions
    let countQuery = 'SELECT COUNT(*) as count FROM imports i';
    const countParams: any[] = [];
    let countParamIndex = 1;

    // Apply same WHERE conditions for count
    if (whereClauses.length > 0) {
      const countWhereClauses = whereClauses.map(clause => {
        if (clause.includes('ILIKE')) {
          return clause;
        }
        return clause.replace(/\$\d+/, `$${countParamIndex++}`);
      });
      countQuery += ' WHERE ' + countWhereClauses.join(' AND ');
      
      // Add parameters for count query (excluding LIMIT/OFFSET)
      for (let i = 0; i < queryParams.length - 2; i++) {
        countParams.push(queryParams[i]);
      }
    }

    const countResult = await db.execute(sql.raw(countQuery, countParams));
    const totalCount = Number(countResult.rows?.[0]?.count) || 0;

    console.log(`📊 Total count: ${totalCount}`);

    // Format the raw SQL results for frontend consumption
    const formattedImports = importsData.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      creditApplicationId: row.credit_application_id,
      importName: row.import_name,
      importNumber: row.import_number,
      importCode: row.import_code,
      cargoType: row.cargo_type,
      totalValue: row.total_value,
      currency: row.currency,
      status: row.status,
      paymentStatus: row.payment_status,
      supplierId: row.supplier_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Include supplier data if available
      supplier: row.supplier_company_name ? {
        companyName: row.supplier_company_name,
        contactPerson: row.supplier_contact_person
      } : null,
      // Include user data if available  
      user: row.importer_company_name ? {
        companyName: row.importer_company_name,
        fullName: row.importer_full_name
      } : null,
      products: [] // Will be populated in a separate query if needed
    }));

    console.log(`✅ Returning ${formattedImports.length} formatted imports to frontend`);

    // Return direct array for compatibility with existing frontend code
    res.json(formattedImports);

  } catch (error) {
    console.error('Error fetching imports:', error);
    res.status(500).json({ error: 'Failed to fetch imports' });
  }
});

// GET /api/imports/metrics - Get dashboard metrics
importRoutes.get('/imports/metrics', requireAuth, async (req, res) => {
  try {
    const currentUser = req.session.user;
    
    // Base condition for role-based access
    const baseCondition = currentUser?.role === 'importer' 
      ? eq(imports.userId, currentUser.id) 
      : undefined;

    // Get total imports
    const [{ count: totalImports }] = await db
      .select({ count: count() })
      .from(imports)
      .where(baseCondition);

    // Get active imports (not completed)
    const [{ count: activeImports }] = await db
      .select({ count: count() })
      .from(imports)
      .where(baseCondition ? 
        and(baseCondition, sql`${imports.status} != 'concluido'`) :
        sql`${imports.status} != 'concluido'`
      );

    // Get completed imports
    const [{ count: completedImports }] = await db
      .select({ count: count() })
      .from(imports)
      .where(baseCondition ? 
        and(baseCondition, eq(imports.status, 'concluido')) :
        eq(imports.status, 'concluido')
      );

    // Get total value
    const totalValueResult = await db
      .select({ total: sql`COALESCE(SUM(${imports.totalValue}::numeric), 0)` })
      .from(imports)
      .where(baseCondition);
    
    const totalValue = totalValueResult[0]?.total || 0;

    // Get status distribution
    const statusDistribution = await db
      .select({
        status: imports.status,
        count: count()
      })
      .from(imports)
      .where(baseCondition)
      .groupBy(imports.status);

    // Get planning stage imports
    const [{ count: planningImports }] = await db
      .select({ count: count() })
      .from(imports)
      .where(baseCondition ? 
        and(baseCondition, eq(imports.status, 'planejamento')) :
        eq(imports.status, 'planejamento')
      );

    // Get production stage imports
    const [{ count: productionImports }] = await db
      .select({ count: count() })
      .from(imports)
      .where(baseCondition ? 
        and(baseCondition, eq(imports.status, 'producao')) :
        eq(imports.status, 'producao')
      );

    // Get transport stage imports
    const [{ count: transportImports }] = await db
      .select({ count: count() })
      .from(imports)
      .where(baseCondition ? 
        and(baseCondition, sql`${imports.status} IN ('transporte_maritimo', 'transporte_aereo', 'transporte_nacional')`) :
        sql`${imports.status} IN ('transporte_maritimo', 'transporte_aereo', 'transporte_nacional')`
      );

    // Calculate success rate (completed / total * 100)
    const successRate = totalImports > 0 ? (completedImports / totalImports * 100) : 0;

    res.json({
      totalImports,
      activeImports,
      completedImports,
      totalValue: totalValue.toString(),
      planningImports,
      productionImports,
      transportImports,
      successRate: Math.round(successRate),
      statusDistribution
    });

  } catch (error) {
    console.error('Error fetching import metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// POST /api/imports - Create new import
importRoutes.post('/imports', requireAuth, async (req, res) => {
  try {
    const currentUser = req.session.user;
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate input data
    const validatedData = insertImportSchema.parse({
      ...req.body,
      userId: currentUser.id
    });

    // Create import record
    const [newImport] = await db.insert(imports).values({
      userId: currentUser.id,
      supplierId: validatedData.supplierId,
      creditApplicationId: validatedData.creditApplicationId,
      importName: validatedData.importName,
      importCode: validatedData.importCode,
      cargoType: validatedData.cargoType,
      origin: validatedData.origin,
      destination: validatedData.destination,
      transportMethod: validatedData.transportMethod,
      totalValue: validatedData.totalValue,
      currency: validatedData.currency || 'USD',
      incoterms: validatedData.incoterms,
      status: 'planejamento',
      containerNumber: validatedData.containerNumber,
      sealNumber: validatedData.sealNumber,
      estimatedArrival: validatedData.estimatedArrival
    }).returning();

    // Create products for LCL cargo
    if (validatedData.cargoType === 'LCL' && req.body.products && req.body.products.length > 0) {
      const productInserts = req.body.products.map((product: any) => ({
        importId: newImport.id,
        productName: product.productName,
        description: product.description,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        totalValue: product.totalValue,
        hsCode: product.hsCode,
        weight: product.weight,
        dimensions: product.dimensions
      }));

      await db.insert(importProducts).values(productInserts);
    }

    // Create initial timeline entry
    await db.insert(importTimeline).values({
      importId: newImport.id,
      status: 'planejamento',
      changedBy: currentUser.id,
      notes: 'Importação criada',
      automaticChange: false
    });

    res.status(201).json(newImport);

  } catch (error) {
    console.error('Error creating import:', error);
    res.status(400).json({ error: 'Failed to create import' });
  }
});

// GET /api/imports/:id - Get import details
importRoutes.get('/imports/:id', requireAuth, async (req, res) => {
  try {
    const importId = Number(req.params.id);
    const currentUser = req.session.user;

    // Get import with related data
    const importQuery = db
      .select({
        import: imports,
        supplier: suppliers,
        user: {
          id: users.id,
          companyName: users.companyName,
          fullName: users.fullName
        }
      })
      .from(imports)
      .leftJoin(suppliers, eq(imports.supplierId, suppliers.id))
      .leftJoin(users, eq(imports.userId, users.id))
      .where(eq(imports.id, importId));

    const [importData] = await importQuery;

    if (!importData) {
      return res.status(404).json({ error: 'Import not found' });
    }

    // Check access permissions
    if (
      currentUser?.role === 'importer' && 
      importData.import.userId !== currentUser.id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get products
    const products = await db
      .select()
      .from(importProducts)
      .where(eq(importProducts.importId, importId));

    // Get documents
    const documents = await db
      .select()
      .from(importDocuments)
      .where(eq(importDocuments.importId, importId));

    // Get timeline
    const timeline = await db
      .select({
        timeline: importTimeline,
        user: {
          id: users.id,
          fullName: users.fullName
        }
      })
      .from(importTimeline)
      .leftJoin(users, eq(importTimeline.changedBy, users.id))
      .where(eq(importTimeline.importId, importId))
      .orderBy(desc(importTimeline.changedAt));

    // Get payments
    const payments = await db
      .select()
      .from(importPayments)
      .where(eq(importPayments.importId, importId))
      .orderBy(importPayments.dueDate);

    res.json({
      ...importData.import,
      supplier: importData.supplier,
      user: importData.user,
      products,
      documents,
      timeline,
      payments
    });

  } catch (error) {
    console.error('Error fetching import details:', error);
    res.status(500).json({ error: 'Failed to fetch import details' });
  }
});

// PUT /api/imports/:id - Update import
importRoutes.put('/imports/:id', requireAuth, async (req, res) => {
  try {
    const importId = Number(req.params.id);
    const currentUser = req.session.user;

    // Check if import exists and user has permission
    const [existingImport] = await db
      .select()
      .from(imports)
      .where(eq(imports.id, importId));

    if (!existingImport) {
      return res.status(404).json({ error: 'Import not found' });
    }

    // Check permissions
    if (
      currentUser?.role === 'importer' && 
      existingImport.userId !== currentUser.id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow editing imports in planning status
    if (existingImport.status !== 'planejamento' && currentUser?.role === 'importer') {
      return res.status(400).json({ error: 'Only imports in planning status can be edited' });
    }

    // Update import
    const [updatedImport] = await db
      .update(imports)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(imports.id, importId))
      .returning();

    // Update products if provided
    if (req.body.products) {
      // Delete existing products
      await db.delete(importProducts).where(eq(importProducts.importId, importId));
      
      // Insert new products
      if (req.body.products.length > 0) {
        const productInserts = req.body.products.map((product: any) => ({
          importId: importId,
          productName: product.productName,
          description: product.description,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          totalValue: product.totalValue,
          hsCode: product.hsCode,
          weight: product.weight,
          dimensions: product.dimensions
        }));

        await db.insert(importProducts).values(productInserts);
      }
    }

    // Create timeline entry
    await db.insert(importTimeline).values({
      importId: importId,
      status: updatedImport.status,
      changedBy: currentUser?.id,
      notes: 'Importação atualizada',
      automaticChange: false
    });

    res.json(updatedImport);

  } catch (error) {
    console.error('Error updating import:', error);
    res.status(400).json({ error: 'Failed to update import' });
  }
});

// DELETE /api/imports/:id - Cancel import
importRoutes.delete('/imports/:id', requireAuth, async (req, res) => {
  try {
    const importId = Number(req.params.id);
    const currentUser = req.session.user;

    // Check if import exists
    const [existingImport] = await db
      .select()
      .from(imports)
      .where(eq(imports.id, importId));

    if (!existingImport) {
      return res.status(404).json({ error: 'Import not found' });
    }

    // Check permissions
    if (
      currentUser?.role === 'importer' && 
      existingImport.userId !== currentUser.id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update status to cancelled instead of deleting
    const [cancelledImport] = await db
      .update(imports)
      .set({
        status: 'cancelado',
        updatedAt: new Date()
      })
      .where(eq(imports.id, importId))
      .returning();

    // Create timeline entry
    await db.insert(importTimeline).values({
      importId: importId,
      status: 'cancelado',
      changedBy: currentUser?.id,
      notes: 'Importação cancelada',
      automaticChange: false
    });

    res.json({ message: 'Import cancelled successfully' });

  } catch (error) {
    console.error('Error cancelling import:', error);
    res.status(500).json({ error: 'Failed to cancel import' });
  }
});

// POST /api/imports/:id/documents - Upload document
importRoutes.post('/imports/:id/documents', requireAuth, async (req, res) => {
  try {
    const importId = Number(req.params.id);
    const currentUser = req.session.user;

    // Validate input
    const validatedData = insertImportDocumentSchema.parse({
      ...req.body,
      importId,
      uploadedBy: currentUser?.id
    });

    const [newDocument] = await db.insert(importDocuments).values({
      importId,
      documentType: validatedData.documentType,
      fileName: validatedData.fileName,
      fileData: validatedData.fileData,
      isMandatory: validatedData.isMandatory,
      status: 'uploaded',
      notes: validatedData.notes,
      uploadedBy: currentUser?.id
    }).returning();

    res.status(201).json(newDocument);

  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(400).json({ error: 'Failed to upload document' });
  }
});

// PUT /api/imports/:id/status - Update import status
importRoutes.put('/imports/:id/status', requireAuth, async (req, res) => {
  try {
    const importId = Number(req.params.id);
    const { status, notes } = req.body;
    const currentUser = req.session.user;

    // Validate status
    const validStatuses = Object.values(IMPORT_STATUSES);
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get current import
    const [currentImport] = await db
      .select()
      .from(imports)
      .where(eq(imports.id, importId));

    if (!currentImport) {
      return res.status(404).json({ error: 'Import not found' });
    }

    // Update status
    const [updatedImport] = await db
      .update(imports)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(imports.id, importId))
      .returning();

    // Create timeline entry
    await db.insert(importTimeline).values({
      importId,
      status,
      previousStatus: currentImport.status,
      changedBy: currentUser?.id,
      notes: notes || `Status alterado para ${status}`,
      automaticChange: false
    });

    res.json(updatedImport);

  } catch (error) {
    console.error('Error updating import status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Admin routes
importRoutes.get('/admin/imports', requireAdminOrFinanceira, async (req, res) => {
  try {
    console.log(`Admin fetching all imports - User: ${req.session.userId}, Role: ${req.user?.role}`);
    
    // Use the existing storage method to get all imports with user data
    const importsData = await storage.getAllImports();
    
    console.log(`Found ${importsData.length} imports for admin view`);
    
    // Get user data for each import to add company names
    const allUsers = await storage.getAllUsers();
    const enrichedImports = importsData.map(importItem => {
      const user = allUsers.find(u => u.id === importItem.userId);
      return {
        ...importItem,
        companyName: user?.companyName || 'Empresa não encontrada',
        userFullName: user?.fullName || 'Nome não encontrado'
      };
    });

    console.log(`Returning ${enrichedImports.length} enriched imports`);
    res.json(enrichedImports);

  } catch (error) {
    console.error('Error fetching admin imports:', error);
    res.status(500).json({ error: 'Failed to fetch imports', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

importRoutes.get('/admin/imports/:id', requireAdminOrFinanceira, async (req, res) => {
  try {
    const importId = Number(req.params.id);
    console.log(`Admin fetching import ${importId} - User: ${req.session.userId}, Role: ${req.user?.role}`);

    // Use existing storage method to get import details
    const importData = await storage.getImport(importId);

    if (!importData) {
      console.log(`Import ${importId} not found`);
      return res.status(404).json({ error: 'Import not found' });
    }

    // Get user data for the import
    const user = await storage.getUser(importData.userId);
    const enrichedImportData = {
      ...importData,
      companyName: user?.companyName || 'Empresa não encontrada',
      userFullName: user?.fullName || 'Nome não encontrado'
    };

    console.log(`Returning import ${importId} details`);
    res.json(enrichedImportData);

  } catch (error) {
    console.error('Error fetching admin import details:', error);
    res.status(500).json({ error: 'Failed to fetch import details', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});