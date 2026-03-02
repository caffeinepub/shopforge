import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  Edit2,
  Lock,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const STAFF_PIN = "141206";

interface PaymentMethod {
  id: number;
  name: string;
  address: string;
  instructions: string;
  isActive: boolean;
}

interface Subscription {
  id: number;
  name: string;
  paypalUsername: string;
  plan: string;
  status: "pending" | "active" | "cancelled";
  joinedAt: string;
}

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
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

function loadPaymentMethods(): PaymentMethod[] {
  try {
    const stored = localStorage.getItem("frostify_payment_methods");
    if (stored) return JSON.parse(stored) as PaymentMethod[];
  } catch {
    // ignore
  }
  return DEFAULT_PAYMENT_METHODS;
}

function savePaymentMethods(methods: PaymentMethod[]) {
  localStorage.setItem("frostify_payment_methods", JSON.stringify(methods));
}

function loadSubscriptions(): Subscription[] {
  try {
    const stored = localStorage.getItem("frostify_subscriptions");
    if (stored) return JSON.parse(stored) as Subscription[];
  } catch {
    // ignore
  }
  return [];
}

function saveSubscriptions(subs: Subscription[]) {
  localStorage.setItem("frostify_subscriptions", JSON.stringify(subs));
}

// ── Plan Prices ───────────────────────────────────────────────
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

function savePlanPrices(prices: {
  starter: number;
  pro: number;
  enterprise: number;
}) {
  localStorage.setItem("frostify_plan_prices", JSON.stringify(prices));
}

function StatusBadge({ status }: { status: Subscription["status"] }) {
  if (status === "active")
    return (
      <Badge className="bg-success/20 text-success border-success/30">
        Active
      </Badge>
    );
  if (status === "cancelled")
    return <Badge variant="destructive">Cancelled</Badge>;
  return (
    <Badge className="bg-warning/20 text-warning border-warning/30">
      Pending
    </Badge>
  );
}

// ── PIN Entry Screen ──────────────────────────────────────────
function PinEntry({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === STAFF_PIN) {
      onSuccess();
    } else {
      setError("Incorrect PIN. Please try again.");
      setPin("");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  }

  return (
    <div className="min-h-screen bg-background hero-mesh flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/80" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Home
        </Link>

        <motion.div
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="bg-card border border-border rounded-3xl p-8 shadow-xl"
        >
          {/* Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl ai-gradient flex items-center justify-center mb-4 shadow-glow">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-center">
              Staff Access
            </h1>
            <p className="text-muted-foreground text-sm mt-2 text-center">
              Enter your PIN to access the staff payment panel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pin" className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Staff Access PIN
              </Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
                placeholder="••••••"
                className={`text-center text-xl tracking-[0.5em] h-12 ${error ? "border-destructive" : ""}`}
                autoFocus
              />
              {error && (
                <p className="text-xs text-destructive text-center">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full ai-gradient text-white border-0 shadow-glow font-semibold"
              disabled={pin.length !== 6}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Unlock Staff Panel
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            This area is restricted to authorized staff only.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Payment Method Form ───────────────────────────────────────
interface MethodFormData {
  name: string;
  address: string;
  instructions: string;
  isActive: boolean;
}

const EMPTY_METHOD: MethodFormData = {
  name: "",
  address: "",
  instructions: "",
  isActive: true,
};

// ── Main Staff Panel ──────────────────────────────────────────
function StaffPanel() {
  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethod[]>(loadPaymentMethods);
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>(loadSubscriptions);

  // Payment method dialog
  const [methodDialogOpen, setMethodDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [methodForm, setMethodForm] = useState<MethodFormData>(EMPTY_METHOD);
  const [methodErrors, setMethodErrors] = useState<
    Partial<Record<keyof MethodFormData, string>>
  >({});

  // Cancel/reactivate confirmation
  const [cancelSubId, setCancelSubId] = useState<number | null>(null);
  const [reactivateSubId, setReactivateSubId] = useState<number | null>(null);

  // Plan pricing
  const [planPrices, setPlanPrices] = useState(loadPlanPrices);
  const [editingPlanId, setEditingPlanId] = useState<
    "starter" | "pro" | "enterprise" | null
  >(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>("");

  // ── Payment Methods handlers ──
  function openAddMethod() {
    setEditingMethod(null);
    setMethodForm(EMPTY_METHOD);
    setMethodErrors({});
    setMethodDialogOpen(true);
  }

  function openEditMethod(m: PaymentMethod) {
    setEditingMethod(m);
    setMethodForm({
      name: m.name,
      address: m.address,
      instructions: m.instructions,
      isActive: m.isActive,
    });
    setMethodErrors({});
    setMethodDialogOpen(true);
  }

  function validateMethodForm() {
    const e: Partial<Record<keyof MethodFormData, string>> = {};
    if (!methodForm.name.trim()) e.name = "Name is required";
    if (!methodForm.address.trim()) e.address = "Address / details is required";
    if (!methodForm.instructions.trim())
      e.instructions = "Instructions are required";
    setMethodErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSaveMethod() {
    if (!validateMethodForm()) return;
    let updated: PaymentMethod[];
    if (editingMethod) {
      updated = paymentMethods.map((m) =>
        m.id === editingMethod.id
          ? {
              ...m,
              name: methodForm.name.trim(),
              address: methodForm.address.trim(),
              instructions: methodForm.instructions.trim(),
              isActive: methodForm.isActive,
            }
          : m,
      );
      toast.success("Payment method updated!");
    } else {
      const newMethod: PaymentMethod = {
        id: Date.now(),
        name: methodForm.name.trim(),
        address: methodForm.address.trim(),
        instructions: methodForm.instructions.trim(),
        isActive: methodForm.isActive,
      };
      updated = [...paymentMethods, newMethod];
      toast.success("Payment method added!");
    }
    setPaymentMethods(updated);
    savePaymentMethods(updated);
    setMethodDialogOpen(false);
  }

  function handleDeleteMethod(id: number) {
    const updated = paymentMethods.filter((m) => m.id !== id);
    setPaymentMethods(updated);
    savePaymentMethods(updated);
    toast.success("Payment method removed.");
  }

  function handleToggleMethodActive(id: number) {
    const updated = paymentMethods.map((m) =>
      m.id === id ? { ...m, isActive: !m.isActive } : m,
    );
    setPaymentMethods(updated);
    savePaymentMethods(updated);
  }

  // ── Subscription handlers ──
  function handleCancelSubscription(id: number) {
    const updated = subscriptions.map((s) =>
      s.id === id ? { ...s, status: "cancelled" as const } : s,
    );
    setSubscriptions(updated);
    saveSubscriptions(updated);
    setCancelSubId(null);
    toast.success("Subscription cancelled.");
  }

  function handleReactivateSubscription(id: number) {
    const updated = subscriptions.map((s) =>
      s.id === id ? { ...s, status: "pending" as const } : s,
    );
    setSubscriptions(updated);
    saveSubscriptions(updated);
    setReactivateSubId(null);
    toast.success("Subscription reactivated to pending review.");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg ai-gradient flex items-center justify-center shadow-glow-sm">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-base">
                Staff Panel
              </span>
              <span className="text-muted-foreground text-sm ml-2">
                — Frost<span className="ai-gradient-text">ify</span>
              </span>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit Staff Panel
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Page title */}
          <div className="mb-8">
            <Badge className="mb-3 ai-gradient text-white border-0 px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              Staff Only
            </Badge>
            <h1 className="font-display text-3xl font-black tracking-tight">
              Payment & Subscription Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure payment methods and manage user subscriptions.
            </p>
          </div>

          <Tabs defaultValue="payments" className="space-y-6">
            <TabsList className="grid w-full max-w-sm grid-cols-3">
              <TabsTrigger
                value="payments"
                className="flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="subs" className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Subscriptions
              </TabsTrigger>
              <TabsTrigger
                value="pricing"
                className="flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Pricing
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Payment Configuration ── */}
            <TabsContent value="payments" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-black">
                    Payment Methods
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {paymentMethods.length} method
                    {paymentMethods.length !== 1 ? "s" : ""} configured
                  </p>
                </div>
                <Button
                  onClick={openAddMethod}
                  className="ai-gradient text-white border-0"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Method
                </Button>
              </div>

              {paymentMethods.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-2xl">
                  <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="font-display font-bold text-lg mb-1">
                    No payment methods yet
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Add your first payment method for users to pay with.
                  </p>
                  <Button
                    onClick={openAddMethod}
                    className="ai-gradient text-white border-0"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </Button>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Method</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Address / Details
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">
                          Instructions
                        </TableHead>
                        <TableHead className="text-center">Active</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentMethods.map((method) => (
                        <TableRow key={method.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg ai-gradient flex items-center justify-center shrink-0">
                                <span className="text-white text-xs font-bold">
                                  {method.name.charAt(0)}
                                </span>
                              </div>
                              <span className="font-medium text-sm">
                                {method.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <code className="text-xs font-mono bg-secondary px-2 py-1 rounded-lg break-all">
                              {method.address}
                            </code>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-xs text-muted-foreground line-clamp-2">
                              {method.instructions}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={method.isActive}
                              onCheckedChange={() =>
                                handleToggleMethodActive(method.id)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditMethod(method)}
                                title="Edit method"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteMethod(method.id)}
                                title="Delete method"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* ── Tab 3: Pricing ── */}
            <TabsContent value="pricing" className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-black">
                  Membership Pricing
                </h2>
                <p className="text-muted-foreground text-sm">
                  These prices are shown to users on the membership page.
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                Prices set here are shown to users on the membership page.
                Changes take effect immediately.
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Monthly Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(
                      [
                        { id: "starter" as const, name: "Starter" },
                        { id: "pro" as const, name: "Pro" },
                        { id: "enterprise" as const, name: "Enterprise" },
                      ] as const
                    ).map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg ai-gradient flex items-center justify-center shrink-0">
                              <span className="text-white text-xs font-bold">
                                {plan.name.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-sm">
                              {plan.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingPlanId === plan.id ? (
                            <div className="flex items-center gap-2 max-w-[160px]">
                              <span className="text-muted-foreground text-sm">
                                $
                              </span>
                              <Input
                                type="number"
                                min="1"
                                step="0.01"
                                value={editingPriceValue}
                                onChange={(e) =>
                                  setEditingPriceValue(e.target.value)
                                }
                                className="h-8 w-24 text-sm"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <span className="font-semibold text-sm">
                              ${planPrices[plan.id]}
                              <span className="text-muted-foreground font-normal">
                                /mo
                              </span>
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingPlanId === plan.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                className="h-7 text-xs ai-gradient text-white border-0"
                                onClick={() => {
                                  const val =
                                    Number.parseFloat(editingPriceValue);
                                  if (Number.isNaN(val) || val < 1) {
                                    toast.error("Price must be at least $1");
                                    return;
                                  }
                                  const updated = {
                                    ...planPrices,
                                    [plan.id]: val,
                                  };
                                  setPlanPrices(updated);
                                  savePlanPrices(updated);
                                  setEditingPlanId(null);
                                  toast.success("Prices updated.");
                                }}
                              >
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setEditingPlanId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingPlanId(plan.id);
                                setEditingPriceValue(
                                  planPrices[plan.id].toString(),
                                );
                              }}
                              title={`Edit ${plan.name} price`}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ── Tab 2: Subscription Management ── */}
            <TabsContent value="subs" className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-black">
                  Subscriber Management
                </h2>
                <p className="text-muted-foreground text-sm">
                  {subscriptions.length} subscriber
                  {subscriptions.length !== 1 ? "s" : ""} registered
                </p>
              </div>

              {subscriptions.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-2xl">
                  <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="font-display font-bold text-lg mb-1">
                    No subscribers yet
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Subscribers will appear here after users complete the
                    membership sign-up flow.
                  </p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          PayPal Username
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Plan
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">
                          Date Joined
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium text-sm">
                            {sub.name}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <code className="text-xs bg-secondary px-2 py-0.5 rounded-md">
                              {sub.paypalUsername}
                            </code>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="secondary" className="text-xs">
                              {sub.plan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={sub.status} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {new Date(sub.joinedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {sub.status !== "cancelled" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                                  onClick={() => setCancelSubId(sub.id)}
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs text-success border-success/30 hover:bg-success/10"
                                  onClick={() => setReactivateSubId(sub.id)}
                                >
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  Reactivate
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Frostify — Staff Portal. Built with{" "}
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
      </footer>

      {/* ── Add / Edit Payment Method Dialog ── */}
      <Dialog open={methodDialogOpen} onOpenChange={setMethodDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingMethod ? "Edit Payment Method" : "Add Payment Method"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="m-name">Method Name</Label>
              <Input
                id="m-name"
                value={methodForm.name}
                onChange={(e) =>
                  setMethodForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. PayPal, Bitcoin, Bank Transfer"
                className={methodErrors.name ? "border-destructive" : ""}
              />
              {methodErrors.name && (
                <p className="text-xs text-destructive">{methodErrors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-address">Address / Details</Label>
              <Input
                id="m-address"
                value={methodForm.address}
                onChange={(e) =>
                  setMethodForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="e.g. payments@frostify.io or wallet address"
                className={methodErrors.address ? "border-destructive" : ""}
              />
              {methodErrors.address && (
                <p className="text-xs text-destructive">
                  {methodErrors.address}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-instructions">Instructions</Label>
              <Textarea
                id="m-instructions"
                value={methodForm.instructions}
                onChange={(e) =>
                  setMethodForm((f) => ({ ...f, instructions: e.target.value }))
                }
                placeholder="Instructions shown to users on payment page..."
                rows={3}
                className={
                  methodErrors.instructions ? "border-destructive" : ""
                }
              />
              {methodErrors.instructions && (
                <p className="text-xs text-destructive">
                  {methodErrors.instructions}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="m-active"
                checked={methodForm.isActive}
                onCheckedChange={(v) =>
                  setMethodForm((f) => ({ ...f, isActive: v }))
                }
              />
              <Label htmlFor="m-active">
                Active (shown to users during sign-up)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMethodDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveMethod}
              className="ai-gradient text-white border-0"
            >
              {editingMethod ? "Save Changes" : "Add Method"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Subscription Confirmation ── */}
      <AlertDialog
        open={cancelSubId !== null}
        onOpenChange={(o) => !o && setCancelSubId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this subscription? The user's
              status will be set to "cancelled" and they will see a warning in
              their dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Active</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                cancelSubId !== null && handleCancelSubscription(cancelSubId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Reactivate Subscription Confirmation ── */}
      <AlertDialog
        open={reactivateSubId !== null}
        onOpenChange={(o) => !o && setReactivateSubId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              This will set the subscription status back to "pending" for manual
              review. The user will see their payment is under review again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                reactivateSubId !== null &&
                handleReactivateSubscription(reactivateSubId)
              }
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              Reactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Default export: PIN gate + panel ─────────────────────────
export default function StaffPaymentPanel() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <PinEntry onSuccess={() => setUnlocked(true)} />;
  }

  return <StaffPanel />;
}
