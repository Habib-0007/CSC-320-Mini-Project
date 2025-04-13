import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, CreditCard, Zap, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useToast } from "../components/ui/use-toast";
import { useAuth } from "../hooks/use-auth";
import { useSubscription, useCreateSubscription } from "../hooks/use-api";
import { Skeleton } from "../components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

const Pricing = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"FREE" | "PREMIUM">(
    "PREMIUM"
  );

  // Get subscription status
  const { data: subscriptionData, isLoading: isLoadingSubscription } =
    useSubscription();

  // Create subscription mutation
  const createSubscriptionMutation = useCreateSubscription();

  // Check if there's a payment reference in the URL (for payment verification)
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const reference = queryParams.get("reference");
    const status = queryParams.get("status");

    if (reference && status === "success") {
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      // Show success message
      toast({
        title: "Payment Successful",
        description:
          "Your subscription has been activated. Thank you for your purchase!",
      });
    }
  }, [toast]);

  const plans = [
    {
      id: "FREE",
      name: "Free",
      description: "Basic features for personal projects",
      price: {
        monthly: "$0",
        yearly: "$0",
      },
      features: [
        "5 projects",
        "50 code snippets",
        "Basic AI code generation",
        "Community support",
        "Standard response time",
      ],
      limitations: [
        "Limited API calls",
        "No private sharing",
        "Basic models only",
      ],
      cta: user?.plan === "FREE" ? "Current Plan" : "Downgrade",
      disabled: user?.plan === "FREE",
    },
    {
      id: "PREMIUM",
      name: "Premium",
      description: "Advanced features for professional developers",
      price: {
        monthly: "$20",
        yearly: "$192",
      },
      features: [
        "Unlimited projects",
        "Unlimited code snippets",
        "Advanced AI code generation",
        "Priority support",
        "Faster response time",
        "Private project sharing",
        "API access",
        "Premium AI models (OpenAI, Claude)",
        "Custom branding",
      ],
      limitations: [],
      cta: user?.plan === "PREMIUM" ? "Current Plan" : "Upgrade",
      disabled: user?.plan === "PREMIUM",
      highlight: true,
    },
  ];

  const handleSelectPlan = (planId: "FREE" | "PREMIUM") => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in or sign up to subscribe to a plan.",
      });
      navigate("/auth/login");
      return;
    }

    if (user?.plan === planId) {
      toast({
        title: "Already Subscribed",
        description: `You are already on the ${
          planId === "FREE" ? "Free" : "Premium"
        } plan.`,
      });
      return;
    }

    setSelectedPlan(planId);
    setIsPaymentDialogOpen(true);
  };

  const handleSubscribe = () => {
    if (selectedPlan === "FREE") {
      // Handle downgrade to free plan
      // This would typically call an API to cancel the subscription
      toast({
        title: "Plan Downgraded",
        description:
          "You have been downgraded to the Free plan. Changes will take effect at the end of your billing period.",
      });
      setIsPaymentDialogOpen(false);
    } else {
      // Handle upgrade to premium plan
      createSubscriptionMutation.mutate(selectedPlan);
      setIsPaymentDialogOpen(false);
    }
  };

  // Show active subscription details if available
  const activeSubscription = subscriptionData?.subscription;
  const subscriptionEndDate = activeSubscription?.endDate
    ? new Date(activeSubscription.endDate)
    : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Pricing Plans</h1>
        <p className="text-muted-foreground mt-2">
          Choose the perfect plan for your development needs
        </p>
      </div>

      {/* Show active subscription alert if user has one */}
      {isAuthenticated && activeSubscription && (
        <Alert className="max-w-3xl mx-auto">
          <Zap className="h-4 w-4" />
          <AlertTitle>Active Subscription</AlertTitle>
          <AlertDescription>
            You are currently on the {activeSubscription.plan} plan.
            {subscriptionEndDate && (
              <span>
                {" "}
                Your subscription is valid until{" "}
                {subscriptionEndDate.toLocaleDateString()}.
              </span>
            )}
            {activeSubscription.status === "cancelled" && (
              <span className="text-amber-500 font-medium">
                {" "}
                Your subscription has been cancelled and will not renew.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center">
        <Tabs
          defaultValue="monthly"
          value={billingCycle}
          onValueChange={(value) =>
            setBillingCycle(value as "monthly" | "yearly")
          }
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">
              Yearly{" "}
              <span className="ml-1 text-xs text-emerald-600">(Save 20%)</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col ${
              plan.highlight
                ? "border-primary shadow-md dark:border-primary"
                : "border-border"
            }`}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">
                  {plan.price[billingCycle]}
                </span>
                {plan.id !== "FREE" && (
                  <span className="text-muted-foreground ml-2">
                    /{billingCycle === "monthly" ? "month" : "year"}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-emerald-500" />
                    <span>{feature}</span>
                  </li>
                ))}
                {plan.limitations.map((limitation) => (
                  <li
                    key={limitation}
                    className="flex items-center text-muted-foreground"
                  >
                    <span className="mr-2 h-4 w-4 flex items-center justify-center">
                      -
                    </span>
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {isLoadingSubscription ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Button
                  className="w-full"
                  variant={plan.highlight ? "default" : "outline"}
                  disabled={
                    plan.disabled || createSubscriptionMutation.isPending
                  }
                  onClick={() =>
                    handleSelectPlan(plan.id as "FREE" | "PREMIUM")
                  }
                >
                  {createSubscriptionMutation.isPending &&
                  selectedPlan === plan.id
                    ? "Processing..."
                    : plan.cta}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12 rounded-lg border p-6 bg-muted/40 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Need a custom plan?</h2>
            <p className="text-muted-foreground mt-1">
              Contact us for enterprise pricing and custom solutions
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="mailto:sales@example.com">Contact Sales</a>
          </Button>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Subscribe to {selectedPlan === "FREE" ? "Free" : "Premium"} Plan
            </DialogTitle>
            <DialogDescription>
              {selectedPlan === "FREE"
                ? "Downgrade to the Free plan"
                : "Upgrade to unlock premium features"}
            </DialogDescription>
          </DialogHeader>
          {selectedPlan === "PREMIUM" ? (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-medium">Premium Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      {billingCycle === "monthly" ? "Monthly" : "Annual"}{" "}
                      billing
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {billingCycle === "monthly" ? "$20" : "$192"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {billingCycle === "monthly" ? "per month" : "per year"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>
                      {billingCycle === "monthly" ? "$20.00" : "$192.00"}
                    </span>
                  </div>
                  {billingCycle === "yearly" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Annual discount</span>
                      <span className="text-emerald-600">-$48.00</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Total</span>
                    <span>
                      {billingCycle === "monthly" ? "$20.00" : "$192.00"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Payment Method</h3>
                <div className="rounded-lg border p-4 flex items-center gap-4">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Credit / Debit Card</p>
                    <p className="text-sm text-muted-foreground">
                      We use Paystack for secure payments
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <div className="rounded-lg border p-4 mb-4">
                <h3 className="font-medium mb-2">Downgrade to Free Plan</h3>
                <p className="text-sm text-muted-foreground">
                  You will lose access to premium features at the end of your
                  current billing period.
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 text-amber-800 dark:text-amber-200">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Important Note
                </h4>
                <p className="text-sm mt-1">
                  Downgrading will limit your access to 5 projects and 50
                  snippets. Any additional data will be archived but not
                  deleted.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubscribe}
              disabled={createSubscriptionMutation.isPending}
            >
              {createSubscriptionMutation.isPending
                ? "Processing..."
                : selectedPlan === "FREE"
                ? "Downgrade"
                : "Subscribe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;
