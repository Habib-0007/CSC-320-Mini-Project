import express from "express";
import { validate, paymentSchemas } from "../utils/validation";
import {
  cancelSubscription,
  createSubscription,
  getPaymentHistory,
  getSubscriptionStatus,
  verifyPayment,
} from "../controllers/payment.controller";

const router = express.Router();

// Subscription management
router.post(
  "/subscribe",
  validate(paymentSchemas.createSubscription),
  createSubscription
);
router.post("/verify", verifyPayment);
router.post(
  "/cancel",
  validate(paymentSchemas.cancelSubscription),
  cancelSubscription
);

// Get subscription status
router.get("/subscription", getSubscriptionStatus);

// Payment history
router.get("/history", getPaymentHistory);

export default router;
