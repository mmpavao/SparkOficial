import express from 'express';
import { eq, and, desc, like, or, sql } from 'drizzle-orm';
import { db } from './db';
import { 
  imports, 
  importProducts, 
  importDocuments, 
  importTimeline,
  suppliers,
  users
} from '../shared/schema';
import { requireAuth } from './middleware/auth';
import { storage } from './storage';

const importRoutes = express.Router();

// GET /api/imports/operational/:id - Get operational import details
importRoutes.get('/operational/:id', async (req, res) => {
  try {
    const importId = Number(req.params.id);
    
    console.log(`🔍 Fetching operational import ${importId}`);

    // Get import with basic data only (no complex joins that might fail)
    const [importData] = await db
      .select()
      .from(imports)
      .where(eq(imports.id, importId));

    if (!importData) {
      console.log(`❌ Import ${importId} not found`);
      return res.status(404).json({ error: 'Import not found' });
    }

    // Verify it's an operational import (no creditApplicationId)
    if (importData.creditApplicationId) {
      console.log(`❌ Import ${importId} is not operational (has creditApplicationId)`);
      return res.status(400).json({ error: 'This is not an operational import' });
    }

    // Get products separately
    const products = await db
      .select()
      .from(importProducts)
      .where(eq(importProducts.importId, importId));

    // Build response with safe field mapping
    const response = {
      fullData: {
        ...importData,
        products: products || [],
        // Map database fields to expected frontend fields
        portOfLoading: importData.portOfLoading,
        portOfDischarge: importData.portOfDischarge,
        transportMethod: importData.transportMethod || 'maritimo',
        origin: importData.portOfLoading, // For backward compatibility
        destination: importData.portOfDischarge, // For backward compatibility
      },
      estimatedDelivery: importData.estimatedDelivery
    };

    console.log(`✅ Successfully fetched operational import ${importId}`);
    res.json(response);
  } catch (error) {
    console.error('Error fetching operational import:', error);
    res.status(500).json({ error: 'Failed to fetch import details' });
  }
});

// PUT /api/imports/operational/:id - Update operational import
importRoutes.put('/operational/:id', requireAuth, async (req, res) => {
  try {
    const importId = Number(req.params.id);
    const updateData = req.body;
    
    console.log(`🔄 Updating operational import ${importId}:`, updateData);

    // Verify import exists and is operational
    const [existingImport] = await db
      .select()
      .from(imports)
      .where(eq(imports.id, importId));

    if (!existingImport) {
      return res.status(404).json({ error: 'Import not found' });
    }

    if (existingImport.creditApplicationId) {
      return res.status(400).json({ error: 'This is not an operational import' });
    }

    // Update import data with safe field mapping
    const [updatedImport] = await db
      .update(imports)
      .set({
        importName: updateData.importName,
        cargoType: updateData.cargoType,
        totalValue: updateData.totalValue,
        currency: updateData.currency,
        incoterms: updateData.incoterms,
        containerNumber: updateData.containerNumber || null,
        sealNumber: updateData.sealNumber || null,
        weight: updateData.weight ? parseFloat(updateData.weight) : null,
        volume: updateData.volume ? parseFloat(updateData.volume) : null,
        transportMethod: updateData.transportMethod || 'maritimo',
        portOfLoading: updateData.origin || updateData.portOfLoading || null,
        portOfDischarge: updateData.destination || updateData.portOfDischarge || null,
        notes: updateData.notes || null,
        updatedAt: new Date()
      })
      .where(eq(imports.id, importId))
      .returning();

    console.log(`✅ Successfully updated operational import ${importId}`);
    res.json(updatedImport);
  } catch (error) {
    console.error('Error updating operational import:', error);
    res.status(500).json({ error: 'Failed to update import' });
  }
});

export { importRoutes };