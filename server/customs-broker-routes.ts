import { Router } from 'express';
import { storage } from './storage';

// General auth middleware (for any authenticated user)
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

// Auth middleware for customs brokers
const requireCustomsBrokerAuth = async (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Usuário não encontrado" });
    }
    
    // Check if user is a customs broker
    if (user.role !== 'customs_broker') {
      return res.status(403).json({ message: "Acesso negado. Apenas despachantes aduaneiros podem acessar este recurso." });
    }
    
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    console.error("Error in customs broker auth middleware:", error);
    return res.status(500).json({ message: "Erro interno de autenticação" });
  }
};

const router = Router();

// GET /api/customs-broker/imports - Get imports assigned to this customs broker
router.get('/imports', requireCustomsBrokerAuth, async (req, res) => {
  try {
    const customsBrokerId = req.user!.id;
    
    console.log(`🔍 CUSTOMS BROKER IMPORTS REQUEST - User ${customsBrokerId}, Role: customs_broker`);
    console.log(`🔗 Session ID: ${req.sessionID}`);
    
    // Get imports where this user is assigned as customs broker
    const imports = await storage.getImportsByCustomsBroker(customsBrokerId);
    
    console.log(`📊 Found ${imports.length} imports for customs broker ${customsBrokerId}`);
    
    // Transform imports to include importer information
    const importsWithDetails = await Promise.all(
      imports.map(async (importItem) => {
        const importer = await storage.getUser(importItem.userId);
        return {
          ...importItem,
          importerName: importer?.companyName || 'Importador não encontrado'
        };
      })
    );
    
    res.json(importsWithDetails);
  } catch (error) {
    console.error('Error fetching customs broker imports:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/customs-broker/dashboard - Get dashboard data for customs broker
router.get('/dashboard', requireCustomsBrokerAuth, async (req, res) => {
  try {
    const customsBrokerId = req.user!.id;
    
    // Get imports assigned to this customs broker
    const imports = await storage.getImportsByCustomsBroker(customsBrokerId);
    
    // Calculate metrics
    const totalImports = imports.length;
    const pendingImports = imports.filter(imp => 
      imp.status === 'pending' || imp.status === 'in_customs'
    ).length;
    const completedImports = imports.filter(imp => 
      imp.status === 'delivered'
    ).length;
    const totalValue = imports.reduce((sum, imp) => sum + (imp.totalValue || 0), 0);
    
    // Recent activity (last 5 imports)
    const recentImports = imports
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    const dashboardData = {
      metrics: {
        totalImports,
        pendingImports,
        completedImports,
        totalValue
      },
      recentImports,
      performance: {
        onTimeDeliveryRate: completedImports > 0 ? Math.round((completedImports / totalImports) * 100) : 0,
        averageProcessingTime: '5-7 dias', // This would be calculated from actual data
        clientSatisfaction: 4.8 // This would come from ratings
      }
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching customs broker dashboard:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Endpoint to verify if email belongs to a customs broker
router.get('/verify-email/:email', requireAuth, async (req, res) => {
  try {
    const email = req.params.email;
    console.log(`🔍 Verifying customs broker email: ${email}`);
    
    const customsBroker = await storage.getUserByEmail(email);
    
    if (!customsBroker) {
      return res.json({ 
        valid: false, 
        message: 'Email não encontrado no sistema' 
      });
    }

    if (customsBroker.role !== 'customs_broker') {
      return res.json({ 
        valid: false, 
        message: 'Usuário não é um despachante cadastrado' 
      });
    }

    res.json({
      valid: true,
      customsBroker: {
        id: customsBroker.id,
        fullName: customsBroker.fullName,
        companyName: customsBroker.companyName,
        email: customsBroker.email
      }
    });
  } catch (error) {
    console.error('Error verifying customs broker email:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;