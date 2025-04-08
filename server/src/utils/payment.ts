import https from "https";
import { PaymentInfo } from "../types";

const initPaystack = () => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY as string;
  const baseURL = "api.paystack.co";

  return {
    initializeTransaction: async (paymentInfo: PaymentInfo) => {
      return new Promise((resolve, reject) => {
        const params = JSON.stringify({
          email: paymentInfo.email,
          amount: paymentInfo.amount * 100,
          currency: paymentInfo.currency,
          reference: paymentInfo.reference,
          metadata: paymentInfo.metadata || {},
        });

        const options = {
          hostname: baseURL,
          port: 443,
          path: "/transaction/initialize",
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
            "Content-Length": params.length,
          },
        };

        const req = https.request(options, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            resolve(JSON.parse(data));
          });
        });

        req.on("error", (error) => {
          reject(error);
        });

        req.write(params);
        req.end();
      });
    },

    verifyTransaction: async (reference: string) => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: baseURL,
          port: 443,
          path: `/transaction/verify/${reference}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        };

        const req = https.request(options, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            resolve(JSON.parse(data));
          });
        });

        req.on("error", (error) => {
          reject(error);
        });

        req.end();
      });
    },

    createSubscription: async (
      customerId: string,
      planCode: string,
      metadata: Record<string, any> = {}
    ) => {
      return new Promise((resolve, reject) => {
        const params = JSON.stringify({
          customer: customerId,
          plan: planCode,
          metadata,
        });

        const options = {
          hostname: baseURL,
          port: 443,
          path: "/subscription",
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
            "Content-Length": params.length,
          },
        };

        const req = https.request(options, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            resolve(JSON.parse(data));
          });
        });

        req.on("error", (error) => {
          reject(error);
        });

        req.write(params);
        req.end();
      });
    },

    cancelSubscription: async (subscriptionCode: string) => {
      return new Promise((resolve, reject) => {
        const params = JSON.stringify({
          code: subscriptionCode,
        });

        const options = {
          hostname: baseURL,
          port: 443,
          path: "/subscription/disable",
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
            "Content-Length": params.length,
          },
        };

        const req = https.request(options, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            resolve(JSON.parse(data));
          });
        });

        req.on("error", (error) => {
          reject(error);
        });

        req.write(params);
        req.end();
      });
    },
  };
};

export const paystack = initPaystack();

export const generatePaymentReference = (): string => {
  return `REF-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
};

export const calculateSubscriptionPrice = (plan: string): number => {
  switch (plan.toUpperCase()) {
    case "PREMIUM":
      return 20.0;
    default:
      return 0;
  }
};
