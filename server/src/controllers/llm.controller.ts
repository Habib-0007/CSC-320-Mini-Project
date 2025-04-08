import type { Request, Response } from "express";
import { prisma } from "../config/db";
import { LLMProvider, type LLMRequest } from "../types";
import {
  generateCode as generateCodeUtil,
  generateWithOpenAI as generateWithOpenAIUtil,
  generateWithClaude as generateWithClaudeUtil,
} from "../utils/llm";
import { processUploadedFile } from "../utils/file-processing";

export const generateCode = async (
  req: any,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user!.id;
    const llmRequest: LLMRequest = req.body;

    const startTime = Date.now();

    const result = await generateCodeUtil(llmRequest);

    const responseTime = Date.now() - startTime;

    await prisma.apiUsage.create({
      data: {
        userId,
        provider: llmRequest.provider,
        prompt: llmRequest.prompt,
        responseTime,
        status: "success",
        parameters: llmRequest.parameters || {},
      },
    });

    res.status(200).json({
      message: "Code generated successfully",
      result,
    });
  } catch (error) {
    console.error("Generate code error:", error);

    try {
      await prisma.apiUsage.create({
        data: {
          userId: req.user!.id,
          provider: req.body.provider,
          prompt: req.body.prompt,
          responseTime: 0,
          status: "error",
          parameters: req.body.parameters || {},
        },
      });
    } catch (logError) {
      console.error("Failed to log API usage:", logError);
    }

    res.status(500).json({
      message: "Failed to generate code",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const generateWithOpenAI = async (
  req: any,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user!.id;
    const llmRequest: LLMRequest = {
      ...req.body,
      provider: LLMProvider.OPENAI,
    };

    const startTime = Date.now();

    const result = await generateWithOpenAIUtil(llmRequest);

    const responseTime = Date.now() - startTime;

    await prisma.apiUsage.create({
      data: {
        userId,
        provider: LLMProvider.OPENAI,
        prompt: llmRequest.prompt,
        responseTime,
        status: "success",
        parameters: llmRequest.parameters || {},
      },
    });

    res.status(200).json({
      message: "Code generated successfully with OpenAI",
      result,
    });
  } catch (error) {
    console.error("Generate with OpenAI error:", error);

    try {
      await prisma.apiUsage.create({
        data: {
          userId: req.user!.id,
          provider: LLMProvider.OPENAI,
          prompt: req.body.prompt,
          responseTime: 0,
          status: "error",
          parameters: req.body.parameters || {},
        },
      });
    } catch (logError) {
      console.error("Failed to log API usage:", logError);
    }

    res.status(500).json({
      message: "Failed to generate code with OpenAI",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const generateWithClaude = async (
  req: any,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user!.id;
    const llmRequest: LLMRequest = {
      ...req.body,
      provider: LLMProvider.CLAUDE,
    };

    const startTime = Date.now();

    const result = await generateWithClaudeUtil(llmRequest);

    const responseTime = Date.now() - startTime;

    await prisma.apiUsage.create({
      data: {
        userId,
        provider: LLMProvider.CLAUDE,
        prompt: llmRequest.prompt,
        responseTime,
        status: "success",
        parameters: llmRequest.parameters || {},
      },
    });

    res.status(200).json({
      message: "Code generated successfully with Claude",
      result,
    });
  } catch (error) {
    console.error("Generate with Claude error:", error);

    try {
      await prisma.apiUsage.create({
        data: {
          userId: req.user!.id,
          provider: LLMProvider.CLAUDE,
          prompt: req.body.prompt,
          responseTime: 0,
          status: "error",
          parameters: req.body.parameters || {},
        },
      });
    } catch (logError) {
      console.error("Failed to log API usage:", logError);
    }

    res.status(500).json({
      message: "Failed to generate code with Claude",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const processImageWithPrompt = async (
  req: any,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { prompt, provider = LLMProvider.GEMINI } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "No image file provided",
        status: 400,
      });
    }

    const extractedText = await processUploadedFile(req.file);

    const enhancedPrompt = `
      I've extracted the following text from an image:
      
      ${extractedText}
      
      Based on this, ${prompt}
    `;

    const llmRequest: LLMRequest = {
      prompt: enhancedPrompt,
      provider: provider as LLMProvider,
      parameters: req.body.parameters,
    };

    const startTime = Date.now();

    const result = await generateCodeUtil(llmRequest);

    const responseTime = Date.now() - startTime;

    await prisma.apiUsage.create({
      data: {
        userId,
        provider: llmRequest.provider,
        prompt: llmRequest.prompt,
        responseTime,
        status: "success",
        parameters: llmRequest.parameters || {},
      },
    });

    res.status(200).json({
      message: "Image processed and code generated successfully",
      extractedText,
      result,
    });
  } catch (error) {
    console.error("Process image with prompt error:", error);

    res.status(500).json({
      message: "Failed to process image and generate code",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const processDocumentWithPrompt = async (
  req: any,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { prompt, provider = LLMProvider.GEMINI } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "No document file provided",
        status: 400,
      });
    }

    const extractedText = await processUploadedFile(req.file);

    const enhancedPrompt = `
      I've extracted the following text from a document:
      
      ${extractedText}
      
      Based on this, ${prompt}
    `;

    const llmRequest: LLMRequest = {
      prompt: enhancedPrompt,
      provider: provider as LLMProvider,
      parameters: req.body.parameters,
    };

    const startTime = Date.now();

    const result = await generateCodeUtil(llmRequest);

    const responseTime = Date.now() - startTime;

    await prisma.apiUsage.create({
      data: {
        userId,
        provider: llmRequest.provider,
        prompt: llmRequest.prompt,
        responseTime,
        status: "success",
        parameters: llmRequest.parameters || {},
      },
    });

    res.status(200).json({
      message: "Document processed and code generated successfully",
      extractedText,
      result,
    });
  } catch (error) {
    console.error("Process document with prompt error:", error);

    res.status(500).json({
      message: "Failed to process document and generate code",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};
