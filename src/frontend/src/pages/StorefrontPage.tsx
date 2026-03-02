import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Building2,
  Check,
  CheckCircle,
  CreditCard,
  Crown,
  Home,
  Loader2,
  Minus,
  Package,
  Plus,
  Send,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { OrderItem, Product } from "../backend.d.ts";
import { useCurrency } from "../hooks/useCurrency";
import {
  useActiveProductsByStore,
  useAiAssist,
  useMembershipsByStore,
  usePlaceOrder,
  useStoreBySlug,
  useStorePaymentInfo,
} from "../hooks/useQueries";

interface CartItem {
  product: Product;
  quantity: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  displayedContent?: string;
}

// Typewriter animation hook
function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return displayed;
}

function ProductCard({
  product,
  onAdd,
  formatPrice,
}: {
  product: Product;
  onAdd: (p: Product) => void;
  formatPrice: (cents: bigint | number) => string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="bg-card border border-border rounded-2xl overflow-hidden group"
    >
      <div className="aspect-square bg-gradient-to-br from-secondary/80 to-accent/50 flex items-center justify-center">
        <Package className="w-10 h-10 text-muted-foreground/50" />
      </div>
      <div className="p-4">
        <Badge variant="secondary" className="mb-2 text-xs">
          {product.category}
        </Badge>
        <h3 className="font-semibold text-sm mb-1 truncate">{product.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-base">
            {formatPrice(product.price)}
          </span>
          <Button
            size="sm"
            onClick={() => onAdd(product)}
            disabled={product.stock === 0n}
            className="ai-gradient text-white border-0 text-xs h-8"
          >
            {product.stock === 0n ? "Sold Out" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function TypewriterMessage({ text }: { text: string }) {
  const displayed = useTypewriter(text);
  return <span>{displayed}</span>;
}

export default function StorefrontPage() {
  const { slug } = useParams({ from: "/store/$slug" });
  const { data: store, isLoading: storeLoading } = useStoreBySlug(slug);
  const { data: products, isLoading: productsLoading } =
    useActiveProductsByStore(store?.id);
  const { data: memberships } = useMembershipsByStore(store?.id);
  const { data: paymentInfo } = useStorePaymentInfo(store?.id);
  const placeOrder = usePlaceOrder();
  const aiAssist = useAiAssist();
  const { currency, setCurrency, formatPrice } = useCurrency();

  const activeMemberships = memberships?.filter((m) => m.isActive) ?? [];

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "form" | "success">(
    "cart",
  );
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // AI Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiAssist.isPending]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart`);
    setCartOpen(true);
  }

  function removeFromCart(productId: bigint) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function updateQuantity(productId: bigint, delta: number) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }

  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  function validateCheckout() {
    const e: Record<string, string> = {};
    if (!buyerName.trim()) e.name = "Name is required";
    if (!buyerEmail.trim()) e.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail))
      e.email = "Valid email required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handlePlaceOrder() {
    if (!validateCheckout() || !store) return;
    const items: OrderItem[] = cart.map((i) => ({
      productId: i.product.id,
      productName: i.product.name,
      quantity: BigInt(i.quantity),
      unitPrice: i.product.price,
    }));
    try {
      await placeOrder.mutateAsync({
        storeId: store.id,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim(),
        items,
      });
      setCheckoutStep("success");
      setCart([]);
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  }

  async function sendAiMessage(userMsg?: string) {
    const text = (userMsg ?? inputMsg).trim();
    if (!text || !store) return;
    setInputMsg("");

    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);

    const storeContext = `Store: ${store.name}. ${store.description}. Products: ${
      products?.map((p) => `${p.name} (${formatPrice(p.price)})`).join(", ") ??
      "loading..."
    }`;

    try {
      const response = await aiAssist.mutateAsync({
        context: storeContext,
        prompt: text,
      });
      const aiMsg: ChatMessage = { role: "assistant", content: response };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: ChatMessage = {
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again.",
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  }

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-6xl">
          <Skeleton className="h-48 rounded-2xl mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, i) => `skel-${i}`).map((k) => (
              <div key={k} className="space-y-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold mb-2">
            Store not found
          </h2>
          <p className="text-muted-foreground mb-4">
            This store doesn't exist or has been removed.
          </p>
          <Link to="/stores">
            <Button>Browse Stores</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link to="/stores">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <span className="font-display font-bold text-sm">{store.name}</span>
          </div>
          <div className="flex items-center gap-2">
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
            <Button
              variant="outline"
              onClick={() => setCartOpen(true)}
              className="relative"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full ai-gradient text-white text-[10px] flex items-center justify-center font-bold">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Store Banner */}
      <div className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/20 border-b border-border">
        <div className="container mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 rounded-2xl ai-gradient flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Package className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight mb-3">
              {store.name}
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              {store.description}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Products */}
      <main className="container mx-auto px-4 py-10 space-y-16">
        {/* Products Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold">
              Products
              {products && (
                <Badge variant="secondary" className="ml-2 text-sm font-normal">
                  {products.length}
                </Badge>
              )}
            </h2>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 6 }, (_, i) => `sk-${i}`).map((k) => (
                <div key={k} className="space-y-3">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : !products || products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">
                No products available yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id.toString()}
                  product={product}
                  onAdd={addToCart}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          )}
        </section>

        {/* Memberships Section */}
        {activeMemberships.length > 0 && (
          <section>
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-amber-500" />
                <h2 className="font-display text-2xl font-bold">Memberships</h2>
              </div>
              <p className="text-muted-foreground">
                Become a member and enjoy exclusive benefits
              </p>
            </div>

            <div
              className={`grid gap-6 ${activeMemberships.length === 1 ? "max-w-sm mx-auto" : activeMemberships.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}
            >
              {activeMemberships.map((membership, idx) => (
                <motion.div
                  key={membership.id.toString()}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                  className={`relative bg-card border rounded-2xl p-6 flex flex-col ${
                    idx === 0 && activeMemberships.length > 1
                      ? "border-primary/40 shadow-glow-sm"
                      : "border-border"
                  }`}
                >
                  {idx === 0 && activeMemberships.length > 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="ai-gradient text-white border-0 text-xs shadow-sm">
                        ⭐ Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-amber-500" />
                    </div>
                    <h3 className="font-display font-bold text-lg">
                      {membership.name}
                    </h3>
                  </div>

                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="font-display text-3xl font-black">
                      {formatPrice(membership.price)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {Number(membership.durationDays)} days
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-5">
                    {membership.description}
                  </p>

                  {membership.perks.length > 0 && (
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {membership.perks.map((perk) => (
                        <li
                          key={perk}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-success" />
                          </div>
                          {perk}
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    className="w-full mt-auto ai-gradient text-white border-0"
                    onClick={() =>
                      toast.info(
                        "Contact the store owner to purchase this membership.",
                      )
                    }
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Get Membership
                  </Button>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Payment Methods Section */}
        {paymentInfo && paymentInfo.enabledChannels.length > 0 && (
          <section>
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-display font-semibold text-base">
                  Payment Methods Accepted
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {paymentInfo.enabledChannels.includes("paypal") && (
                  <div className="flex items-center gap-2 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-3 py-2 rounded-xl text-sm font-medium">
                    <span className="font-bold text-xs bg-blue-500 text-white rounded px-1.5 py-0.5">
                      PP
                    </span>
                    PayPal
                    {paymentInfo.paypalEmail && (
                      <span className="text-xs text-blue-500/70">
                        {paymentInfo.paypalEmail}
                      </span>
                    )}
                  </div>
                )}
                {paymentInfo.enabledChannels.includes("bank") && (
                  <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-xl text-sm font-medium">
                    <Building2 className="w-4 h-4" />
                    Bank Transfer
                    {paymentInfo.bankName && (
                      <span className="text-xs text-emerald-500/70">
                        {paymentInfo.bankName}
                      </span>
                    )}
                  </div>
                )}
                {paymentInfo.enabledChannels.includes("stripe") && (
                  <div className="flex items-center gap-2 bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20 px-3 py-2 rounded-xl text-sm font-medium">
                    <span className="font-bold text-xs bg-violet-500 text-white rounded px-1.5 py-0.5">
                      St
                    </span>
                    Stripe
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── Cart Drawer ──────────────────────────────────── */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 flex flex-col shadow-xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-display font-bold text-lg">
                  {checkoutStep === "cart" && "Shopping Cart"}
                  {checkoutStep === "form" && "Checkout"}
                  {checkoutStep === "success" && "Order Placed!"}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutStep("cart");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {checkoutStep === "cart" && (
                <>
                  <ScrollArea className="flex-1 p-4">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm">
                          Your cart is empty
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-2"
                          onClick={() => setCartOpen(false)}
                        >
                          Continue Shopping
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div
                            key={item.product.id.toString()}
                            className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl"
                          >
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {item.product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatPrice(item.product.price)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  updateQuantity(item.product.id, -1)
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  updateQuantity(item.product.id, 1)
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground"
                                onClick={() => removeFromCart(item.product.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  {cart.length > 0 && (
                    <div className="p-4 border-t border-border space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-bold font-display text-lg">
                          {formatPrice(cartTotal)}
                        </span>
                      </div>
                      <Button
                        onClick={() => setCheckoutStep("form")}
                        className="w-full ai-gradient text-white border-0 shadow-glow-sm"
                      >
                        Proceed to Checkout
                      </Button>
                    </div>
                  )}
                </>
              )}

              {checkoutStep === "form" && (
                <>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      <div className="bg-secondary/30 rounded-xl p-3 space-y-1.5">
                        {cart.map((item) => (
                          <div
                            key={item.product.id.toString()}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground truncate">
                              {item.product.name} × {item.quantity}
                            </span>
                            <span className="font-medium ml-2 shrink-0">
                              {formatPrice(
                                Number(item.product.price) * item.quantity,
                              )}
                            </span>
                          </div>
                        ))}
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span>{formatPrice(cartTotal)}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="buyer-name">Full Name</Label>
                          <Input
                            id="buyer-name"
                            placeholder="Jane Smith"
                            value={buyerName}
                            onChange={(e) => setBuyerName(e.target.value)}
                            className={
                              formErrors.name ? "border-destructive" : ""
                            }
                          />
                          {formErrors.name && (
                            <p className="text-xs text-destructive">
                              {formErrors.name}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="buyer-email">Email Address</Label>
                          <Input
                            id="buyer-email"
                            type="email"
                            placeholder="jane@example.com"
                            value={buyerEmail}
                            onChange={(e) => setBuyerEmail(e.target.value)}
                            className={
                              formErrors.email ? "border-destructive" : ""
                            }
                          />
                          {formErrors.email && (
                            <p className="text-xs text-destructive">
                              {formErrors.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t border-border space-y-2">
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={placeOrder.isPending}
                      className="w-full ai-gradient text-white border-0 shadow-glow-sm"
                    >
                      {placeOrder.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        `Place Order — ${formatPrice(cartTotal)}`
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setCheckoutStep("cart")}
                    >
                      Back to Cart
                    </Button>
                  </div>
                </>
              )}

              {checkoutStep === "success" && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6"
                  >
                    <CheckCircle className="w-10 h-10 text-success" />
                  </motion.div>
                  <h3 className="font-display text-2xl font-black mb-2">
                    Order Placed!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Thank you, {buyerName}! Your order has been confirmed. We'll
                    send updates to {buyerEmail}.
                  </p>
                  <Button
                    onClick={() => {
                      setCartOpen(false);
                      setCheckoutStep("cart");
                      setBuyerName("");
                      setBuyerEmail("");
                    }}
                    className="ai-gradient text-white border-0"
                  >
                    Continue Shopping
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── AI Chat Bubble ────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="mb-4 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-xl overflow-hidden ai-glow"
            >
              {/* Chat Header */}
              <div className="ai-gradient p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">
                      AI Assistant
                    </div>
                    <div className="text-white/70 text-xs">Ask me anything</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => setChatOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="h-64 p-3">
                {messages.length === 0 && (
                  <div className="text-center py-6">
                    <Bot className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Hi! I can answer questions about {store.name}. What would
                      you like to know?
                    </p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: chat messages are append-only
                    key={idx}
                    className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "ai-gradient text-white ml-auto"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {msg.role === "assistant" &&
                      idx === messages.length - 1 ? (
                        <TypewriterMessage text={msg.content} />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {aiAssist.isPending && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-secondary px-3 py-2 rounded-xl">
                      <div className="flex gap-1 items-center h-4">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -4, 0] }}
                            transition={{
                              duration: 0.6,
                              delay: i * 0.1,
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
              </ScrollArea>

              {/* Suggested Questions */}
              {messages.length === 0 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                  {[
                    "What do you sell?",
                    "Do you ship internationally?",
                    "Tell me about your best products",
                  ].map((q) => (
                    <button
                      type="button"
                      key={q}
                      onClick={() => sendAiMessage(q)}
                      className="text-xs bg-secondary/70 hover:bg-secondary text-foreground px-2.5 py-1 rounded-full transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 pt-1 border-t border-border flex gap-2">
                <Input
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && sendAiMessage()
                  }
                  placeholder="Ask a question..."
                  className="h-8 text-sm"
                  disabled={aiAssist.isPending}
                />
                <Button
                  size="icon"
                  className="h-8 w-8 ai-gradient text-white border-0 shrink-0"
                  onClick={() => sendAiMessage()}
                  disabled={!inputMsg.trim() || aiAssist.isPending}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setChatOpen((v) => !v)}
          className="w-14 h-14 rounded-full ai-gradient shadow-glow flex items-center justify-center animate-pulse-glow"
        >
          <AnimatePresence mode="wait">
            {chatOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90 }}
                animate={{ rotate: 0 }}
              >
                <X className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90 }}
                animate={{ rotate: 0 }}
              >
                <Bot className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <footer className="border-t border-border mt-16 py-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-4 mb-3">
          <Link to="/staff">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground"
            >
              Staff
            </Button>
          </Link>
        </div>
        Powered by{" "}
        <span className="font-display font-bold">
          Frost<span className="ai-gradient-text">ify</span>
        </span>{" "}
        · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
