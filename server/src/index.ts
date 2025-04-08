import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { config } from "dotenv";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/notfound-handler";
import { authenticateToken } from "./middleware/auth";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import llmRoutes from "./routes/llm.routes";
import projectRoutes from "./routes/project.routes";
import adminRoutes from "./routes/admin.routes";
import paymentRoutes from "./routes/payment.routes";
import { setupRateLimiter } from "./middleware/rate-limiter";

config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "https://fucodegen.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    allowedHeaders:
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  })
);

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

setupRateLimiter(app);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the Fucodegen API",
    status: 200,
    data: null,
    error: null,
    date: new Date().toDateString(),
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/users", authenticateToken as any, userRoutes);
app.use("/api/llm", authenticateToken as any, llmRoutes);
app.use("/api/projects", authenticateToken as any, projectRoutes);
app.use("/api/admin", authenticateToken as any, adminRoutes);
app.use("/api/payments", authenticateToken as any, paymentRoutes);

app.use(notFoundHandler);
app.use(errorHandler as any);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
