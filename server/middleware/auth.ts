/**
 * Centralized authentication middleware
 */
import type { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  session: {
    userId?: number;
  };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log("Auth check - Session ID:", req.sessionID, "User ID:", req.session?.userId);
  
  if (!req.session?.userId) {
    console.log("Authentication failed - no session or user ID");
    return res.status(401).json({ message: "Não autorizado" });
  }
  
  console.log("Authentication successful for user:", req.session.userId);
  next();
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    // Add admin role check logic here if needed
    next();
  });
};

export const requireSuperAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    // Add super admin role check logic here if needed
    next();
  });
};