import { Buffer } from "buffer";

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
  plan: SubscriptionPlan;
}

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum SubscriptionPlan {
  FREE = "FREE",
  PREMIUM = "PREMIUM",
}

export enum LLMProvider {
  GEMINI = "GEMINI",
  OPENAI = "OPENAI",
  CLAUDE = "CLAUDE",
}

export interface LLMRequest {
  prompt: string;
  provider: LLMProvider;
  parameters?: Record<string, any>;
  language?: string;
  framework?: string;
}

export interface LLMResponse {
  code: string;
  language: string;
  explanation?: string;
}

export interface ProjectShare {
  id: string;
  projectId: string;
  token: string;
  isPublic: boolean;
  expiresAt?: Date;
}

export interface UploadedFile {
  filename: string;
  mimetype: string;
  encoding: string;
  buffer: Buffer;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  status?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaymentInfo {
  amount: number;
  currency: string;
  email: string;
  reference: string;
  metadata?: Record<string, any>;
}
