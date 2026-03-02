import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Calendar,
  Check,
  CheckCircle,
  Copy,
  Globe,
  Shield,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const DEFAULT_PLAN_PRICES = { starter: 9, pro: 29, enterprise: 99 };

function loadPlanPrices(): {
  starter: number;
  pro: number;
  enterprise: number;
} {
  try {
    const stored = localStorage.getItem("frostify_plan_prices");
    if (stored)
      return JSON.parse(stored) as {
        starter: number;
        pro: number;
        enterprise: number;
      };
  } catch {
    // ignore
  }
  return DEFAULT_PLAN_PRICES;
}

const PLAN_DEFS = [
  {
    id: "starter" as const,
    name: "Starter",
    period: "/mo",
    description: "Perfect for creators just getting started.",
    highlight: false,
    features: [
      "1 store",
      "Up to 50 products",
      "Basic analytics",
      "AI assistant (5 queries/day)",
      "Unique store URL",
      "Email support",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    period: "/mo",
    description: "Everything you need to grow your business.",
    highlight: true,
    badge: "Most Popular",
    features: [
      "1 store",
      "Unlimited products",
      "Full analytics dashboard",
      "AI assistant (unlimited)",
      "Priority support",
      "Custom branding",
    ],
  },
  {
    id: "enterprise" as const,
    name: "Enterprise",
    period: "/mo",
    description: "For power sellers with multiple brands.",
    highlight: false,
    features: [
      "Up to 5 stores",
      "Unlimited products",
      "Full analytics dashboard",
      "AI assistant (unlimited)",
      "Dedicated support",
      "Custom domain",
    ],
  },
];

const PERKS = [
  {
    icon: Globe,
    title: "Your unique store URL",
    description: "Share your store at frostify.io/store/your-name",
  },
  {
    icon: Bot,
    title: "AI-powered tools",
    description: "Generate descriptions, pricing tips, and SEO content",
  },
  {
    icon: Shield,
    title: "Secure & decentralized",
    description: "Powered by the Internet Computer blockchain",
  },
];

const DEFAULT_PAYMENT_METHODS = [
  {
    id: 1,
    name: "PayPal",
    address: "payments@frostify.io",
    instructions:
      "Send payment to this PayPal email and include your username in the note",
    isActive: true,
  },
  {
    id: 2,
    name: "Bank Transfer",
    address: "Sort: 12-34-56 | Acc: 12345678 | Name: Frostify Ltd",
    instructions: "Use your username as the payment reference",
    isActive: true,
  },
  {
    id: 3,
    name: "Bitcoin (BTC)",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    instructions:
      "Send exact amount and email proof of payment to support@frostify.io",
    isActive: true,
  },
];

interface PaymentMethod {
  id: number;
  name: string;
  address: string;
  instructions: string;
  isActive: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

function getPaymentMethods(): PaymentMethod[] {
  try {
    const stored = localStorage.getItem("frostify_payment_methods");
    if (stored) {
      const parsed = JSON.parse(stored) as PaymentMethod[];
      return parsed.filter((m) => m.isActive);
    }
  } catch {
    // ignore
  }
  return DEFAULT_PAYMENT_METHODS.filter((m) => m.isActive);
}

export default function MembershipPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");
  const [duration, setDuration] = useState<1 | 2>(1);
  const [paypalUsername, setPaypalUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<{ paypal?: string; name?: string }>({});
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, string>;
  const isExpired = search?.expired === "1";

  const planPrices = loadPlanPrices();
  const PLANS = PLAN_DEFS.map((p) => ({
    ...p,
    price: `$${planPrices[p.id]}`,
    monthlyPrice: planPrices[p.id],
  }));

  const paymentMethods = getPaymentMethods();

  function handleContinueToPayment() {
    localStorage.setItem("selectedPlan", selectedPlan);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCopyAddress(address: string) {
    navigator.clipboard
      .writeText(address)
      .then(() => toast.success("Copied to clipboard!"))
      .catch(() => toast.error("Failed to copy"));
  }

  function validatePayment() {
    const e: { paypal?: string; name?: string } = {};
    if (!paypalUsername.trim()) e.paypal = "PayPal username is required";
    if (!fullName.trim()) e.name = "Full name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleCompletePayment() {
    if (!validatePayment()) return;

    const plan = PLANS.find((p) => p.id === selectedPlan);
    const joinedAt = new Date().toISOString();
    const daysToAdd = duration === 2 ? 60 : 30;
    const expiresAt = new Date(
      Date.now() + daysToAdd * 24 * 60 * 60 * 1000,
    ).toISOString();
    const subscription = {
      id: Date.now(),
      name: fullName.trim(),
      paypalUsername: paypalUsername.trim(),
      plan: plan?.name ?? selectedPlan,
      duration,
      status: "active",
      joinedAt,
      expiresAt,
    };

    try {
      const existing = JSON.parse(
        localStorage.getItem("frostify_subscriptions") ?? "[]",
      ) as unknown[];
      existing.push(subscription);
      localStorage.setItem("frostify_subscriptions", JSON.stringify(existing));
    } catch {
      localStorage.setItem(
        "frostify_subscriptions",
        JSON.stringify([subscription]),
      );
    }

    toast.success("Membership activated! You can now log in.");
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-background hero-mesh relative">
      {/* Subtle background overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/80" />
      </div>

      <div className="relative z-10">
        {/* ── Header ─────────────────────────────────────── */}
        <header className="glass border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto flex items-center justify-between h-16 px-4">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/assets/generated/shopforge-logo-transparent.dim_120x120.png"
                alt="Frostify"
                className="h-8 w-8 object-contain"
              />
              <span className="font-display font-bold text-xl tracking-tight">
                Frost<span className="ai-gradient-text">ify</span>
              </span>
            </Link>
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Plans
              </button>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            )}
          </div>
        </header>

        {/* Expired subscription notice */}
        {isExpired && (
          <div className="container mx-auto px-4 pt-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4 mb-2"
            >
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-700 dark:text-amber-400 font-semibold text-sm">
                  Your subscription has expired
                </p>
                <p className="text-amber-700/70 dark:text-amber-400/70 text-xs mt-0.5">
                  Please renew your membership to continue using Frostify.
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Step indicator */}
        <div className="container mx-auto px-4 pt-8 max-w-6xl">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= 1
                    ? "ai-gradient text-white"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {step > 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <span
                className={`text-sm font-medium ${step >= 1 ? "text-foreground" : "text-muted-foreground"}`}
              >
                Choose Plan
              </span>
            </div>
            <div className="w-12 h-px bg-border" />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= 2
                    ? "ai-gradient text-white"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                2
              </div>
              <span
                className={`text-sm font-medium ${step >= 2 ? "text-foreground" : "text-muted-foreground"}`}
              >
                Payment
              </span>
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 pb-16 max-w-6xl">
          {step === 1 && (
            <>
              {/* ── Title ────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
              >
                <div className="w-14 h-14 rounded-2xl ai-gradient flex items-center justify-center mx-auto mb-5 shadow-glow-sm">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <Badge className="mb-4 ai-gradient text-white border-0 px-4 py-1">
                  Choose Your Plan
                </Badge>
                <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight mb-4">
                  Start selling with
                  <br />
                  <span className="ai-gradient-text">
                    the right plan for you
                  </span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                  Every plan includes a unique store URL, AI assistant, and full
                  product management. Upgrade or downgrade anytime.
                </p>
              </motion.div>

              {/* ── Perks Row ────────────────────────────────── */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
              >
                {PERKS.map((perk) => (
                  <motion.div
                    key={perk.title}
                    variants={itemVariants}
                    className="flex items-start gap-3 bg-card border border-border rounded-xl p-4"
                  >
                    <div className="w-9 h-9 rounded-lg ai-gradient flex items-center justify-center shrink-0 shadow-glow-sm">
                      <perk.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{perk.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {perk.description}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* ── Plan Cards ───────────────────────────────── */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
              >
                {PLANS.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <motion.button
                      key={plan.id}
                      variants={itemVariants}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      onClick={() => setSelectedPlan(plan.id)}
                      type="button"
                      className={`relative bg-card border rounded-2xl p-8 flex flex-col text-left cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/30 shadow-glow-sm"
                          : plan.highlight
                            ? "border-primary/40"
                            : "border-border hover:border-primary/30"
                      }`}
                    >
                      {/* Selected checkmark */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-4 right-4 w-6 h-6 rounded-full ai-gradient flex items-center justify-center shadow-glow-sm"
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                        </motion.div>
                      )}

                      {/* Badge */}
                      {plan.highlight && plan.badge && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <Badge className="ai-gradient text-white border-0 px-4 py-1 text-xs font-semibold">
                            {plan.badge}
                          </Badge>
                        </div>
                      )}

                      <div className="mb-6">
                        <h3 className="font-display text-xl font-bold mb-1">
                          {plan.name}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          {plan.description}
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-4xl font-black">
                            {plan.price}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {plan.period}
                          </span>
                        </div>
                      </div>

                      <ul className="space-y-3 flex-1">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center gap-2.5 text-sm"
                          >
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? "ai-gradient" : "bg-secondary"
                              }`}
                            >
                              <Check
                                className={`w-2.5 h-2.5 ${isSelected ? "text-white" : "text-muted-foreground"}`}
                              />
                            </div>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {/* Selection indicator */}
                      <div
                        className={`mt-6 text-center text-sm font-semibold transition-colors ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {isSelected ? "✓ Selected" : "Click to select"}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* ── Duration Selector ────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="flex flex-col items-center gap-3 mb-8"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">
                    Choose duration
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-secondary/60 rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => setDuration(1)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      duration === 1
                        ? "ai-gradient text-white shadow-glow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    1 Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration(2)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      duration === 2
                        ? "ai-gradient text-white shadow-glow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    2 Months
                  </button>
                </div>
                {duration === 2 && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-primary font-medium"
                  >
                    {`2 × $${PLANS.find((p) => p.id === selectedPlan)?.monthlyPrice ?? 0} = $${(PLANS.find((p) => p.id === selectedPlan)?.monthlyPrice ?? 0) * 2} total`}
                  </motion.p>
                )}
              </motion.div>

              {/* ── CTA ──────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-col items-center gap-4"
              >
                <Button
                  onClick={handleContinueToPayment}
                  size="lg"
                  className="ai-gradient text-white border-0 shadow-glow px-10 font-semibold text-base"
                >
                  Continue to Payment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  You need a membership to create and manage your store.{" "}
                  <Link
                    to="/stores"
                    className="text-primary hover:underline font-medium"
                  >
                    Browsing stores
                  </Link>{" "}
                  is always free — no account needed.
                </p>
              </motion.div>
            </>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              {/* Header */}
              <div className="text-center mb-10">
                <div className="w-14 h-14 rounded-2xl ai-gradient flex items-center justify-center mx-auto mb-5 shadow-glow-sm">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight mb-3">
                  Complete your payment
                </h1>
                <p className="text-muted-foreground text-base max-w-lg mx-auto">
                  Send your membership fee using one of the methods below, then
                  enter your PayPal username so we can verify your payment.
                </p>
                {/* Selected plan summary */}
                {(() => {
                  const plan = PLANS.find((p) => p.id === selectedPlan);
                  const totalPrice = (plan?.monthlyPrice ?? 0) * duration;
                  return (
                    <div className="inline-flex items-center gap-2 mt-4 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {plan?.name} Plan · {duration} month
                        {duration > 1 ? "s" : ""} — ${totalPrice} total
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Payment Methods */}
              <div className="space-y-4 mb-8">
                <h2 className="font-display font-bold text-lg">
                  Payment Methods
                </h2>
                {paymentMethods.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground text-sm">
                    No payment methods configured. Please contact support.
                  </div>
                ) : (
                  paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="bg-card border border-border rounded-2xl p-5"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg ai-gradient flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">
                            {method.name.charAt(0)}
                          </span>
                        </div>
                        <h3 className="font-display font-bold">
                          {method.name}
                        </h3>
                      </div>

                      {/* Address with copy */}
                      <div className="bg-secondary/60 rounded-xl p-3 flex items-center gap-2 mb-3">
                        <code className="text-sm font-mono flex-1 break-all text-foreground">
                          {method.address}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyAddress(method.address)}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-accent transition-colors group"
                          title="Copy address"
                        >
                          <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </button>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {method.instructions}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* User Details Form */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5 mb-6">
                <h2 className="font-display font-bold text-lg">Your Details</h2>

                <div className="space-y-1.5">
                  <Label htmlFor="full-name">Your Full Name</Label>
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.name)
                        setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Jane Smith"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="paypal-username">Your PayPal Username</Label>
                  <Input
                    id="paypal-username"
                    value={paypalUsername}
                    onChange={(e) => {
                      setPaypalUsername(e.target.value);
                      if (errors.paypal)
                        setErrors((prev) => ({ ...prev, paypal: undefined }));
                    }}
                    placeholder="@yourpaypalname"
                    className={errors.paypal ? "border-destructive" : ""}
                  />
                  {errors.paypal && (
                    <p className="text-xs text-destructive">{errors.paypal}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    We use this to verify your payment. Make sure it matches
                    your PayPal account.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center gap-4">
                <Button
                  onClick={handleCompletePayment}
                  size="lg"
                  className="w-full ai-gradient text-white border-0 shadow-glow font-semibold text-base"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  I've sent my payment — Continue to Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground text-center max-w-sm">
                  Your account will be activated within 24 hours after payment
                  verification. You'll receive confirmation once approved.
                </p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to plan selection
                </button>
              </div>
            </motion.div>
          )}
        </main>

        {/* ── Footer ───────────────────────────────────────── */}
        <footer className="border-t border-border bg-card mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/generated/shopforge-logo-transparent.dim_120x120.png"
                  alt="Frostify"
                  className="h-6 w-6 object-contain"
                />
                <span className="font-display font-bold">
                  Frost<span className="ai-gradient-text">ify</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()}. Built with{" "}
                <span className="text-destructive">♥</span> using{" "}
                <a
                  href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  caffeine.ai
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
