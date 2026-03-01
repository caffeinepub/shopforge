import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Store } from "lucide-react";
import { motion } from "motion/react";

export default function NoStorePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 hero-mesh">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-2xl ai-gradient flex items-center justify-center mx-auto mb-6 shadow-glow">
          <Store className="w-10 h-10 text-white" />
        </div>
        <h1 className="font-display text-3xl font-black tracking-tight mb-3">
          You don't have a store yet
        </h1>
        <p className="text-muted-foreground mb-8">
          Create your store in minutes and start selling. No credit card
          required.
        </p>
        <Link to="/create-store">
          <Button
            size="lg"
            className="ai-gradient text-white border-0 shadow-glow px-8"
          >
            Create My Store
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <div className="mt-4">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
