import express from "express";
import { validate, llmSchemas } from "../utils/validation";
import {
  generateCode,
  generateWithClaude,
  generateWithOpenAI,
  processDocumentWithPrompt,
  processImageWithPrompt,
} from "../controllers/llm.controller";
import { isPremiumUser } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = express.Router();

// Generate code with AI
router.post("/generate", validate(llmSchemas.generate), generateCode);

// Upload image for OCR/parsing with prompt
router.post("/upload-image", upload.single("image"), processImageWithPrompt);

// Document parsing with prompt
router.post(
  "/process-document",
  upload.single("document"),
  processDocumentWithPrompt
);

// Premium-only routes
router.post(
  "/generate/openai",
  isPremiumUser as any,
  validate(llmSchemas.generate),
  generateWithOpenAI
);
router.post(
  "/generate/claude",
  isPremiumUser as any,
  validate(llmSchemas.generate),
  generateWithClaude
);

export default router;
