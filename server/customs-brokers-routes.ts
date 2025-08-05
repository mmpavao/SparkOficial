import { Request, Response, Router } from "express";
import { z } from "zod";
import { storage } from "./storage";
// Define requireAuth middleware directly
const requireAuth = async (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Usuário não encontrado" });
    }
    
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    console.error("Error in auth middleware:", error);
    return res.status(500).json({ message: "Erro interno de autenticação" });
  }
};

const router = Router();

// Validation schemas
const createCustomsBrokerSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos"),
  registrationNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
  contactName: z.string().min(1, "Nome do contato é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  specialization: z.array(z.string()).optional(),
  servicesOffered: z.array(z.string()).optional(),
  portsOfOperation: z.array(z.string()).optional(),
  standardFeeStructure: z.any().optional(),
  minimumOrderValue: z.number().optional(),
  averageProcessingTime: z.number().optional()
});

// Get all active customs brokers
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const brokers = await storage.getCustomsBrokers();
    res.json(brokers);
  } catch (error) {
    console.error("Error fetching customs brokers:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Get customs broker by ID  
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const broker = await storage.getCustomsBrokerById(parseInt(id));
    
    if (!broker) {
      return res.status(404).json({ error: "Despachante não encontrado" });
    }
    
    res.json(broker);
  } catch (error) {
    console.error("Error fetching customs broker:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Create new customs broker
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = createCustomsBrokerSchema.parse(req.body);
    
    const broker = await storage.createCustomsBroker({
      ...validatedData,
      userId: req.session.userId!,
      isActive: true,
      isVerified: false,
      rating: "0",
      totalImportsProcessed: 0,
      successRate: "0"
    });
    
    res.status(201).json(broker);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Dados inválidos", 
        details: error.errors 
      });
    }
    
    console.error("Error creating customs broker:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Update customs broker
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Verify broker exists and user has permission
    const existingBroker = await storage.getCustomsBrokerById(parseInt(id));
    if (!existingBroker) {
      return res.status(404).json({ error: "Despachante não encontrado" });
    }
    
    // Only allow broker owner or admin to update
    if (existingBroker.userId !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    const broker = await storage.updateCustomsBroker(parseInt(id), updates);
    res.json(broker);
  } catch (error) {
    console.error("Error updating customs broker:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Get brokers for a specific importer
router.get("/importer/:importerId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { importerId } = req.params;
    
    // Verify user has permission to see this data
    if (parseInt(importerId) !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    const brokers = await storage.getImporterBrokers(parseInt(importerId));
    res.json(brokers);
  } catch (error) {
    console.error("Error fetching importer brokers:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Get clients for a specific broker
router.get("/broker/:brokerId/clients", requireAuth, async (req: Request, res: Response) => {
  try {
    const { brokerId } = req.params;
    
    // Verify user has permission to see this data
    const broker = await storage.getCustomsBrokerById(parseInt(brokerId));
    if (!broker) {
      return res.status(404).json({ error: "Despachante não encontrado" });
    }
    
    if (broker.userId !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    const clients = await storage.getBrokerClients(parseInt(brokerId));
    res.json(clients);
  } catch (error) {
    console.error("Error fetching broker clients:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Create client-broker relationship
router.post("/relationships", requireAuth, async (req: Request, res: Response) => {
  try {
    const { importerId, customsBrokerId, relationshipType = 'preferred' } = req.body;
    
    // Verify user has permission 
    if (importerId !== req.session.userId && req.session.role !== 'admin') {
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    const relationship = await storage.createClientBrokerRelationship({
      importerId,
      customsBrokerId,
      relationshipType,
      status: 'active',
      totalImportsHandled: 0,
      averageRating: "0"
    });
    
    res.status(201).json(relationship);
  } catch (error) {
    console.error("Error creating client-broker relationship:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Assign customs broker to import
router.post("/assign-to-import", requireAuth, async (req: Request, res: Response) => {
  try {
    const { importId, customsBrokerId } = req.body;
    
    if (!importId || !customsBrokerId) {
      return res.status(400).json({ error: "ID da importação e ID do despachante são obrigatórios" });
    }
    
    const updatedImport = await storage.assignCustomsBrokerToImport(
      importId, 
      customsBrokerId, 
      req.session.userId!
    );
    
    res.json(updatedImport);
  } catch (error) {
    console.error("Error assigning customs broker to import:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;