import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronRight,
  Cpu,
  Download,
  FileText,
  Home,
  LayoutGrid,
  Loader2,
  Paintbrush,
  Palette,
  Rocket,
  Shirt,
  ShoppingBasket,
  Sparkles,
  Store,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreateStore } from "../hooks/useQueries";
import { getSubscription, isSubscriptionActive } from "../utils/subscription";

const STEPS = [
  { icon: LayoutGrid, label: "Type", title: "What kind of store?" },
  { icon: Paintbrush, label: "Theme", title: "Choose a theme" },
  { icon: Palette, label: "Colors", title: "Pick your colors" },
  { icon: Store, label: "Identity", title: "Name your store" },
  { icon: FileText, label: "Details", title: "Tell your story" },
  { icon: Rocket, label: "Launch", title: "Ready to launch" },
];

const WEBSITE_TYPES = [
  { id: "fashion", label: "Fashion & Clothing", icon: Shirt },
  { id: "electronics", label: "Electronics", icon: Cpu },
  { id: "food", label: "Food & Grocery", icon: ShoppingBasket },
  { id: "beauty", label: "Beauty & Wellness", icon: Sparkles },
  { id: "home", label: "Home & Furniture", icon: Home },
  { id: "art", label: "Art & Crafts", icon: Palette },
  { id: "digital", label: "Digital Products", icon: Download },
  { id: "general", label: "General Store", icon: Store },
];

const THEMES = [
  {
    id: "modern-minimal",
    name: "Modern & Minimal",
    tagline: "Clean lines, lots of whitespace",
  },
  {
    id: "bold-vibrant",
    name: "Bold & Vibrant",
    tagline: "Eye-catching, high contrast",
  },
  {
    id: "elegant-luxury",
    name: "Elegant & Luxury",
    tagline: "Refined, sophisticated feel",
  },
  {
    id: "playful-fun",
    name: "Playful & Fun",
    tagline: "Friendly, energetic vibe",
  },
  {
    id: "classic-professional",
    name: "Classic & Professional",
    tagline: "Trustworthy, structured layout",
  },
];

const COLOR_PALETTES = [
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    colors: ["#0ea5e9", "#0284c7", "#075985", "#e0f2fe", "#ffffff"],
  },
  {
    id: "forest-green",
    name: "Forest Green",
    colors: ["#22c55e", "#16a34a", "#14532d", "#dcfce7", "#ffffff"],
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    colors: ["#f97316", "#ea580c", "#9a3412", "#ffedd5", "#ffffff"],
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    colors: ["#a855f7", "#9333ea", "#6b21a8", "#f3e8ff", "#ffffff"],
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    colors: ["#f43f5e", "#e11d48", "#9f1239", "#ffe4e6", "#ffffff"],
  },
  {
    id: "midnight-dark",
    name: "Midnight Dark",
    colors: ["#1e293b", "#0f172a", "#020617", "#334155", "#94a3b8"],
  },
];

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

export default function CreateStorePage() {
  const navigate = useNavigate();
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const createStore = useCreateStore();

  const [step, setStep] = useState(0);
  const [websiteType, setWebsiteType] = useState("");
  const [theme, setTheme] = useState("");
  const [colorPalette, setColorPalette] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isInitializing) return;
    if (!identity) {
      navigate({ to: "/login" });
      return;
    }
    const sub = getSubscription();
    if (!isSubscriptionActive(sub)) {
      navigate({ to: "/membership" });
    }
  }, [identity, isInitializing, navigate]);

  useEffect(() => {
    if (!slugManual && name) {
      setSlug(generateSlug(name));
    }
  }, [name, slugManual]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  function validateStep3() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Store name is required";
    if (name.trim().length < 3) e.name = "Name must be at least 3 characters";
    if (!slug.trim()) e.slug = "URL slug is required";
    if (!/^[a-z0-9-]+$/.test(slug))
      e.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep4() {
    const e: Record<string, string> = {};
    if (!description.trim()) e.description = "Description is required";
    if (description.trim().length < 10)
      e.description = "Description must be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    setErrors({});
    if (step === 0 && !websiteType) return;
    if (step === 1 && !theme) return;
    if (step === 2 && !colorPalette) return;
    if (step === 3 && !validateStep3()) return;
    if (step === 4 && !validateStep4()) return;
    setStep((s) => s + 1);
  }

  function isNextDisabled() {
    if (step === 0) return !websiteType;
    if (step === 1) return !theme;
    if (step === 2) return !colorPalette;
    return false;
  }

  async function handleLaunch() {
    try {
      await createStore.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
      });
      toast.success("Store created! 🎉 Welcome to Frostify!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create store";
      toast.error(
        msg.includes("slug")
          ? "That URL is already taken. Try another slug."
          : msg,
      );
    }
  }

  const selectedPalette = COLOR_PALETTES.find((p) => p.id === colorPalette);
  const selectedType = WEBSITE_TYPES.find((t) => t.id === websiteType);
  const selectedTheme = THEMES.find((t) => t.id === theme);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 hero-mesh opacity-50 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          ← Back to Home
        </Link>

        <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
          {/* Progress Header */}
          <div className="p-6 pb-0">
            <h1 className="font-display text-2xl font-black tracking-tight mb-1">
              Create Your Store
            </h1>
            <p className="text-muted-foreground text-sm">
              Step {step + 1} of {STEPS.length}
            </p>

            <div className="flex gap-1.5 mt-4">
              {STEPS.map((_s, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static fixed-length array
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                    i <= step ? "ai-gradient" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step Tabs */}
          <div className="flex border-b border-border mt-4 overflow-x-auto">
            {STEPS.map((s, i) => (
              <button
                type="button"
                // biome-ignore lint/suspicious/noArrayIndexKey: static fixed-length array
                key={i}
                onClick={() => i < step && setStep(i)}
                className={`flex-1 min-w-[60px] px-2 py-3 text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                  i === step
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : i < step
                      ? "text-success cursor-pointer"
                      : "text-muted-foreground cursor-not-allowed"
                }`}
              >
                {i < step ? (
                  <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                    <Check className="w-3 h-3 text-success-foreground" />
                  </div>
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
                <span className="hidden sm:block whitespace-nowrap">
                  {s.label}
                </span>
              </button>
            ))}
          </div>

          {/* Step Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 0 — Website Type */}
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="font-display text-xl font-bold mb-1">
                      What kind of store?
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Choose the category that best describes your business.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {WEBSITE_TYPES.map((type) => {
                      const Icon = type.icon;
                      const selected = websiteType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setWebsiteType(type.id)}
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/60 text-foreground"
                          }`}
                        >
                          {selected && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-primary-foreground" />
                            </div>
                          )}
                          <Icon className="w-6 h-6" />
                          <span className="text-xs font-medium leading-tight">
                            {type.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 1 — Theme */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="font-display text-xl font-bold mb-1">
                      Choose a theme
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Pick the visual style that fits your brand personality.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {THEMES.map((t) => {
                      const selected = theme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTheme(t.id)}
                          className={`relative flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            selected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/60"
                          }`}
                        >
                          {selected && (
                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected ? "bg-primary/20" : "bg-muted"}`}
                          >
                            <Paintbrush
                              className={`w-4 h-4 ${selected ? "text-primary" : "text-muted-foreground"}`}
                            />
                          </div>
                          <div>
                            <div
                              className={`font-semibold text-sm ${selected ? "text-primary" : "text-foreground"}`}
                            >
                              {t.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {t.tagline}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 2 — Colors */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="font-display text-xl font-bold mb-1">
                      Pick your colors
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Choose a color palette that represents your brand.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {COLOR_PALETTES.map((palette) => {
                      const selected = colorPalette === palette.id;
                      return (
                        <button
                          key={palette.id}
                          type="button"
                          onClick={() => setColorPalette(palette.id)}
                          className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            selected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/60"
                          }`}
                        >
                          <div className="flex gap-1.5 shrink-0">
                            {palette.colors.map((color) => (
                              <div
                                key={color}
                                className="w-6 h-6 rounded-full border border-border/40 shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <span
                            className={`font-medium text-sm flex-1 text-left ${selected ? "text-primary" : "text-foreground"}`}
                          >
                            {palette.name}
                          </span>
                          {selected && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 3 — Store Identity */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="font-display text-xl font-bold mb-1">
                      Name your store
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      This is what customers will see when they visit.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Store Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Urban Thread Co."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={errors.name ? "border-destructive" : ""}
                      autoFocus
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="slug">Store URL</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        frostify.io/store/
                      </span>
                      <Input
                        id="slug"
                        placeholder="urban-thread"
                        value={slug}
                        onChange={(e) => {
                          setSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, ""),
                          );
                          setSlugManual(true);
                        }}
                        className={
                          errors.slug ? "border-destructive flex-1" : "flex-1"
                        }
                      />
                    </div>
                    {errors.slug && (
                      <p className="text-xs text-destructive">{errors.slug}</p>
                    )}
                    {slug && !errors.slug && (
                      <p className="text-xs text-success">
                        ✓ frostify.io/store/{slug}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 4 — Description */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="font-display text-xl font-bold mb-1">
                      Describe your store
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Help customers understand what you sell.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="description">Store Description</Label>
                    <Textarea
                      id="description"
                      placeholder="We sell premium handcrafted goods made with love..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className={errors.description ? "border-destructive" : ""}
                      autoFocus
                    />
                    {errors.description && (
                      <p className="text-xs text-destructive">
                        {errors.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground text-right">
                      {description.length} characters
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 5 — Launch */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="font-display text-xl font-bold mb-1">
                      Ready to launch!
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Review your store details below.
                    </p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-5 space-y-4">
                    {/* Website Type */}
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Store Type
                      </div>
                      <div className="font-semibold flex items-center gap-2">
                        {selectedType && (
                          <selectedType.icon className="w-4 h-4 text-primary" />
                        )}
                        {selectedType?.label}
                      </div>
                    </div>
                    {/* Theme */}
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Theme
                      </div>
                      <div className="font-semibold">{selectedTheme?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedTheme?.tagline}
                      </div>
                    </div>
                    {/* Colors */}
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Color Palette
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {selectedPalette?.name}
                        </span>
                        <div className="flex gap-1">
                          {selectedPalette?.colors.map((color) => (
                            <div
                              key={color}
                              className="w-4 h-4 rounded-full border border-border/40"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-border/50 pt-3 space-y-3">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Store Name
                        </div>
                        <div className="font-semibold">{name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Your URL
                        </div>
                        <div className="font-mono-custom text-sm text-primary">
                          frostify.io/store/{slug}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Description
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {description}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <Rocket className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      Your store will be live immediately. You can add products
                      and customize it from the dashboard.
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={isNextDisabled()}
                  className="flex-1 ai-gradient text-white border-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleLaunch}
                  disabled={createStore.isPending || actorFetching}
                  className="flex-1 ai-gradient text-white border-0 shadow-glow-sm"
                >
                  {createStore.isPending || actorFetching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {actorFetching ? "Preparing..." : "Launching..."}
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-4 w-4" />
                      Launch My Store!
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
