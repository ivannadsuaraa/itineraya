import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";

export type SubscriptionRow = {
  id: string;
  user_id: string;
  environment: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  product_id: string | null;
  price_id: string | null;
  status: string;
  cancel_at_period_end: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
};

function isActiveStatus(row: SubscriptionRow | null): boolean {
  if (!row) return false;
  const now = Date.now();
  const endsAt = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
  if (["active", "trialing", "past_due"].includes(row.status)) {
    return endsAt == null || endsAt > now;
  }
  if (row.status === "canceled" && endsAt != null && endsAt > now) return true;
  return false;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const env = isPaymentsConfigured() ? getStripeEnvironment() : null;

    const fetchLatest = async (uid: string) => {
      if (!env) {
        setSubscription(null);
        return;
      }
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", uid)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setSubscription((data as SubscriptionRow | null) ?? null);
    };

    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (cancelled) return;
      const uid = u.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        await fetchLatest(uid);
        channel = supabase
          .channel(`subs-${uid}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${uid}` },
            () => fetchLatest(uid),
          )
          .subscribe();
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return {
    subscription,
    isActive: isActiveStatus(subscription),
    priceId: subscription?.price_id ?? null,
    loading,
    userId,
  };
}
