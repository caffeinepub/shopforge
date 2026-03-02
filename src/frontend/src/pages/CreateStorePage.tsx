import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronRight,
  FileText,
  Loader2,
  Rocket,
  Store,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreateStore } from "../hooks/useQueries";

const STEPS = [
  { icon: Store, label: "Store Identity", title: "Name your store" },
  { icon: FileText, label: "Description", title: "Tell your story" },
  { icon: Rocket, label: "Launch", title: "Ready to launch" },
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
  const { identity } = useInternetIdentity();
  const createStore = useCreateStore();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!identity) {
      navigate({ to: "/login" });
    }
  }, [identity, navigate]);

  useEffect(() => {
    if (!slugManual && name) {
      setSlug(generateSlug(name));
    }
  }, [name, slugManual]);

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Store name is required";
    if (name.trim().length < 3) e.name = "Name must be at least 3 characters";
    if (!slug.trim()) e.slug = "URL slug is required";
    if (!/^[a-z0-9-]+$/.test(slug))
      e.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (!description.trim()) e.description = "Description is required";
    if (description.trim().length < 10)
      e.description = "Description must be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 hero-mesh opacity-50 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
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
              Step {step + 1} of 3
            </p>

            <div className="flex gap-2 mt-4">
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
          <div className="flex border-b border-border mt-4">
            {STEPS.map((s, i) => (
              <button
                type="button"
                // biome-ignore lint/suspicious/noArrayIndexKey: static fixed-length array
                key={i}
                onClick={() => i < step && setStep(i)}
                className={`flex-1 px-3 py-3 text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
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
                <span className="hidden sm:block">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Step Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
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
                      Ready to launch!
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Review your store details below.
                    </p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-5 space-y-3">
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
              {step < 2 ? (
                <Button
                  onClick={() => {
                    const valid =
                      step === 0 ? validateStep1() : validateStep2();
                    if (valid) setStep((s) => s + 1);
                  }}
                  className="flex-1 ai-gradient text-white border-0"
                >
                  Continue
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleLaunch}
                  disabled={createStore.isPending}
                  className="flex-1 ai-gradient text-white border-0 shadow-glow-sm"
                >
                  {createStore.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Launching...
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
