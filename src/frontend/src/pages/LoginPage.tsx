import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, Shield, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMyStore } from "../hooks/useQueries";
import { getSubscription, isSubscriptionActive } from "../utils/subscription";

export default function LoginPage() {
  const { login, isLoggingIn, isLoginSuccess, identity } =
    useInternetIdentity();
  const navigate = useNavigate();
  const { data: myStore, isLoading: storeLoading } = useMyStore();

  useEffect(() => {
    if (isLoginSuccess && identity && !storeLoading) {
      const sub = getSubscription();
      if (!isSubscriptionActive(sub)) {
        navigate({ to: "/membership" });
        return;
      }
      if (myStore) {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/create-store" });
      }
    }
  }, [isLoginSuccess, identity, myStore, storeLoading, navigate]);

  // Already logged in
  useEffect(() => {
    if (identity && !storeLoading) {
      const sub = getSubscription();
      if (!isSubscriptionActive(sub)) {
        navigate({ to: "/membership" });
        return;
      }
      if (myStore) {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/create-store" });
      }
    }
  }, [identity, myStore, storeLoading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 hero-mesh">
      <div className="absolute inset-0 opacity-30">
        <img
          src="/assets/generated/hero-bg.dim_1600x900.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background/90" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          ← Back to Home
        </Link>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl ai-gradient flex items-center justify-center mb-4 shadow-glow">
              <img
                src="/assets/generated/shopforge-logo-transparent.dim_120x120.png"
                alt="Frostify"
                className="w-10 h-10 object-contain"
              />
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight">
              Welcome to Frost<span className="ai-gradient-text">ify</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-2 text-center">
              Sign in or create your account to start selling
            </p>
          </div>

          {/* Login Button */}
          <Button
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="w-full ai-gradient text-white border-0 shadow-glow font-semibold text-base h-12"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Continue with Internet Identity
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {/* Info */}
          <div className="mt-6 space-y-3">
            {[
              "Secure, passwordless authentication",
              "No email or personal data required",
              "Your keys, your identity",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <div className="w-4 h-4 rounded-full ai-gradient flex items-center justify-center shrink-0">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
                {item}
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Internet Identity is a blockchain-based authentication system by the
            Internet Computer. No passwords, no tracking.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
