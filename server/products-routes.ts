import { Router } from 'express';
import { storage } from './storage';
import { insertProductSchema, type InsertProduct } from '@shared/imports-schema';
import { z } from 'zod';

// Auth middleware - same as in routes.ts
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  next();
};

const router = Router();

// GET /api/products - Get all products for authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const products = await storage.getProductsByUserId(userId);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/products/:id - Get specific product
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ message: 'ID do produto inválido' });
    }

    const product = await storage.getProductById(productId, userId);
    
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/products - Create new product
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Validate request body
    const validationResult = insertProductSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Dados inválidos',
        errors: validationResult.error.errors
      });
    }

    const productData: InsertProduct = {
      ...validationResult.data,
      userId
    };

    // Check if NCM already exists for this user
    const existingProduct = await storage.getProductByNCM(productData.ncmCode, userId);
    if (existingProduct) {
      return res.status(400).json({ 
        message: 'Já existe um produto cadastrado com este código NCM' 
      });
    }

    const product = await storage.createProduct(productData);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ message: 'ID do produto inválido' });
    }

    // Check if product exists and belongs to user
    const existingProduct = await storage.getProductById(productId, userId);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Validate request body
    const validationResult = insertProductSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Dados inválidos',
        errors: validationResult.error.errors
      });
    }

    // Check if NCM is being changed and if it conflicts with another product
    if (validationResult.data.ncmCode !== existingProduct.ncmCode) {
      const conflictingProduct = await storage.getProductByNCM(validationResult.data.ncmCode, userId);
      if (conflictingProduct && conflictingProduct.id !== productId) {
        return res.status(400).json({ 
          message: 'Já existe outro produto cadastrado com este código NCM' 
        });
      }
    }

    const updatedProduct = await storage.updateProduct(productId, userId, validationResult.data);
    
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /api/products/:id - Delete (deactivate) product
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ message: 'ID do produto inválido' });
    }

    const success = await storage.deleteProduct(productId, userId);
    
    if (!success) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json({ message: 'Produto removido com sucesso' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/products/search/ncm/:ncm - Search product by NCM
router.get('/search/ncm/:ncm', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const ncmCode = req.params.ncm;
    
    if (!ncmCode || ncmCode.length < 8) {
      return res.status(400).json({ message: 'Código NCM deve ter pelo menos 8 dígitos' });
    }

    const product = await storage.getProductByNCM(ncmCode, userId);
    
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error searching product by NCM:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;