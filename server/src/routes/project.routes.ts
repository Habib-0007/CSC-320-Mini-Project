import express from "express";
import { validate, projectSchemas } from "../utils/validation";
import {
  createProject,
  createSnippet,
  deleteProject,
  deleteSnippet,
  getAllProjects,
  getProjectById,
  getProjectSnippets,
  getSharedProject,
  getSnippetById,
  removeProjectShare,
  shareProject,
  updateProject,
  updateSnippet,
} from "../controllers/project.controller";

const router = express.Router();

// Project CRUD
router.get("/", getAllProjects);
router.post("/", validate(projectSchemas.create), createProject);
router.get("/:id", getProjectById);
router.put("/:id", validate(projectSchemas.update), updateProject);
router.delete("/:id", deleteProject);

// Snippet CRUD
router.post(
  "/:projectId/snippets",
  validate(projectSchemas.createSnippet),
  createSnippet
);
router.get("/:projectId/snippets", getProjectSnippets);
router.get("/:projectId/snippets/:snippetId", getSnippetById);
router.put(
  "/:projectId/snippets/:snippetId",
  validate(projectSchemas.updateSnippet),
  updateSnippet
);
router.delete("/:projectId/snippets/:snippetId", deleteSnippet);

// Project sharing
router.post(
  "/:projectId/share",
  validate(projectSchemas.shareProject),
  shareProject
);
router.delete("/:projectId/share", removeProjectShare);

// Access shared project (public route)
router.get("/shared/:token", getSharedProject);

export default router;
