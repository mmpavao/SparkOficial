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

// Middleware functions
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.user && !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

const requireAdminOrFinanceira = (req: any, res: any, next: any) => {
  if (!req.session.user && !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const userRole = req.session.user?.role;
  if (!['admin', 'financeira', 'super_admin'].includes(userRole)) {
    return res.status(403).json({ error: 'Admin or Financeira access required' });
  }
  next();
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

    const currentUser = req.session.user || { id: req.session.userId, role: 'importer' };
    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let conditions: any[] = [];
    
    // Role-based access control
    if (currentUser?.role === 'importer') {
      conditions.push(eq(imports.userId, currentUser.id));
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

    // Execute query with joins
    const query = db
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(imports.createdAt))
      .limit(Number(limit))
      .offset(offset);

    const importsData = await query;

    // Get total count for pagination
    const totalQuery = db
      .select({ count: count() })
      .from(imports)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const [{ count: totalCount }] = await totalQuery;

    // Get products for each import
    const importIds = importsData.map(item => item.import.id);
    let productsData: any[] = [];
    
    if (importIds.length > 0) {
      productsData = await db
        .select()
        .from(importProducts)
        .where(sql`${importProducts.importId} = ANY(${importIds})`);
    }

    // Group products by import ID
    const productsByImport = productsData.reduce((acc, product) => {
      if (!acc[product.importId]) {
        acc[product.importId] = [];
      }
      acc[product.importId].push(product);
      return acc;
    }, {} as Record<number, any[]>);

    // Format response
    const formattedImports = importsData.map(item => ({
      ...item.import,
      supplier: item.supplier,
      user: item.user,
      products: productsByImport[item.import.id] || []
    }));

    res.json({
      imports: formattedImports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit))
      }
    });

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
    // Get all imports for admin view
    const importsData = await db
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
      .orderBy(desc(imports.createdAt));

    res.json(importsData);

  } catch (error) {
    console.error('Error fetching admin imports:', error);
    res.status(500).json({ error: 'Failed to fetch imports' });
  }
});

importRoutes.get('/admin/imports/:id', requireAdminOrFinanceira, async (req, res) => {
  try {
    const importId = Number(req.params.id);

    // Get import with all related data
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

    // Get all related data
    const products = await db
      .select()
      .from(importProducts)
      .where(eq(importProducts.importId, importId));

    const documents = await db
      .select()
      .from(importDocuments)
      .where(eq(importDocuments.importId, importId));

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
    console.error('Error fetching admin import details:', error);
    res.status(500).json({ error: 'Failed to fetch import details' });
  }
});