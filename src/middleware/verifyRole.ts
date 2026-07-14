import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./verifyToken";

export const verifyRole = (requiredRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User missing from request" });
    }

    if (req.user.role !== requiredRole) {
      return res
        .status(403)
        .json({ error: `Forbidden: Requires ${requiredRole} role` });
    }

    next();
  };
};
