import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { UserPayload } from "../types";

export const generateToken = (user: UserPayload): string => {
  return jwt.sign(user, process.env.JWT_SECRET as string, { expiresIn: "7d" });
};

export const generateRefreshToken = (user: UserPayload): string => {
  return jwt.sign(user, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: "30d",
  });
};

export const verifyToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string) as UserPayload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET as string
    ) as UserPayload;
  } catch (error) {
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const generateShareToken = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

export const generateApiKey = (): string => {
  return crypto.randomBytes(24).toString("hex");
};
