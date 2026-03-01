import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Search, ShoppingBag, Store } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useAllStores } from "../hooks/useQueries";

const CATEGORY_COLORS: Record<number, string> = {
  0: "from-violet-500/20 to-indigo-500/20",
  1: "from-emerald-500/20 to-teal-500/20",
  2: "from-blue-500/20 to-cyan-500/20",
  3: "from-amber-500/20 to-orange-500/20",
  4: "from-pink-500/20 to-rose-500/20",
  5: "from-lime-500/20 to-green-500/20",
};

export default function StoresPage() {
  const [search, setSearch] = useState("");
  const { data: stores, isLoading } = useAllStores();

  const filtered = (stores ?? []).filter(
    (s) =>
      s.isActive &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/assets/generated/shopforge-logo-transparent.dim_120x120.png"
              alt="ShopForge"
              className="h-7 w-7 object-contain"
            />
            <span className="font-display font-bold text-lg">
              Shop<span className="ai-gradient-text">Forge</span>
            </span>
          </Link>
          <Link to="/login">
            <Badge className="ai-gradient text-white border-0 cursor-pointer px-3">
              Start Selling
            </Badge>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4">
            <Store className="w-3 h-3 mr-1" />
            Store Directory
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight mb-4">
            Discover Amazing Stores
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            Browse thousands of independent stores powered by ShopForge.
          </p>
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search stores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
        </motion.div>

        {/* Stores Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }, (_, i) => `sk-${i}`).map((k) => (
              <div
                key={k}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                <Skeleton className="h-32" />
                <div className="p-5 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">
              No stores found
            </h3>
            <p className="text-muted-foreground">
              {search
                ? "Try a different search term."
                : "Be the first to create a store!"}
            </p>
            {!search && (
              <Link to="/login" className="mt-4 inline-block">
                <Badge className="ai-gradient text-white border-0 cursor-pointer mt-4 px-4 py-2">
                  Create Your Store
                </Badge>
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filtered.map((store, idx) => (
              <motion.div
                key={store.id.toString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <Link to="/store/$slug" params={{ slug: store.slug }}>
                  <div className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-card-hover transition-all h-full">
                    <div
                      className={`h-32 bg-gradient-to-br ${CATEGORY_COLORS[idx % 6]} flex items-center justify-center`}
                    >
                      <ShoppingBag className="w-10 h-10 text-foreground/30" />
                    </div>
                    <div className="p-5">
                      <h3 className="font-display font-bold text-base mb-1">
                        {store.name}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {store.description}
                      </p>
                      <div className="flex items-center text-sm font-medium text-primary">
                        Visit Store
                        <ArrowRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
