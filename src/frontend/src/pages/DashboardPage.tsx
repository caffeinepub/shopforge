import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarClock,
  Check,
  CreditCard,
  Crown,
  DollarSign,
  Edit2,
  ExternalLink,
  ImagePlus,
  Info,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Send,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Snowflake,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { OrderStatus } from "../backend";
import type {
  Order,
  Product,
  StoreMembership,
  StorePaymentInfo,
} from "../backend.d.ts";
import { useCurrency } from "../hooks/useCurrency";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddProduct,
  useAddStoreMembership,
  useAiAssist,
  useDeleteProduct,
  useDeleteStoreMembership,
  useMembershipsByStore,
  useMyStore,
  useOrdersByStore,
  useProductsByStore,
  useSaveStorePaymentInfo,
  useStoreAnalytics,
  useStorePaymentInfo,
  useUpdateOrderStatus,
  useUpdateProduct,
  useUpdateStore,
  useUpdateStoreMembership,
} from "../hooks/useQueries";
import {
  cancelSubscription,
  formatExpiryDate,
  getDaysUntilExpiry,
  getSubscription,
  isSubscriptionActive,
  isSubscriptionExpired,
  isSubscriptionExpiringSoon,
} from "../utils/subscription";

type DashTab =
  | "overview"
  | "products"
  | "memberships"
  | "orders"
  | "analytics"
  | "ai"
  | "settings";

function formatDate(time: bigint) {
  return new Date(Number(time) / 1_000_000).toLocaleDateString();
}

function StatusBadge({ status }: { status: OrderStatus }) {
  if (status === OrderStatus.fulfilled)
    return (
      <Badge className="bg-success/20 text-success border-success/30">
        Fulfilled
      </Badge>
    );
  if (status === OrderStatus.cancelled)
    return <Badge variant="destructive">Cancelled</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isNew?: boolean;
}

function useTypewriter(text: string, active: boolean, speed = 15) {
  const [displayed, setDisplayed] = useState(text);
  useEffect(() => {
    if (!active) {
      setDisplayed(text);
      return;
    }
    setDisplayed("");
    let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text, active, speed]);
  return displayed;
}

function TypewriterMsg({ text, active }: { text: string; active: boolean }) {
  const displayed = useTypewriter(text, active);
  return <span className="whitespace-pre-wrap">{displayed}</span>;
}

// ── Product Form ─────────────────────────────────────────────
interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
}

const EMPTY_PRODUCT: ProductFormData = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "",
};

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Sports",
  "Books",
  "Food & Drink",
  "Art",
  "Health",
  "Toys",
  "Other",
];

// ── Membership Form ──────────────────────────────────────────
interface MembershipFormData {
  name: string;
  description: string;
  price: string;
  durationDays: string;
  perks: string[];
  isActive: boolean;
}

const EMPTY_MEMBERSHIP: MembershipFormData = {
  name: "",
  description: "",
  price: "",
  durationDays: "30",
  perks: [],
  isActive: true,
};

// ── Payment Info Form ─────────────────────────────────────────
interface PaymentFormData {
  paypalEnabled: boolean;
  paypalEmail: string;
  paypalUsername: string;
  bankEnabled: boolean;
  bankName: string;
  accountNumber: string;
  sortCode: string;
  stripeEnabled: boolean;
  stripeAccountId: string;
}

const EMPTY_PAYMENT: PaymentFormData = {
  paypalEnabled: false,
  paypalEmail: "",
  paypalUsername: "",
  bankEnabled: false,
  bankName: "",
  accountNumber: "",
  sortCode: "",
  stripeEnabled: false,
  stripeAccountId: "",
};

// ── Media Preview Item ────────────────────────────────────────
interface MediaPreview {
  file: File;
  previewUrl: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { clear, identity } = useInternetIdentity();
  const { currency, setCurrency, formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<DashTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [expirySoonDismissed, setExpirySoonDismissed] = useState(false);
  const subscription = getSubscription();

  const { data: store, isLoading: storeLoading } = useMyStore();

  // Redirect if not authenticated or no store
  useEffect(() => {
    if (!identity) {
      navigate({ to: "/login" });
      return;
    }
  }, [identity, navigate]);

  useEffect(() => {
    if (!storeLoading && !store && identity) {
      navigate({ to: "/create-store" });
    }
  }, [store, storeLoading, identity, navigate]);

  // Hard subscription gate
  useEffect(() => {
    if (!identity) return;
    if (
      !subscription ||
      subscription.status === "cancelled" ||
      isSubscriptionExpired(subscription)
    ) {
      const params = isSubscriptionExpired(subscription) ? "?expired=1" : "";
      navigate({ to: `/membership${params}` as "/" });
      return;
    }
  }, [identity, navigate, subscription]);

  const { data: products, isLoading: productsLoading } = useProductsByStore(
    store?.id,
  );
  const { data: orders, isLoading: ordersLoading } = useOrdersByStore(
    store?.id,
  );
  const { data: analytics, isLoading: analyticsLoading } = useStoreAnalytics(
    store?.id,
  );
  const { data: memberships, isLoading: membershipsLoading } =
    useMembershipsByStore(store?.id);
  const { data: paymentInfo } = useStorePaymentInfo(store?.id);

  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateOrder = useUpdateOrderStatus();
  const updateStore = useUpdateStore();
  const aiAssist = useAiAssist();
  const addMembership = useAddStoreMembership();
  const updateMembership = useUpdateStoreMembership();
  const deleteMembership = useDeleteStoreMembership();
  const savePaymentInfo = useSaveStorePaymentInfo();

  // Product dialog
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] =
    useState<ProductFormData>(EMPTY_PRODUCT);
  const [productErrors, setProductErrors] = useState<Record<string, string>>(
    {},
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<bigint | null>(null);

  // Product media
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Membership dialog
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [editingMembership, setEditingMembership] =
    useState<StoreMembership | null>(null);
  const [membershipForm, setMembershipForm] =
    useState<MembershipFormData>(EMPTY_MEMBERSHIP);
  const [membershipErrors, setMembershipErrors] = useState<
    Record<string, string>
  >({});
  const [newPerkInput, setNewPerkInput] = useState("");
  const [deleteMembershipId, setDeleteMembershipId] = useState<bigint | null>(
    null,
  );

  // Payment form
  const [paymentForm, setPaymentForm] =
    useState<PaymentFormData>(EMPTY_PAYMENT);

  // Load payment info when available
  useEffect(() => {
    if (paymentInfo) {
      setPaymentForm({
        paypalEnabled: paymentInfo.enabledChannels.includes("paypal"),
        paypalEmail: paymentInfo.paypalEmail ?? "",
        paypalUsername: paymentInfo.paypalUsername ?? "",
        bankEnabled: paymentInfo.enabledChannels.includes("bank"),
        bankName: paymentInfo.bankName ?? "",
        accountNumber: paymentInfo.accountNumber ?? "",
        sortCode: paymentInfo.sortCode ?? "",
        stripeEnabled: paymentInfo.enabledChannels.includes("stripe"),
        stripeAccountId: paymentInfo.stripeAccountId ?? "",
      });
    }
  }, [paymentInfo]);

  // Settings
  const [settingsName, setSettingsName] = useState("");
  const [settingsDesc, setSettingsDesc] = useState("");

  useEffect(() => {
    if (store) {
      setSettingsName(store.name);
      setSettingsDesc(store.description);
    }
  }, [store]);

  // AI Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [lastAiIdx, setLastAiIdx] = useState(-1);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiAssist.isPending]);

  // Clean up media preview URLs on unmount
  useEffect(() => {
    return () => {
      for (const m of mediaPreviews) {
        URL.revokeObjectURL(m.previewUrl);
      }
    };
  }, [mediaPreviews]);

  const NAV_ITEMS: {
    id: DashTab;
    icon: typeof LayoutDashboard;
    label: string;
  }[] = [
    { id: "overview", icon: LayoutDashboard, label: "Overview" },
    { id: "products", icon: Package, label: "Products" },
    { id: "memberships", icon: Crown, label: "Memberships" },
    { id: "orders", icon: ShoppingCart, label: "Orders" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "ai", icon: Snowflake, label: "Frost AI" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  // ── Product handlers ──────────────────────────────────────
  function openAddProduct() {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setProductErrors({});
    setMediaPreviews([]);
    setProductDialogOpen(true);
  }

  function openEditProduct(p: Product) {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description,
      price: (Number(p.price) / 100).toFixed(2),
      stock: p.stock.toString(),
      category: p.category,
    });
    setProductErrors({});
    setMediaPreviews([]);
    setProductDialogOpen(true);
  }

  function validateProductForm() {
    const e: Record<string, string> = {};
    if (!productForm.name.trim()) e.name = "Name is required";
    if (!productForm.description.trim())
      e.description = "Description is required";
    const price = Number.parseFloat(productForm.price);
    if (Number.isNaN(price) || price < 0) e.price = "Valid price required";
    const stock = Number.parseInt(productForm.stock);
    if (Number.isNaN(stock) || stock < 0) e.stock = "Valid stock required";
    if (!productForm.category) e.category = "Category is required";
    setProductErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSaveProduct() {
    if (!validateProductForm() || !store) return;
    const priceCents = BigInt(
      Math.round(Number.parseFloat(productForm.price) * 100),
    );
    const stockInt = BigInt(Number.parseInt(productForm.stock));
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          productId: editingProduct.id,
          storeId: store.id,
          name: productForm.name.trim(),
          description: productForm.description.trim(),
          price: priceCents,
          stock: stockInt,
          mediaIds: null,
        });
        toast.success("Product updated!");
      } else {
        await addProduct.mutateAsync({
          storeId: store.id,
          name: productForm.name.trim(),
          description: productForm.description.trim(),
          price: priceCents,
          stock: stockInt,
          category: productForm.category,
        });
        toast.success("Product added!");
      }
      setProductDialogOpen(false);
    } catch {
      toast.error("Failed to save product");
    }
  }

  async function handleDeleteProduct() {
    if (!deleteConfirmId || !store) return;
    try {
      await deleteProduct.mutateAsync({
        productId: deleteConfirmId,
        storeId: store.id,
      });
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleteConfirmId(null);
    }
  }

  function handleMediaFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newPreviews: MediaPreview[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setMediaPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  }

  function removeMediaPreview(idx: number) {
    setMediaPreviews((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }

  // ── Membership handlers ───────────────────────────────────
  function openAddMembership() {
    setEditingMembership(null);
    setMembershipForm(EMPTY_MEMBERSHIP);
    setMembershipErrors({});
    setNewPerkInput("");
    setMembershipDialogOpen(true);
  }

  function openEditMembership(m: StoreMembership) {
    setEditingMembership(m);
    setMembershipForm({
      name: m.name,
      description: m.description,
      price: (Number(m.price) / 100).toFixed(2),
      durationDays: m.durationDays.toString(),
      perks: [...m.perks],
      isActive: m.isActive,
    });
    setMembershipErrors({});
    setNewPerkInput("");
    setMembershipDialogOpen(true);
  }

  function validateMembershipForm() {
    const e: Record<string, string> = {};
    if (!membershipForm.name.trim()) e.name = "Name is required";
    if (!membershipForm.description.trim())
      e.description = "Description is required";
    const price = Number.parseFloat(membershipForm.price);
    if (Number.isNaN(price) || price < 0) e.price = "Valid price required";
    const days = Number.parseInt(membershipForm.durationDays);
    if (Number.isNaN(days) || days < 1)
      e.durationDays = "Must be at least 1 day";
    setMembershipErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSaveMembership() {
    if (!validateMembershipForm() || !store) return;
    const priceCents = BigInt(
      Math.round(Number.parseFloat(membershipForm.price) * 100),
    );
    const days = BigInt(Number.parseInt(membershipForm.durationDays));
    try {
      if (editingMembership) {
        await updateMembership.mutateAsync({
          membershipId: editingMembership.id,
          storeId: store.id,
          name: membershipForm.name.trim(),
          description: membershipForm.description.trim(),
          price: priceCents,
          durationDays: days,
          perks: membershipForm.perks,
          isActive: membershipForm.isActive,
        });
        toast.success("Membership updated!");
      } else {
        await addMembership.mutateAsync({
          storeId: store.id,
          name: membershipForm.name.trim(),
          description: membershipForm.description.trim(),
          price: priceCents,
          durationDays: days,
          perks: membershipForm.perks,
        });
        toast.success("Membership created!");
      }
      setMembershipDialogOpen(false);
    } catch {
      toast.error("Failed to save membership");
    }
  }

  async function handleDeleteMembership() {
    if (!deleteMembershipId || !store) return;
    try {
      await deleteMembership.mutateAsync({
        membershipId: deleteMembershipId,
        storeId: store.id,
      });
      toast.success("Membership deleted");
    } catch {
      toast.error("Failed to delete membership");
    } finally {
      setDeleteMembershipId(null);
    }
  }

  function addPerk() {
    const trimmed = newPerkInput.trim();
    if (!trimmed) return;
    setMembershipForm((f) => ({ ...f, perks: [...f.perks, trimmed] }));
    setNewPerkInput("");
  }

  function removePerk(idx: number) {
    setMembershipForm((f) => ({
      ...f,
      perks: f.perks.filter((_, i) => i !== idx),
    }));
  }

  // ── Order handlers ────────────────────────────────────────
  async function handleUpdateOrderStatus(order: Order, status: OrderStatus) {
    if (!store) return;
    try {
      await updateOrder.mutateAsync({
        orderId: order.id,
        status,
        storeId: store.id,
      });
      toast.success(`Order marked as ${status}`);
    } catch {
      toast.error("Failed to update order");
    }
  }

  // ── Settings handlers ─────────────────────────────────────
  async function handleSaveSettings() {
    if (!store) return;
    if (!settingsName.trim()) {
      toast.error("Store name is required");
      return;
    }
    try {
      await updateStore.mutateAsync({
        storeId: store.id,
        name: settingsName.trim(),
        description: settingsDesc.trim(),
      });
      toast.success("Store settings saved!");
    } catch {
      toast.error("Failed to save settings");
    }
  }

  async function handleSavePaymentInfo() {
    if (!store) return;
    const enabledChannels: string[] = [];
    if (paymentForm.paypalEnabled) enabledChannels.push("paypal");
    if (paymentForm.bankEnabled) enabledChannels.push("bank");
    if (paymentForm.stripeEnabled) enabledChannels.push("stripe");

    const info: StorePaymentInfo = {
      storeId: store.id,
      enabledChannels,
      paypalEmail: paymentForm.paypalEmail || undefined,
      paypalUsername: paymentForm.paypalUsername || undefined,
      bankName: paymentForm.bankName || undefined,
      accountNumber: paymentForm.accountNumber || undefined,
      sortCode: paymentForm.sortCode || undefined,
      stripeAccountId: paymentForm.stripeAccountId || undefined,
    };

    try {
      await savePaymentInfo.mutateAsync({ storeId: store.id, info });
      toast.success("Payment settings saved!");
    } catch {
      toast.error("Failed to save payment settings");
    }
  }

  // ── AI handlers ───────────────────────────────────────────
  async function sendAiMessage(preset?: string) {
    const text = (preset ?? aiInput).trim();
    if (!text || !store) return;
    setAiInput("");

    setMessages((prev) => [...prev, { role: "user", content: text }]);

    const storeCtx = `You are Frost, the best AI for website building, powered by Frostify. You are helping the owner of "${store.name}", a store that sells: ${store.description}. Products: ${
      products
        ?.map((p) => `${p.name} at ${formatPrice(p.price)} (${p.category})`)
        .join(", ") || "not loaded yet"
    }. Analytics: ${analytics ? `${analytics.totalOrders} total orders, ${formatPrice(analytics.totalRevenue)} revenue` : "loading"}`;

    try {
      const response = await aiAssist.mutateAsync({
        context: storeCtx,
        prompt: text,
      });
      setMessages((prev) => {
        const newMsgs = [
          ...prev,
          { role: "assistant" as const, content: response, isNew: true },
        ];
        setLastAiIdx(newMsgs.length - 1);
        return newMsgs;
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I had trouble connecting. Please try again.",
          isNew: false,
        },
      ]);
    }
  }

  // Pending payment — full blocking screen
  if (subscription?.status === "pending") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 hero-mesh">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
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
          <div className="bg-card border border-border rounded-3xl p-8 shadow-xl text-center">
            <div className="w-16 h-16 rounded-2xl ai-gradient flex items-center justify-center mx-auto mb-5 shadow-glow animate-pulse-glow">
              <CalendarClock className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight mb-3">
              Payment Under Review
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Your payment is being verified by our team. You'll get access
              within 24 hours.
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-6 text-sm text-primary/80">
              <span className="font-semibold">Plan:</span> {subscription.plan}
            </div>
            <Button onClick={clear} variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl ai-gradient flex items-center justify-center mx-auto animate-pulse-glow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="text-muted-foreground text-sm">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-foreground/30 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`fixed lg:relative left-0 top-0 bottom-0 z-40 w-64 bg-sidebar flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-2.5 border-b border-sidebar-border">
          <img
            src="/assets/generated/shopforge-logo-transparent.dim_120x120.png"
            alt="Frostify"
            className="w-8 h-8 object-contain"
          />
          <span className="font-display font-bold text-sidebar-foreground text-lg">
            Frost
            <span
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.68 0.22 285), oklch(0.75 0.2 220))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ify
            </span>
          </span>
          <button
            type="button"
            className="ml-auto lg:hidden text-sidebar-foreground/50 hover:text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Store info */}
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg ai-gradient flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sidebar-foreground text-sm font-medium truncate">
                {store.name}
              </div>
              <a
                href={`/store/${store.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sidebar-foreground/50 text-xs flex items-center gap-1 hover:text-sidebar-primary transition-colors"
              >
                /{store.slug}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-3">
          <nav className="px-2 space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                {item.id === "ai" ? (
                  <item.icon className="w-4 h-4 shrink-0 text-blue-400" />
                ) : (
                  <item.icon className="w-4 h-4 shrink-0" />
                )}
                {item.label}
                {item.id === "orders" &&
                  orders &&
                  orders.filter((o) => o.status === OrderStatus.pending)
                    .length > 0 && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                      {
                        orders.filter((o) => o.status === OrderStatus.pending)
                          .length
                      }
                    </span>
                  )}
              </button>
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link to="/store/$slug" params={{ slug: store.slug }}>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              View Storefront
            </button>
          </Link>
          <button
            type="button"
            onClick={clear}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-card border-b border-border px-4 lg:px-6 h-14 flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-display font-bold text-base capitalize">
            {activeTab === "ai"
              ? "Frost AI"
              : activeTab === "memberships"
                ? "Memberships"
                : activeTab}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Currency Switcher */}
            <div className="flex items-center rounded-lg border border-border overflow-hidden h-8">
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-2.5 h-full text-xs font-medium transition-colors ${
                  currency === "USD"
                    ? "ai-gradient text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                $
              </button>
              <div className="w-px h-4 bg-border" />
              <button
                type="button"
                onClick={() => setCurrency("GBP")}
                className={`px-2.5 h-full text-xs font-medium transition-colors ${
                  currency === "GBP"
                    ? "ai-gradient text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                £
              </button>
            </div>
            <Link to="/store/$slug" params={{ slug: store.slug }}>
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex text-xs h-8"
              >
                <ExternalLink className="w-3 h-3 mr-1.5" />
                View Store
              </Button>
            </Link>
          </div>
        </header>

        {/* Subscription Status Banners */}
        {subscription?.status === "unpaid" && (
          <Alert className="rounded-none border-x-0 border-t-0 bg-orange-500/10 border-orange-500/30 flex items-center">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <AlertDescription className="text-orange-700 dark:text-orange-400 font-medium flex-1 ml-2">
              <span className="font-bold">Payment Warning:</span> Our staff have
              not received your payment. Please send your membership fee and
              contact support to resolve this. Your access may be cancelled if
              payment is not received.
            </AlertDescription>
          </Alert>
        )}
        {isSubscriptionExpiringSoon(subscription) && !expirySoonDismissed && (
          <Alert className="rounded-none border-x-0 border-t-0 bg-amber-500/10 border-amber-500/30 flex items-center">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <AlertDescription className="text-amber-700 dark:text-amber-400 font-medium flex-1 ml-2">
              Your membership expires in {getDaysUntilExpiry(subscription)} day
              {getDaysUntilExpiry(subscription) !== 1 ? "s" : ""}.{" "}
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className="underline hover:no-underline font-semibold"
              >
                Renew now
              </button>{" "}
              to keep access.
            </AlertDescription>
            <button
              type="button"
              onClick={() => setExpirySoonDismissed(true)}
              className="ml-2 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 shrink-0"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </Alert>
        )}
        {isSubscriptionActive(subscription) &&
          !isSubscriptionExpiringSoon(subscription) &&
          subscription?.status !== "unpaid" &&
          !reminderDismissed && (
            <Alert className="rounded-none border-x-0 border-t-0 bg-primary/5 border-primary/20 flex items-center">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <AlertDescription className="text-primary/80 text-sm flex-1 ml-2">
                <span className="font-medium">Reminder:</span> Your Frostify
                membership does not renew automatically. You must pay manually
                each month to keep access.
              </AlertDescription>
              <button
                type="button"
                onClick={() => setReminderDismissed(true)}
                className="ml-2 text-primary/60 hover:text-primary shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            {/* ── Overview ── */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-display text-2xl font-black tracking-tight">
                    Welcome back! 👋
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Here's what's happening with {store.name} today.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Total Products",
                      value: products?.length ?? 0,
                      icon: Package,
                      color: "from-violet-500/20 to-indigo-500/20",
                    },
                    {
                      label: "Total Orders",
                      value: analytics ? Number(analytics.totalOrders) : 0,
                      icon: ShoppingCart,
                      color: "from-blue-500/20 to-cyan-500/20",
                    },
                    {
                      label: "Total Revenue",
                      value: analytics
                        ? formatPrice(analytics.totalRevenue)
                        : formatPrice(0n),
                      icon: DollarSign,
                      color: "from-emerald-500/20 to-teal-500/20",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-card border border-border rounded-2xl p-5"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}
                      >
                        <stat.icon className="w-5 h-5 text-foreground/60" />
                      </div>
                      <div className="font-display text-2xl font-black">
                        {analyticsLoading || productsLoading ? (
                          <Skeleton className="h-7 w-20" />
                        ) : (
                          stat.value
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Recent Orders */}
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-bold">Recent Orders</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setActiveTab("orders")}
                      >
                        View all
                      </Button>
                    </div>
                    {ordersLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-10" />
                        ))}
                      </div>
                    ) : !orders || orders.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-4 text-center">
                        No orders yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {orders.slice(0, 4).map((order) => (
                          <div
                            key={order.id.toString()}
                            className="flex items-center justify-between py-2"
                          >
                            <div>
                              <div className="text-sm font-medium">
                                {order.buyerName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(order.createdAt)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {formatPrice(order.totalPrice)}
                              </span>
                              <StatusBadge status={order.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Top Products */}
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-bold">Top Products</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setActiveTab("analytics")}
                      >
                        Analytics
                      </Button>
                    </div>
                    {analyticsLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-10" />
                        ))}
                      </div>
                    ) : !analytics || analytics.topProducts.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-4 text-center">
                        No sales data yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {analytics.topProducts
                          .slice(0, 4)
                          .map(([id, name, sales]) => (
                            <div
                              key={id.toString()}
                              className="flex items-center justify-between py-2"
                            >
                              <div className="text-sm font-medium truncate">
                                {name}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <TrendingUp className="w-3.5 h-3.5 text-success" />
                                <span className="text-sm text-muted-foreground">
                                  {Number(sales)} sold
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Products ── */}
            {activeTab === "products" && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-black">
                      Products
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {products?.length ?? 0} products
                    </p>
                  </div>
                  <Button
                    onClick={openAddProduct}
                    className="ai-gradient text-white border-0"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </div>

                {productsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                  </div>
                ) : !products || products.length === 0 ? (
                  <div className="text-center py-16 bg-card border border-border rounded-2xl">
                    <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <h3 className="font-display font-bold text-lg mb-1">
                      No products yet
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Add your first product to start selling.
                    </p>
                    <Button
                      onClick={openAddProduct}
                      className="ai-gradient text-white border-0"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Product
                    </Button>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden md:table-cell">
                            Category
                          </TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead className="hidden sm:table-cell">
                            Stock
                          </TableHead>
                          <TableHead className="hidden md:table-cell">
                            Status
                          </TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id.toString()}>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">
                                  {product.name}
                                </div>
                                <div className="text-xs text-muted-foreground line-clamp-1 hidden sm:block">
                                  {product.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="secondary" className="text-xs">
                                {product.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatPrice(product.price)}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <span
                                className={
                                  product.stock === 0n
                                    ? "text-destructive"
                                    : "text-foreground"
                                }
                              >
                                {Number(product.stock)}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge
                                variant={
                                  product.isActive ? "default" : "secondary"
                                }
                                className={
                                  product.isActive
                                    ? "bg-success/20 text-success border-success/30"
                                    : ""
                                }
                              >
                                {product.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEditProduct(product)}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteConfirmId(product.id)}
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
              </motion.div>
            )}

            {/* ── Memberships ── */}
            {activeTab === "memberships" && (
              <motion.div
                key="memberships"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-black flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-500" />
                      Store Memberships
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Offer recurring memberships to your customers
                    </p>
                  </div>
                  <Button
                    onClick={openAddMembership}
                    className="ai-gradient text-white border-0"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Membership
                  </Button>
                </div>

                {membershipsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-48 rounded-2xl" />
                    ))}
                  </div>
                ) : !memberships || memberships.length === 0 ? (
                  <div className="text-center py-16 bg-card border border-border rounded-2xl">
                    <Crown className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <h3 className="font-display font-bold text-lg mb-1">
                      No memberships yet
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Create a membership plan to offer recurring access to your
                      customers.
                    </p>
                    <Button
                      onClick={openAddMembership}
                      className="ai-gradient text-white border-0"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Membership
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {memberships.map((membership) => (
                      <motion.div
                        key={membership.id.toString()}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-2xl p-5 flex flex-col"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                              <Crown className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm leading-tight">
                                {membership.name}
                              </div>
                              <Badge
                                className={
                                  membership.isActive
                                    ? "text-xs bg-success/20 text-success border-success/30"
                                    : "text-xs"
                                }
                                variant={
                                  membership.isActive ? "default" : "secondary"
                                }
                              >
                                {membership.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditMembership(membership)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() =>
                                setDeleteMembershipId(membership.id)
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {membership.description}
                        </p>

                        <div className="flex items-baseline gap-1 mb-3">
                          <span className="font-display text-2xl font-black">
                            {formatPrice(membership.price)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / {Number(membership.durationDays)} days
                          </span>
                        </div>

                        {membership.perks.length > 0 && (
                          <ul className="space-y-1.5 mt-auto">
                            {membership.perks.map((perk) => (
                              <li
                                key={perk}
                                className="flex items-center gap-2 text-xs text-muted-foreground"
                              >
                                <Check className="w-3.5 h-3.5 text-success shrink-0" />
                                {perk}
                              </li>
                            ))}
                          </ul>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Orders ── */}
            {activeTab === "orders" && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="font-display text-xl font-black">Orders</h2>
                  <p className="text-muted-foreground text-sm">
                    {orders?.length ?? 0} total orders
                  </p>
                </div>

                {ordersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 rounded-xl" />
                    ))}
                  </div>
                ) : !orders || orders.length === 0 ? (
                  <div className="text-center py-16 bg-card border border-border rounded-2xl">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <h3 className="font-display font-bold text-lg mb-1">
                      No orders yet
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Orders will appear here when customers purchase.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div
                        key={order.id.toString()}
                        className="bg-card border border-border rounded-2xl p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {order.buyerName}
                              </span>
                              <StatusBadge status={order.status} />
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {order.buyerEmail} · {formatDate(order.createdAt)}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {order.items.map((item) => (
                                <span
                                  key={item.productId.toString()}
                                  className="text-xs bg-secondary px-2 py-0.5 rounded-md"
                                >
                                  {item.productName} ×{Number(item.quantity)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-display font-bold text-base">
                              {formatPrice(order.totalPrice)}
                            </div>
                            {order.status === OrderStatus.pending && (
                              <div className="flex gap-1.5 mt-2 justify-end">
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-success/20 text-success border-success/30 hover:bg-success/30"
                                  variant="outline"
                                  onClick={() =>
                                    handleUpdateOrderStatus(
                                      order,
                                      OrderStatus.fulfilled,
                                    )
                                  }
                                  disabled={updateOrder.isPending}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Fulfill
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs"
                                  variant="destructive"
                                  onClick={() =>
                                    handleUpdateOrderStatus(
                                      order,
                                      OrderStatus.cancelled,
                                    )
                                  }
                                  disabled={updateOrder.isPending}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Analytics ── */}
            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <h2 className="font-display text-xl font-black">Analytics</h2>
                {analyticsLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-28 rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-blue-600/60" />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total Orders
                          </div>
                        </div>
                        <div className="font-display text-4xl font-black">
                          {analytics ? Number(analytics.totalOrders) : 0}
                        </div>
                      </div>
                      <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-emerald-600/60" />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total Revenue
                          </div>
                        </div>
                        <div className="font-display text-4xl font-black">
                          {analytics
                            ? formatPrice(analytics.totalRevenue)
                            : formatPrice(0n)}
                        </div>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-5">
                      <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Top Products by Sales
                      </h3>
                      {!analytics || analytics.topProducts.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-6 text-center">
                          No sales data yet. Start selling to see analytics.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {analytics.topProducts.map(
                            ([id, name, sales], idx) => {
                              const maxSales = Number(
                                analytics.topProducts[0]?.[2] ?? 1,
                              );
                              const pct = (Number(sales) / maxSales) * 100;
                              return (
                                <div key={id.toString()}>
                                  <div className="flex items-center justify-between text-sm mb-1.5">
                                    <span className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                                        {idx + 1}
                                      </span>
                                      {name}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {Number(sales)} sold
                                    </span>
                                  </div>
                                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${pct}%` }}
                                      transition={{
                                        delay: idx * 0.1,
                                        duration: 0.8,
                                        ease: "easeOut",
                                      }}
                                      className="h-full ai-gradient rounded-full"
                                    />
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ── Frost AI ── */}
            {activeTab === "ai" && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
                style={{ height: "calc(100vh - 9rem)" }}
              >
                {/* Frost AI Header */}
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-glow-sm"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.55 0.22 240), oklch(0.65 0.18 200))",
                      }}
                    >
                      <Snowflake className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-black flex items-center gap-2">
                        Frost
                        <span
                          className="text-sm font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background:
                              "linear-gradient(135deg, oklch(0.55 0.22 240)/15%, oklch(0.65 0.18 200)/15%)",
                            color: "oklch(0.65 0.18 200)",
                            border: "1px solid oklch(0.65 0.18 200 / 0.3)",
                          }}
                        >
                          AI
                        </span>
                      </h2>
                      <p className="text-muted-foreground text-xs">
                        The smartest AI for website building — powered by
                        Frostify
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    "Help me build my homepage",
                    "Suggest my website color palette",
                    "Write product descriptions",
                    "Tips to grow my online store",
                    "How to get my first customer",
                    "Write an About Us section",
                    "Suggest pricing strategy",
                    "Generate SEO keywords",
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => sendAiMessage(preset)}
                      disabled={aiAssist.isPending}
                      className="text-xs bg-secondary hover:bg-accent text-foreground px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 border border-border"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
                  <ScrollArea className="flex-1 p-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-glow"
                          style={{
                            background:
                              "linear-gradient(135deg, oklch(0.55 0.22 240), oklch(0.65 0.18 200))",
                          }}
                        >
                          <Snowflake className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-display font-bold text-lg mb-2">
                          Meet Frost
                        </h3>
                        <p className="text-muted-foreground text-sm max-w-xs">
                          The best AI for website building. I can help you craft
                          your store, write compelling copy, optimize your
                          products, and grow your business. Use the quick
                          actions above or ask me anything.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg, idx) => (
                          <div
                            // biome-ignore lint/suspicious/noArrayIndexKey: chat messages are append-only
                            key={idx}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            {msg.role === "assistant" && (
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center mr-2 shrink-0 mt-1"
                                style={{
                                  background:
                                    "linear-gradient(135deg, oklch(0.55 0.22 240), oklch(0.65 0.18 200))",
                                }}
                              >
                                <Snowflake className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                            <div
                              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                msg.role === "user"
                                  ? "ai-gradient text-white rounded-br-sm"
                                  : "bg-secondary text-foreground rounded-bl-sm"
                              }`}
                            >
                              {msg.role === "assistant" &&
                              idx === lastAiIdx &&
                              msg.isNew ? (
                                <TypewriterMsg
                                  text={msg.content}
                                  active={true}
                                />
                              ) : (
                                <span className="whitespace-pre-wrap">
                                  {msg.content}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {aiAssist.isPending && (
                          <div className="flex justify-start">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center mr-2 shrink-0 mt-1"
                              style={{
                                background:
                                  "linear-gradient(135deg, oklch(0.55 0.22 240), oklch(0.65 0.18 200))",
                              }}
                            >
                              <Snowflake className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="bg-secondary px-4 py-3 rounded-2xl rounded-bl-sm">
                              <div className="flex gap-1 items-center h-4">
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{
                                      duration: 0.6,
                                      delay: i * 0.15,
                                      repeat: Number.POSITIVE_INFINITY,
                                    }}
                                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-3 border-t border-border flex gap-2">
                    <Input
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && !e.shiftKey && sendAiMessage()
                      }
                      placeholder="Ask Frost anything about your store..."
                      className="h-10"
                      disabled={aiAssist.isPending}
                    />
                    <Button
                      onClick={() => sendAiMessage()}
                      disabled={!aiInput.trim() || aiAssist.isPending}
                      className="h-10 px-4 text-white border-0 shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.55 0.22 240), oklch(0.65 0.18 200))",
                      }}
                    >
                      {aiAssist.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Settings ── */}
            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5 max-w-2xl"
              >
                <h2 className="font-display text-xl font-black">
                  Store Settings
                </h2>

                {/* ── Account & Subscription Card ── */}
                <div
                  className={`bg-card border rounded-2xl p-6 space-y-4 ${isSubscriptionExpiringSoon(subscription) ? "border-amber-500/40" : "border-border"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarClock
                      className={`w-4 h-4 ${isSubscriptionExpiringSoon(subscription) ? "text-amber-500" : "text-primary"}`}
                    />
                    <h3 className="font-display font-bold text-sm">
                      Account &amp; Subscription
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-secondary/50 rounded-xl p-3">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Plan
                      </div>
                      <div className="font-semibold">
                        {subscription?.plan ?? "—"}
                      </div>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-3">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Status
                      </div>
                      <div>
                        {subscription?.status === "active" && (
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs dark:text-green-400">
                            Active
                          </Badge>
                        )}
                        {(subscription?.status as string) === "pending" && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                            Pending
                          </Badge>
                        )}
                        {subscription?.status === "unpaid" && (
                          <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30 text-xs dark:text-orange-400">
                            Unpaid Warning
                          </Badge>
                        )}
                        {(subscription?.status === "cancelled" ||
                          !subscription?.status) && (
                          <Badge variant="destructive" className="text-xs">
                            Cancelled
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-3">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Expires
                      </div>
                      <div className="font-semibold text-xs">
                        {formatExpiryDate(subscription)}
                      </div>
                    </div>
                  </div>

                  {(isSubscriptionExpiringSoon(subscription) ||
                    isSubscriptionExpired(subscription)) && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-amber-700 dark:text-amber-400 font-semibold text-sm">
                            {isSubscriptionExpired(subscription)
                              ? "Your subscription has expired"
                              : `Your subscription expires in ${getDaysUntilExpiry(subscription)} day${getDaysUntilExpiry(subscription) !== 1 ? "s" : ""}`}
                          </p>
                          <p className="text-amber-700/70 dark:text-amber-400/70 text-xs mt-0.5">
                            Renew now to keep access to your store and all
                            features.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-col sm:flex-row">
                        <Button
                          onClick={() => navigate({ to: "/membership" })}
                          className="flex-1 ai-gradient text-white border-0 shadow-glow-sm text-sm"
                          size="sm"
                        >
                          <RefreshCw className="mr-2 h-3.5 w-3.5" />
                          Purchase Another Month
                        </Button>
                        <Button
                          onClick={() => {
                            cancelSubscription();
                            toast.success(
                              "Your subscription has been cancelled.",
                            );
                            clear();
                            navigate({ to: "/" });
                          }}
                          variant="outline"
                          className="flex-1 text-destructive border-destructive/40 hover:bg-destructive/10 text-sm"
                          size="sm"
                        >
                          <X className="mr-2 h-3.5 w-3.5" />
                          Decline &amp; Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {isSubscriptionActive(subscription) &&
                    !isSubscriptionExpiringSoon(subscription) && (
                      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                        Your membership does not renew automatically. Remember
                        to pay manually each month.
                      </p>
                    )}
                </div>

                {/* ── Store Identity Card ── */}
                <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-name">Store Name</Label>
                    <Input
                      id="settings-name"
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      placeholder="Your store name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-slug">Store URL</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        frostify.io/store/
                      </span>
                      <Input
                        id="settings-slug"
                        value={store.slug}
                        disabled
                        className="flex-1 bg-muted/50 opacity-60"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Store URL cannot be changed after creation.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-desc">Store Description</Label>
                    <Textarea
                      id="settings-desc"
                      value={settingsDesc}
                      onChange={(e) => setSettingsDesc(e.target.value)}
                      placeholder="Describe your store..."
                      rows={4}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Store Status</div>
                      <div className="text-xs text-muted-foreground">
                        Your store is currently active
                      </div>
                    </div>
                    <Badge className="bg-success/20 text-success border-success/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-success mr-1.5" />
                      Active
                    </Badge>
                  </div>

                  <Button
                    onClick={handleSaveSettings}
                    disabled={updateStore.isPending}
                    className="ai-gradient text-white border-0 w-full sm:w-auto"
                  >
                    {updateStore.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>

                {/* ── Payment Payouts Card ── */}
                <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <h3 className="font-display font-bold text-sm">
                        Payment Payouts
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Where you receive payments from your customers. Enable the
                      channels you accept.
                    </p>
                  </div>

                  {/* PayPal */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">
                            PP
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium">PayPal</div>
                          <div className="text-xs text-muted-foreground">
                            Accept PayPal payments
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={paymentForm.paypalEnabled}
                        onCheckedChange={(checked) =>
                          setPaymentForm((f) => ({
                            ...f,
                            paypalEnabled: checked,
                          }))
                        }
                      />
                    </div>
                    {paymentForm.paypalEnabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-10 space-y-3"
                      >
                        <div className="space-y-1.5">
                          <Label htmlFor="paypal-email">PayPal Email</Label>
                          <Input
                            id="paypal-email"
                            type="email"
                            placeholder="you@example.com"
                            value={paymentForm.paypalEmail}
                            onChange={(e) =>
                              setPaymentForm((f) => ({
                                ...f,
                                paypalEmail: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="paypal-username">
                            PayPal Username
                          </Label>
                          <Input
                            id="paypal-username"
                            placeholder="@yourname"
                            value={paymentForm.paypalUsername}
                            onChange={(e) =>
                              setPaymentForm((f) => ({
                                ...f,
                                paypalUsername: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <Separator />

                  {/* Bank Transfer */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-emerald-600">
                            BT
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            Bank Transfer
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Accept direct bank transfers
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={paymentForm.bankEnabled}
                        onCheckedChange={(checked) =>
                          setPaymentForm((f) => ({
                            ...f,
                            bankEnabled: checked,
                          }))
                        }
                      />
                    </div>
                    {paymentForm.bankEnabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-10 space-y-3"
                      >
                        <div className="space-y-1.5">
                          <Label htmlFor="bank-name">Bank Name</Label>
                          <Input
                            id="bank-name"
                            placeholder="e.g. Barclays"
                            value={paymentForm.bankName}
                            onChange={(e) =>
                              setPaymentForm((f) => ({
                                ...f,
                                bankName: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="account-number">
                              Account Number
                            </Label>
                            <Input
                              id="account-number"
                              placeholder="12345678"
                              value={paymentForm.accountNumber}
                              onChange={(e) =>
                                setPaymentForm((f) => ({
                                  ...f,
                                  accountNumber: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="sort-code">Sort Code</Label>
                            <Input
                              id="sort-code"
                              placeholder="12-34-56"
                              value={paymentForm.sortCode}
                              onChange={(e) =>
                                setPaymentForm((f) => ({
                                  ...f,
                                  sortCode: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <Separator />

                  {/* Stripe */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-violet-600">
                            St
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Stripe</div>
                          <div className="text-xs text-muted-foreground">
                            Accept card payments via Stripe
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={paymentForm.stripeEnabled}
                        onCheckedChange={(checked) =>
                          setPaymentForm((f) => ({
                            ...f,
                            stripeEnabled: checked,
                          }))
                        }
                      />
                    </div>
                    {paymentForm.stripeEnabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-10 space-y-3"
                      >
                        <div className="space-y-1.5">
                          <Label htmlFor="stripe-account">
                            Stripe Account ID
                          </Label>
                          <Input
                            id="stripe-account"
                            placeholder="acct_..."
                            value={paymentForm.stripeAccountId}
                            onChange={(e) =>
                              setPaymentForm((f) => ({
                                ...f,
                                stripeAccountId: e.target.value,
                              }))
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Found in your Stripe dashboard under Account
                            Settings.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <Button
                    onClick={handleSavePaymentInfo}
                    disabled={savePaymentInfo.isPending}
                    className="ai-gradient text-white border-0 w-full sm:w-auto"
                  >
                    {savePaymentInfo.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Save Payment Settings
                      </>
                    )}
                  </Button>
                </div>

                {/* Danger Zone */}
                <div className="bg-card border border-destructive/30 rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <h3 className="font-display font-bold text-sm text-destructive">
                      Danger Zone
                    </h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Sign Out</div>
                      <div className="text-xs text-muted-foreground">
                        Sign out of your account
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={clear}>
                      <LogOut className="mr-2 h-3.5 w-3.5" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ── Product Dialog ──────────────────────────────────── */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Product Name</Label>
              <Input
                id="p-name"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Premium Wireless Headphones"
                className={productErrors.name ? "border-destructive" : ""}
              />
              {productErrors.name && (
                <p className="text-xs text-destructive">{productErrors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea
                id="p-desc"
                value={productForm.description}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Describe your product..."
                rows={3}
                className={
                  productErrors.description ? "border-destructive" : ""
                }
              />
              {productErrors.description && (
                <p className="text-xs text-destructive">
                  {productErrors.description}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Price (USD)</Label>
                <Input
                  id="p-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm((f) => ({ ...f, price: e.target.value }))
                  }
                  placeholder="29.99"
                  className={productErrors.price ? "border-destructive" : ""}
                />
                {productErrors.price && (
                  <p className="text-xs text-destructive">
                    {productErrors.price}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-stock">Stock</Label>
                <Input
                  id="p-stock"
                  type="number"
                  min="0"
                  value={productForm.stock}
                  onChange={(e) =>
                    setProductForm((f) => ({ ...f, stock: e.target.value }))
                  }
                  placeholder="100"
                  className={productErrors.stock ? "border-destructive" : ""}
                />
                {productErrors.stock && (
                  <p className="text-xs text-destructive">
                    {productErrors.stock}
                  </p>
                )}
              </div>
            </div>
            {!editingProduct && (
              <div className="space-y-1.5">
                <Label htmlFor="p-category">Category</Label>
                <Select
                  value={productForm.category}
                  onValueChange={(v) =>
                    setProductForm((f) => ({ ...f, category: v }))
                  }
                >
                  <SelectTrigger
                    id="p-category"
                    className={
                      productErrors.category ? "border-destructive" : ""
                    }
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {productErrors.category && (
                  <p className="text-xs text-destructive">
                    {productErrors.category}
                  </p>
                )}
              </div>
            )}

            {/* Media Upload */}
            <div className="space-y-2">
              <Label>Media (Images &amp; Videos)</Label>
              <button
                type="button"
                className="w-full border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => mediaInputRef.current?.click()}
              >
                <ImagePlus className="w-6 h-6 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">
                  Click to upload images or videos
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  PNG, JPG, GIF, MP4, WebM supported
                </p>
              </button>
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleMediaFileChange}
              />
              {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {mediaPreviews.map((preview, idx) => (
                    <div
                      key={preview.previewUrl}
                      className="relative group rounded-lg overflow-hidden bg-muted aspect-square"
                    >
                      {preview.file.type.startsWith("video/") ? (
                        <video
                          src={preview.previewUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={preview.previewUrl}
                          alt={preview.file.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMediaPreview(idx);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 right-1 text-xs text-white bg-black/50 rounded px-1 truncate">
                        {preview.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProductDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={addProduct.isPending || updateProduct.isPending}
              className="ai-gradient text-white border-0"
            >
              {addProduct.isPending || updateProduct.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingProduct ? (
                "Save Changes"
              ) : (
                "Add Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Membership Dialog ───────────────────────────────── */}
      <Dialog
        open={membershipDialogOpen}
        onOpenChange={setMembershipDialogOpen}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              {editingMembership ? "Edit Membership" : "Create Membership"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="m-name">Membership Name</Label>
              <Input
                id="m-name"
                value={membershipForm.name}
                onChange={(e) =>
                  setMembershipForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. VIP Member, Pro Plan"
                className={membershipErrors.name ? "border-destructive" : ""}
              />
              {membershipErrors.name && (
                <p className="text-xs text-destructive">
                  {membershipErrors.name}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-desc">Description</Label>
              <Textarea
                id="m-desc"
                value={membershipForm.description}
                onChange={(e) =>
                  setMembershipForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe what members get..."
                rows={3}
                className={
                  membershipErrors.description ? "border-destructive" : ""
                }
              />
              {membershipErrors.description && (
                <p className="text-xs text-destructive">
                  {membershipErrors.description}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="m-price">Price (USD)</Label>
                <Input
                  id="m-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={membershipForm.price}
                  onChange={(e) =>
                    setMembershipForm((f) => ({ ...f, price: e.target.value }))
                  }
                  placeholder="9.99"
                  className={membershipErrors.price ? "border-destructive" : ""}
                />
                {membershipErrors.price && (
                  <p className="text-xs text-destructive">
                    {membershipErrors.price}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-duration">Duration (days)</Label>
                <Input
                  id="m-duration"
                  type="number"
                  min="1"
                  value={membershipForm.durationDays}
                  onChange={(e) =>
                    setMembershipForm((f) => ({
                      ...f,
                      durationDays: e.target.value,
                    }))
                  }
                  placeholder="30"
                  className={
                    membershipErrors.durationDays ? "border-destructive" : ""
                  }
                />
                {membershipErrors.durationDays ? (
                  <p className="text-xs text-destructive">
                    {membershipErrors.durationDays}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    30 = monthly, 365 = yearly
                  </p>
                )}
              </div>
            </div>

            {/* Perks */}
            <div className="space-y-2">
              <Label>Perks / Benefits</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a perk (e.g. Free shipping)"
                  value={newPerkInput}
                  onChange={(e) => setNewPerkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPerk();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPerk}
                  disabled={!newPerkInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {membershipForm.perks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {membershipForm.perks.map((perk, idx) => (
                    <span
                      key={perk}
                      className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-full"
                    >
                      <Check className="w-3 h-3 text-success" />
                      {perk}
                      <button
                        type="button"
                        onClick={() => removePerk(idx)}
                        className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Active toggle (edit only) */}
            {editingMembership && (
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                <div>
                  <div className="text-sm font-medium">Active</div>
                  <div className="text-xs text-muted-foreground">
                    Show this membership on your storefront
                  </div>
                </div>
                <Switch
                  checked={membershipForm.isActive}
                  onCheckedChange={(checked) =>
                    setMembershipForm((f) => ({ ...f, isActive: checked }))
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMembershipDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveMembership}
              disabled={addMembership.isPending || updateMembership.isPending}
              className="ai-gradient text-white border-0"
            >
              {addMembership.isPending || updateMembership.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingMembership ? (
                "Save Changes"
              ) : (
                "Create Membership"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Product Confirmation ──────────────────────── */}
      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(o) => !o && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone. The product will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Membership Confirmation ──────────────────── */}
      <AlertDialog
        open={deleteMembershipId !== null}
        onOpenChange={(o) => !o && setDeleteMembershipId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Membership</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will permanently delete this membership plan.
              Existing subscribers may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMembership}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
