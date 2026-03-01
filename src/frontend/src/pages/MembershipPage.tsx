import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Globe,
  Shield,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$9",
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
    id: "pro",
    name: "Pro",
    price: "$29",
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
    id: "enterprise",
    name: "Enterprise",
    price: "$99",
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
    description: "Share your store at shopforge.io/store/your-name",
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

export default function MembershipPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");
  const navigate = useNavigate();

  function handleContinue() {
    localStorage.setItem("selectedPlan", selectedPlan);
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
                alt="ShopForge"
                className="h-8 w-8 object-contain"
              />
              <span className="font-display font-bold text-xl tracking-tight">
                Shop<span className="ai-gradient-text">Forge</span>
              </span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16 max-w-6xl">
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
              <span className="ai-gradient-text">the right plan for you</span>
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

          {/* ── CTA ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <Button
              onClick={handleContinue}
              size="lg"
              className="ai-gradient text-white border-0 shadow-glow px-10 font-semibold text-base"
            >
              Continue to Login
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
        </main>

        {/* ── Footer ───────────────────────────────────────── */}
        <footer className="border-t border-border bg-card mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/generated/shopforge-logo-transparent.dim_120x120.png"
                  alt="ShopForge"
                  className="h-6 w-6 object-contain"
                />
                <span className="font-display font-bold">
                  Shop<span className="ai-gradient-text">Forge</span>
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
