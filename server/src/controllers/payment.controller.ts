import type { Request, Response } from "express";
import { prisma } from "../config/db";
import { sendEmail, emailTemplates } from "../config/email";
import {
  paystack,
  generatePaymentReference,
  calculateSubscriptionPrice,
} from "../utils/payment";
import { SubscriptionPlan } from "../types";

export const createSubscription = async (
  req: any,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { plan } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: 404,
      });
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "active",
      },
    });

    if (activeSubscription) {
      return res.status(400).json({
        message: "User already has an active subscription",
        status: 400,
      });
    }

    const amount = calculateSubscriptionPrice(plan);

    if (amount === 0) {
      return res.status(400).json({
        message: "Invalid subscription plan",
        status: 400,
      });
    }

    const reference = generatePaymentReference();

    const paymentInfo = {
      email: user.email,
      amount,
      currency: "USD",
      reference,
      metadata: {
        userId,
        plan,
      },
    };

    const paymentResponse: any = await paystack.initializeTransaction(
      paymentInfo
    );

    if (!paymentResponse.status) {
      return res.status(500).json({
        message: "Failed to initialize payment",
        status: 500,
      });
    }

    await prisma.payment.create({
      data: {
        userId,
        amount,
        currency: "USD",
        reference,
        status: "pending",
        provider: "paystack",
        metadata: {
          plan,
        },
      },
    });

    res.status(200).json({
      message: "Payment initialized successfully",
      paymentUrl: paymentResponse.data.authorization_url,
      reference,
    });
  } catch (error) {
    console.error("Create subscription error:", error);
    res.status(500).json({
      message: "Failed to create subscription",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const verifyPayment = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({
        message: "Payment reference is required",
        status: 400,
      });
    }

    const payment: any = await prisma.payment.findUnique({
      where: { reference },
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment record not found",
        status: 404,
      });
    }

    if (payment.status === "success") {
      return res.status(200).json({
        message: "Payment already verified",
        payment,
      });
    }

    const verificationResponse = (await paystack.verifyTransaction(
      reference
    )) as {
      status: boolean;
      data: {
        status: string;
        id: string;
        paid_at: string;
      };
    };

    if (
      !verificationResponse.status ||
      verificationResponse.data.status !== "success"
    ) {
      return res.status(400).json({
        message: "Payment verification failed",
        status: 400,
      });
    }

    const updatedPayment = await prisma.payment.update({
      where: { reference },
      data: {
        status: "success",
        metadata: {
          ...payment.metadata,
          paymentId: verificationResponse.data.id,
          paymentDate: verificationResponse.data.paid_at,
        },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: payment.userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: 404,
      });
    }

    const plan = payment.metadata.plan;
    const subscriptionData = {
      userId: payment.userId,
      plan,
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      paymentId: payment.id,
    };

    const subscription = await prisma.subscription.create({
      data: subscriptionData,
    });

    await prisma.user.update({
      where: { id: payment.userId },
      data: { plan: plan as SubscriptionPlan },
    });

    await sendEmail(
      user.email,
      "Subscription Confirmed",
      emailTemplates.subscriptionConfirmation(user.username, plan)
    );

    res.status(200).json({
      message: "Payment verified and subscription activated",
      payment: updatedPayment,
      subscription,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      message: "Failed to verify payment",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const cancelSubscription = async (
  req: any,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { subscriptionId } = req.body;

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!subscription) {
      return res.status(404).json({
        message: "Subscription not found",
        status: 404,
      });
    }

    if (subscription.status !== "active") {
      return res.status(400).json({
        message: "Subscription is not active",
        status: 400,
      });
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { plan: SubscriptionPlan.FREE },
    });

    res.status(200).json({
      message: "Subscription cancelled successfully",
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({
      message: "Failed to cancel subscription",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const getSubscriptionStatus = async (
  req: any,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user!.id;

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "active",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        payment: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
      },
    });

    res.status(200).json({
      subscription,
      plan: user?.plan || SubscriptionPlan.FREE,
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    res.status(500).json({
      message: "Failed to get subscription status",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const getPaymentHistory = async (
  req: any,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Number.parseInt(page as string);
    const limitNum = Number.parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [payments, totalPayments] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limitNum,
      }),
      prisma.payment.count({
        where: { userId },
      }),
    ]);

    res.status(200).json({
      payments,
      pagination: {
        total: totalPayments,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalPayments / limitNum),
      },
    });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({
      message: "Failed to get payment history",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};
