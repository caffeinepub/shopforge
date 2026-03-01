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
  BarChart3,
  Bot,
  Check,
  DollarSign,
  Edit2,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Package,
  Plus,
  Send,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { OrderStatus } from "../backend";
import type { Order, Product } from "../backend.d.ts";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddProduct,
  useAiAssist,
  useDeleteProduct,
  useMyStore,
  useOrdersByStore,
  useProductsByStore,
  useStoreAnalytics,
  useUpdateOrderStatus,
  useUpdateProduct,
  useUpdateStore,
} from "../hooks/useQueries";

type DashTab =
  | "overview"
  | "products"
  | "orders"
  | "analytics"
  | "ai"
  | "settings";

function formatPrice(cents: bigint) {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

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

export default function DashboardPage() {
  const navigate = useNavigate();
  const { clear, identity } = useInternetIdentity();
  const [activeTab, setActiveTab] = useState<DashTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const { data: products, isLoading: productsLoading } = useProductsByStore(
    store?.id,
  );
  const { data: orders, isLoading: ordersLoading } = useOrdersByStore(
    store?.id,
  );
  const { data: analytics, isLoading: analyticsLoading } = useStoreAnalytics(
    store?.id,
  );

  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateOrder = useUpdateOrderStatus();
  const updateStore = useUpdateStore();
  const aiAssist = useAiAssist();

  // Product dialog
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] =
    useState<ProductFormData>(EMPTY_PRODUCT);
  const [productErrors, setProductErrors] = useState<Record<string, string>>(
    {},
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<bigint | null>(null);

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

  const NAV_ITEMS: {
    id: DashTab;
    icon: typeof LayoutDashboard;
    label: string;
  }[] = [
    { id: "overview", icon: LayoutDashboard, label: "Overview" },
    { id: "products", icon: Package, label: "Products" },
    { id: "orders", icon: ShoppingCart, label: "Orders" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "ai", icon: Bot, label: "AI Assistant" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  function openAddProduct() {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setProductErrors({});
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

  async function sendAiMessage(preset?: string) {
    const text = (preset ?? aiInput).trim();
    if (!text || !store) return;
    setAiInput("");

    setMessages((prev) => [...prev, { role: "user", content: text }]);

    const storeCtx = `You are an AI assistant for "${store.name}", a store that sells: ${store.description}. Products: ${
      products
        ?.map(
          (p) =>
            `${p.name} at $${(Number(p.price) / 100).toFixed(2)} (${p.category})`,
        )
        .join(", ") || "not loaded yet"
    }. Analytics: ${analytics ? `${analytics.totalOrders} total orders, $${(Number(analytics.totalRevenue) / 100).toFixed(2)} revenue` : "loading"}`;

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
      {/* Mobile overlay */}
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
            alt="ShopForge"
            className="w-8 h-8 object-contain"
          />
          <span className="font-display font-bold text-sidebar-foreground text-lg">
            Shop
            <span
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.68 0.22 285), oklch(0.75 0.2 220))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Forge
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
                <item.icon className="w-4 h-4 shrink-0" />
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
            {activeTab === "ai" ? "AI Assistant" : activeTab}
          </div>
          <div className="ml-auto flex items-center gap-2">
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
                        ? `$${(Number(analytics.totalRevenue) / 100).toFixed(2)}`
                        : "$0.00",
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
                            ? `$${(Number(analytics.totalRevenue) / 100).toFixed(2)}`
                            : "$0.00"}
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

            {/* ── AI Assistant ── */}
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
                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl ai-gradient flex items-center justify-center shadow-glow-sm">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-black">
                        AI Assistant
                      </h2>
                      <p className="text-muted-foreground text-xs">
                        Powered by advanced AI · knows your store
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    "Write a product description",
                    "Suggest pricing strategy",
                    "Write a store bio",
                    "Generate SEO keywords",
                    "Tips to increase sales",
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
                        <div className="w-16 h-16 rounded-2xl ai-gradient flex items-center justify-center mb-4 shadow-glow">
                          <Bot className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-display font-bold text-lg mb-2">
                          Your AI Store Assistant
                        </h3>
                        <p className="text-muted-foreground text-sm max-w-xs">
                          I can help you write product descriptions, optimize
                          pricing, create marketing copy, and much more. Use the
                          quick actions above or type your own question.
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
                              <div className="w-7 h-7 rounded-full ai-gradient flex items-center justify-center mr-2 shrink-0 mt-1">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
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
                            <div className="w-7 h-7 rounded-full ai-gradient flex items-center justify-center mr-2 shrink-0 mt-1">
                              <Sparkles className="w-3.5 h-3.5 text-white" />
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
                      placeholder="Ask your AI assistant..."
                      className="h-10"
                      disabled={aiAssist.isPending}
                    />
                    <Button
                      onClick={() => sendAiMessage()}
                      disabled={!aiInput.trim() || aiAssist.isPending}
                      className="h-10 px-4 ai-gradient text-white border-0 shrink-0"
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
                className="space-y-5 max-w-xl"
              >
                <h2 className="font-display text-xl font-black">
                  Store Settings
                </h2>

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
                        shopforge.io/store/
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
        <DialogContent className="sm:max-w-lg">
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

      {/* ── Delete Confirmation ─────────────────────────────── */}
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
    </div>
  );
}
