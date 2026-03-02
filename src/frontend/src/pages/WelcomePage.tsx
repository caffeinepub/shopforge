import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Globe,
  Package,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  UserPlus,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useAllStores } from "../hooks/useQueries";

const DEMO_STORES = [
  {
    id: 1,
    name: "Urban Thread Co.",
    slug: "urban-thread",
    description:
      "Premium streetwear and urban fashion for the modern individual. Hoodies, tees, and accessories.",
    category: "Fashion",
    color: "from-violet-500/20 to-indigo-500/20",
  },
  {
    id: 2,
    name: "Bloom & Botanicals",
    slug: "bloom-botanicals",
    description:
      "Handcrafted plant arrangements and rare houseplants delivered to your door.",
    category: "Plants",
    color: "from-emerald-500/20 to-teal-500/20",
  },
  {
    id: 3,
    name: "Tech Horizons",
    slug: "tech-horizons",
    description:
      "Cutting-edge gadgets, accessories, and smart home devices at competitive prices.",
    category: "Electronics",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: 4,
    name: "Artisan Brew House",
    slug: "artisan-brew",
    description:
      "Specialty coffee beans sourced from single-origin farms. Roasted fresh weekly.",
    category: "Food & Drink",
    color: "from-amber-500/20 to-orange-500/20",
  },
  {
    id: 5,
    name: "Pixel & Print Studio",
    slug: "pixel-print",
    description:
      "Custom art prints, digital downloads, and limited edition artwork from independent artists.",
    category: "Art",
    color: "from-pink-500/20 to-rose-500/20",
  },
  {
    id: 6,
    name: "The Wellness Cabinet",
    slug: "wellness-cabinet",
    description:
      "Supplements, essential oils, and holistic wellness products for body and mind.",
    category: "Health",
    color: "from-lime-500/20 to-green-500/20",
  },
];

const FEATURES = [
  {
    icon: Globe,
    title: "Your Own Store Link",
    description:
      "Every store gets a unique URL at frostify.io/store/your-name. Share it anywhere, instantly.",
  },
  {
    icon: Bot,
    title: "AI-Powered Assistant",
    description:
      "Write product descriptions, optimize pricing, and generate SEO content with built-in AI.",
  },
  {
    icon: Package,
    title: "Product Management",
    description:
      "Add unlimited products with images, categories, stock tracking, and custom pricing.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Track revenue, orders, and top-performing products from your dashboard.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description:
      "Powered by the Internet Computer blockchain. Your data is always safe and censorship-resistant.",
  },
  {
    icon: Zap,
    title: "Launch in Minutes",
    description:
      "Go from signup to selling in under 5 minutes. No coding, no hosting fees, no limits.",
  },
];

const STEPS = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Account",
    description:
      "Sign in securely with Internet Identity — no passwords, no email required. Your identity is yours.",
  },
  {
    number: "02",
    icon: ShoppingBag,
    title: "Build Your Store",
    description:
      "Choose a membership plan, set up your store name and URL, add products with AI-assisted descriptions.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Start Selling",
    description:
      "Share your unique store link, watch orders come in, and manage everything from your dashboard.",
  },
];

const PLANS = [
  {
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function WelcomePage() {
  const { data: liveStores } = useAllStores();
  const displayStores =
    liveStores && liveStores.length > 0
      ? liveStores.slice(0, 6).map((s, i) => ({
          ...DEMO_STORES[i % DEMO_STORES.length],
          id: Number(s.id),
          name: s.name,
          slug: s.slug,
          description: s.description,
        }))
      : DEMO_STORES;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
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
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a
              href="#about"
              className="hover:text-foreground transition-colors"
            >
              About
            </a>
            <a
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="hover:text-foreground transition-colors"
            >
              Pricing
            </a>
            <Link
              to="/stores"
              className="hover:text-foreground transition-colors"
            >
              Browse Stores
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link to="/membership">
              <Button
                size="sm"
                className="ai-gradient text-white border-0 shadow-glow-sm"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden hero-mesh">
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/generated/hero-bg.dim_1600x900.jpg"
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <Badge className="mb-6 ai-gradient text-white border-0 px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered Commerce Platform
              </Badge>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black leading-none tracking-tight mb-6">
                Build Your Online
                <br />
                <span className="ai-gradient-text">Store in Minutes.</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Launch a fully-featured online store with your own URL,
                AI-powered tools, and real-time analytics. No coding required.
                No hosting fees. Powered by the decentralized web.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/membership">
                  <Button
                    size="lg"
                    className="ai-gradient text-white border-0 shadow-glow px-8 font-semibold"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/stores">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 font-semibold"
                  >
                    Browse Stores
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {["V", "A", "M"].map((l) => (
                      <div
                        key={l}
                        className="w-7 h-7 rounded-full ai-gradient flex items-center justify-center text-white text-xs font-bold border-2 border-background"
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                  <span>2,400+ stores active</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-warning text-warning"
                    />
                  ))}
                  <span className="ml-1">4.9/5</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl ai-gradient opacity-20 blur-2xl" />
                <img
                  src="/assets/generated/hero-products.dim_800x600.png"
                  alt="Store showcase"
                  className="relative rounded-2xl shadow-xl w-full object-cover"
                />
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="absolute -bottom-4 -left-4 glass rounded-2xl p-4 shadow-lg"
                >
                  <div className="text-sm font-medium text-muted-foreground">
                    Today's Revenue
                  </div>
                  <div className="text-2xl font-display font-bold text-foreground">
                    $4,238
                  </div>
                  <div className="text-xs text-success">
                    ↑ 24% from yesterday
                  </div>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{
                    duration: 3,
                    delay: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-4 -right-4 glass rounded-2xl p-3 shadow-lg flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full ai-gradient flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">AI Writing</div>
                    <div className="text-xs text-muted-foreground">
                      Product desc ready
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── About Us ──────────────────────────────────────── */}
      <section id="about" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4">
              About Us
            </Badge>
            <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight mb-6">
              We're democratizing
              <br />
              <span className="ai-gradient-text">e-commerce for everyone</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Frostify was built on a simple belief: anyone with a great idea
              should be able to sell it online — without needing a developer, a
              big budget, or technical expertise. We combine the power of the
              decentralized web with AI to give every seller an unfair
              advantage.
            </p>
          </motion.div>

          {/* Mission statement highlight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto bg-card border border-border rounded-3xl p-8 md:p-12 text-center mb-20 shadow-sm"
          >
            <div className="w-14 h-14 rounded-2xl ai-gradient flex items-center justify-center mx-auto mb-6 shadow-glow-sm">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <blockquote className="font-display text-2xl md:text-3xl font-bold tracking-tight leading-snug text-foreground mb-4">
              "Sell smarter, not harder. Your store, your rules, your future."
            </blockquote>
            <p className="text-muted-foreground">— The Frostify Mission</p>
          </motion.div>

          {/* How it Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h3 className="font-display text-3xl md:text-4xl font-black tracking-tight">
              How It Works
            </h3>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                variants={itemVariants}
                className="relative"
              >
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+3rem)] w-[calc(100%-3rem)] h-px bg-border" />
                )}
                <div className="text-center">
                  <div className="relative inline-flex">
                    <div className="w-20 h-20 rounded-2xl ai-gradient flex items-center justify-center mx-auto mb-4 shadow-glow-sm">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 font-mono-custom text-xs font-bold bg-background border border-border rounded-full w-6 h-6 flex items-center justify-center text-muted-foreground">
                      {i + 1}
                    </span>
                  </div>
                  <h4 className="font-display text-xl font-bold mb-2">
                    {step.title}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4">
              Features
            </Badge>
            <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight mb-4">
              Everything you need to
              <br />
              <span className="ai-gradient-text">sell online</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Frostify gives you all the tools to build, grow, and manage your
              online business — powered by AI.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group bg-card border border-border rounded-2xl p-6 hover:shadow-card-hover transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl ai-gradient flex items-center justify-center mb-4 shadow-glow-sm">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">
                  {f.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Featured Stores ───────────────────────────────── */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <Badge variant="secondary" className="mb-3">
                Live Stores
              </Badge>
              <h2 className="font-display text-4xl font-black tracking-tight">
                Featured Storefronts
              </h2>
            </div>
            <Link to="/stores">
              <Button variant="outline" className="hidden md:flex">
                View All Stores
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {displayStores.map((store) => (
              <motion.div
                key={store.id}
                variants={itemVariants}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <Link to="/store/$slug" params={{ slug: store.slug }}>
                  <div className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-card-hover transition-all">
                    <div
                      className={`h-32 bg-gradient-to-br ${store.color} flex items-center justify-center`}
                    >
                      <ShoppingBag className="w-10 h-10 text-foreground/30" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-display font-bold text-base">
                          {store.name}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="text-xs shrink-0 ml-2"
                        >
                          {store.category}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {store.description}
                      </p>
                      <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        Visit Store
                        <ArrowRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Pricing / Membership ──────────────────────────── */}
      <section
        id="pricing"
        className="py-24 bg-background relative overflow-hidden"
      >
        <div className="absolute inset-0 hero-mesh opacity-60" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4">
              Pricing
            </Badge>
            <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight mb-4">
              Simple, transparent
              <br />
              <span className="ai-gradient-text">pricing for every seller</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Choose a plan that fits your goals. Upgrade or downgrade anytime.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {PLANS.map((plan) => (
              <motion.div
                key={plan.name}
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative bg-card border rounded-2xl p-8 flex flex-col ${
                  plan.highlight
                    ? "border-primary shadow-glow-sm ring-1 ring-primary/30"
                    : "border-border"
                }`}
              >
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
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <div className="w-4 h-4 rounded-full ai-gradient flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/membership">
                  <Button
                    className={`w-full font-semibold ${
                      plan.highlight
                        ? "ai-gradient text-white border-0 shadow-glow-sm"
                        : ""
                    }`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    Choose Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center text-sm text-muted-foreground mt-8"
          >
            Browsing stores is always free. A membership is required to create
            and manage your own store.
          </motion.p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-10">
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
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <a
                href="#about"
                className="hover:text-foreground transition-colors"
              >
                About
              </a>
              <a
                href="#features"
                className="hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="hover:text-foreground transition-colors"
              >
                Pricing
              </a>
              <Link
                to="/stores"
                className="hover:text-foreground transition-colors"
              >
                Browse Stores
              </Link>
              <Link
                to="/login"
                className="hover:text-foreground transition-colors"
              >
                Log In
              </Link>
            </nav>
            <div className="flex items-center gap-4">
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
              <Link
                to="/staff"
                className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                Staff
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
