import { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// Middleware para verificar se é super admin
export const requireSuperAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Não autorizado" });
  }

  if (req.user.email !== "pavaosmart@gmail.com") {
    return res.status(403).json({ message: "Acesso negado - apenas super admin" });
  }

  next();
};

// Middleware para verificar se é admin ou super admin
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Não autorizado" });
  }

  if (req.user.role !== "admin" && req.user.role !== "super_admin" && req.user.email !== "pavaosmart@gmail.com") {
    return res.status(403).json({ message: "Acesso negado - apenas administradores" });
  }

  next();
};

// Função helper para verificar roles
export const hasRole = (user: any, role: string): boolean => {
  if (user?.email === "pavaosmart@gmail.com") return true; // Super admin sempre tem acesso
  return user?.role === role;
};

export const hasAdminAccess = (user: any): boolean => {
  return user?.email === "pavaosmart@gmail.com" || user?.role === "admin" || user?.role === "super_admin";
};