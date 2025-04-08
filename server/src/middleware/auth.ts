import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";
import { UserPayload, UserRole } from "../types";

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Authentication required",
      status: 401,
    });
  }

  const user = verifyToken(token);

  if (!user) {
    return res.status(403).json({
      message: "Invalid or expired token",
      status: 403,
    });
  }

  req.user = user;
  next();
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      message: "Admin access required",
      status: 403,
    });
  }

  next();
};

export const isPremiumUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.plan !== "PREMIUM") {
    return res.status(403).json({
      message: "Premium subscription required",
      status: 403,
    });
  }

  next();
};
