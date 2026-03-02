export interface Subscription {
  id: number;
  name: string;
  paypalUsername: string;
  plan: string;
  status: "pending" | "active" | "cancelled" | "unpaid";
  joinedAt: string;
  expiresAt?: string; // ISO string
}

export function getSubscription(): Subscription | null {
  try {
    const subs = JSON.parse(
      localStorage.getItem("frostify_subscriptions") ?? "[]",
    ) as Subscription[];
    if (subs.length === 0) return null;
    return subs[subs.length - 1] ?? null;
  } catch {
    return null;
  }
}

export function isSubscriptionActive(sub: Subscription | null): boolean {
  if (!sub) return false;
  // unpaid subs have access but show a warning banner
  if (sub.status === "unpaid") return true;
  if (sub.status !== "active") return false;
  if (!sub.expiresAt) return true; // legacy records without expiry are treated as active
  return new Date(sub.expiresAt) > new Date();
}

export function isSubscriptionExpiringSoon(sub: Subscription | null): boolean {
  if (!sub) return false;
  if (sub.status !== "active") return false;
  if (!sub.expiresAt) return false;
  const expiry = new Date(sub.expiresAt);
  const now = new Date();
  if (expiry <= now) return false;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return expiry.getTime() - now.getTime() <= sevenDays;
}

export function isSubscriptionExpired(sub: Subscription | null): boolean {
  if (!sub) return false;
  if (sub.status !== "active") return false;
  if (!sub.expiresAt) return false;
  return new Date(sub.expiresAt) <= new Date();
}

export function getDaysUntilExpiry(sub: Subscription | null): number {
  if (!sub || !sub.expiresAt) return 0;
  const expiry = new Date(sub.expiresAt);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export function formatExpiryDate(sub: Subscription | null): string {
  if (!sub || !sub.expiresAt) return "—";
  return new Date(sub.expiresAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function cancelSubscription(): void {
  try {
    const subs = JSON.parse(
      localStorage.getItem("frostify_subscriptions") ?? "[]",
    ) as Subscription[];
    if (subs.length === 0) return;
    const updated = subs.map((s, i) =>
      i === subs.length - 1 ? { ...s, status: "cancelled" as const } : s,
    );
    localStorage.setItem("frostify_subscriptions", JSON.stringify(updated));
  } catch {
    // ignore
  }
}
