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
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

const requireAdminOrFinanceira = async (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    if (!['admin', 'financeira', 'super_admin'].includes(user.role || '')) {
      return res.status(403).json({ error: 'Admin or Financeira access required' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication error' });
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

    // Get user info from session (fix the user access issue)
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in session' });
    }

    const currentUser = await storage.getUser(userId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    const offset = (Number(page) - 1) * Number(limit);

    console.log(`🔍 IMPORTS DEBUG - User: ${userId}, Role: ${currentUser.role}`);

    // Direct database query to verify data exists
    const allImportsCount = await db.select({ count: count() }).from(imports);
    console.log(`📊 Total imports in database: ${allImportsCount[0].count}`);

    // Build query conditions
    let conditions: any[] = [];
    
    // Role-based access control - only filter by user for importers
    if (currentUser.role === 'importer') {
      conditions.push(eq(imports.userId, userId));
      console.log(`🔒 Filtering imports for importer: ${userId}`);
    } else {
      console.log(`🔓 Admin/Financeira access - showing all imports`);
    }

    // Apply filters
    if (status && status !== 'all') {
      conditions.push(eq(imports.status, status as string));
    }
    
    if (cargoType && cargoType !== 'all') {
      conditions.push(eq(imports.cargoType, cargoType as string));
    }
    
    if (supplierId && supplierId !== 'all') {
      conditions.push(eq(imports.supplierId, Number(supplierId)));
    }

    if (minValue) {
      conditions.push(sql`${imports.totalValue}::numeric >= ${Number(minValue)}`);
    }
    
    if (maxValue) {
      conditions.push(sql`${imports.totalValue}::numeric <= ${Number(maxValue)}`);
    }

    if (startDate) {
      conditions.push(sql`${imports.createdAt} >= ${new Date(startDate as string)}`);
    }
    
    if (endDate) {
      conditions.push(sql`${imports.createdAt} <= ${new Date(endDate as string)}`);
    }

    // Search functionality
    if (search) {
      conditions.push(
        sql`(${imports.importName} ILIKE ${'%' + search + '%'} OR 
             ${imports.importCode} ILIKE ${'%' + search + '%'})`
      );
    }

    // Execute raw SQL query to bypass ORM issues
    let whereClause = '';
    const params: any[] = [];
    
    if (currentUser.role === 'importer') {
      whereClause = 'WHERE i.user_id = $1';
      params.push(userId);
    }
    
    const rawQuery = `
      SELECT 
        i.*,
        s.id as supplier_id,
        s.company_name as supplier_company_name,
        s.contact_name as supplier_contact_name,
        s.email as supplier_email,
        u.id as user_id,
        u.company_name as user_company_name,
        u.full_name as user_full_name
      FROM imports i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN users u ON i.user_id = u.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ${Number(limit)} OFFSET ${offset}
    `;

    console.log(`🔍 Executing raw SQL query: ${rawQuery}`);
    console.log(`📝 Parameters: ${JSON.stringify(params)}`);
    
    const result = await db.execute(sql.raw(rawQuery, ...params));
    const importsData = result.rows;
    console.log(`🎯 Raw query returned ${importsData.length} imports`);

    // Get total count with raw SQL
    let countQuery = `SELECT COUNT(*) as count FROM imports i`;
    if (currentUser.role === 'importer') {
      countQuery += ` WHERE i.user_id = $1`;
    }
    
    const countResult = await db.execute({ 
      sql: countQuery, 
      args: currentUser.role === 'importer' ? [userId] : [] 
    });
    const totalCount = countResult.rows[0]?.count || 0;

    // Get products for each import if we have imports
    const importIds = importsData.map((item: any) => item.id);
    let productsData: any[] = [];
    
    if (importIds.length > 0) {
      const productsQuery = `
        SELECT * FROM import_products 
        WHERE import_id = ANY($1)
      `;
      const productsResult = await db.execute({ 
        sql: productsQuery, 
        args: [importIds] 
      });
      productsData = productsResult.rows;
    }

    // Group products by import ID
    const productsByImport = productsData.reduce((acc: any, product: any) => {
      if (!acc[product.import_id]) {
        acc[product.import_id] = [];
      }
      acc[product.import_id].push(product);
      return acc;
    }, {});

    // Format response to match frontend expectations
    const formattedImports = importsData.map((item: any) => ({
      // Main import data
      id: item.id,
      userId: item.user_id,
      creditApplicationId: item.credit_application_id,
      importName: item.import_name,
      importNumber: item.import_number,
      cargoType: item.cargo_type,
      totalValue: item.total_value,
      currency: item.currency,
      status: item.status,
      supplierId: item.supplier_id,
      shippingMethod: item.shipping_method,
      originPort: item.origin_port,
      destinationPort: item.destination_port,
      estimatedDeparture: item.estimated_departure,
      estimatedArrival: item.estimated_arrival,
      actualDeparture: item.actual_departure,
      actualArrival: item.actual_arrival,
      containerNumber: item.container_number,
      sealNumber: item.seal_number,
      trackingNumber: item.tracking_number,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      
      // Supplier data
      supplier: item.supplier_id ? {
        id: item.supplier_id,
        companyName: item.supplier_company_name,
        contactName: item.supplier_contact_name,
        email: item.supplier_email
      } : null,
      
      // User data  
      user: {
        id: item.user_id,
        companyName: item.user_company_name,
        fullName: item.user_full_name
      },
      
      // Products
      products: productsByImport[item.id] || []
    }));

    console.log(`✅ Returning ${formattedImports.length} properly formatted imports to frontend`);

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