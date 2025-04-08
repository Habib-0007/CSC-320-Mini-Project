import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { createClient } from "redis";
import { Express } from "express";
import { SubscriptionPlan } from "../types";
import { authenticateToken } from "./auth";

let redisClient: any;

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
  });

  redisClient.on("error", (err: any) => {
    console.error("Redis error:", err);
  });

  (async () => {
    await redisClient.connect();
  })();
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests, please try again later",
    status: 429,
  },
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    }),
  }),
});

const llmLimiter = (req: any, res: any, next: any) => {
  const userPlan = req.user?.plan || SubscriptionPlan.FREE;

  const limit = userPlan === SubscriptionPlan.PREMIUM ? 100 : 10;
  const windowMs = 60 * 60 * 1000;

  const limiter = rateLimit({
    windowMs,
    max: limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: `Rate limit exceeded. Free tier is limited to ${limit} generations per hour. Consider upgrading to Premium for higher limits.`,
      status: 429,
    },
    skipSuccessfulRequests: false,
    keyGenerator: (req) => req.user?.id || req.ip,
    ...(redisClient && {
      store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
        prefix: "ratelimit:llm:",
      }),
    }),
  });

  limiter(req, res, next);
};

export const setupRateLimiter = (app: Express) => {
  app.use("/api/auth", authLimiter);

  app.use("/api/llm", authenticateToken as any, llmLimiter);
};
