import { Request, Response, NextFunction } from "express";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { ErrorResponse } from "../types";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
) => {
  console.error("Error:", err);

  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return res.status(409).json({
          message: "Resource already exists",
          code: "CONFLICT",
          status: 409,
        });
      case "P2025":
        return res.status(404).json({
          message: "Resource not found",
          code: "NOT_FOUND",
          status: 404,
        });
      default:
        return res.status(500).json({
          message: "Database error",
          code: err.code,
          status: 500,
        });
    }
  }

  res.status(500).json({
    message: err.message || "Internal Server Error",
    status: 500,
  });
};
