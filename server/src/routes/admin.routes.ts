import express from "express";
import { validate, adminSchemas } from "../utils/validation";
import {
  deleteUser,
  getAllUsers,
  getLLMStatistics,
  getTotalUsage,
  getUserById,
  getUserUsage,
  updateUserPlan,
  updateUserRole,
} from "../controllers/admin.controller";
import { isAdmin } from "../middleware/auth";

const router = express.Router();

// Apply admin check to all admin routes
router.use(isAdmin as any);

// User management
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put(
  "/users/:id/role",
  validate(adminSchemas.updateUserRole),
  updateUserRole
);
router.put(
  "/users/:id/plan",
  validate(adminSchemas.updateUserPlan),
  updateUserPlan
);
router.delete("/users/:id", deleteUser);

// Usage statistics
router.get("/usage/total", getTotalUsage);
router.get("/usage/users/:id", getUserUsage);

// LLM provider management
router.get("/llm/statistics", getLLMStatistics);

export default router;
