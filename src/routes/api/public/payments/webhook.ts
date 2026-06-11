import { createFileRoute } from "@tanstack/react-router";

type LovableWebhookPayload = {
  type?: string;
  event?: string;
  data?: {
    object?: Record<string, unknown>;
    [k: string]: unknown;
  };
  object?: Record<string, unknown>;
};

function safeString(v: unknown): string | null {
  return typeof v === "string" && v.length ? v : null;
}

function pickEnv(url: URL): "sandbox" | "live" {
  const env = url.searchParams.get("env");
  return env === "live" ? "live" : "sandbox";
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const env = pickEnv(url);

          // Read raw body for any future signature verification.
          // The Lovable gateway forwards normalized webhook events.
          const rawBody = await request.text();
          const payload = JSON.parse(rawBody) as LovableWebhookPayload;

          const eventType = payload.type ?? payload.event ?? "";
          const obj = (payload.data?.object ?? payload.object ?? payload.data ?? {}) as Record<
            string,
            unknown
          >;

          // Only handle events that affect the user's subscription state.
          const isSubscriptionEvent =
            eventType.startsWith("subscription.") ||
            eventType.startsWith("customer.subscription.");
          if (!isSubscriptionEvent && eventType !== "transaction.completed") {
            return new Response("ignored", { status: 200 });
          }

          // Extract IDs — Lovable gateway normalizes around Stripe shapes.
          const subscriptionId =
            safeString(obj.id) && eventType.includes("subscription")
              ? safeString(obj.id)
              : safeString(obj.subscription) || safeString(obj.subscription_id);

          if (!subscriptionId) {
            return new Response("no subscription id", { status: 200 });
          }

          // Fetch the canonical subscription state from Stripe via the gateway.
          const { createStripeClient } = await import("@/lib/stripe.server");
          const stripe = createStripeClient(env);
          const sub = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["items.data.price"],
          });

          // Resolve userId — prefer subscription metadata, fall back to customer.
          let userId = safeString(sub.metadata?.userId);
          const customerId =
            typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
          if (!userId && customerId) {
            const customer = await stripe.customers.retrieve(customerId);
            if (customer && !("deleted" in customer && customer.deleted)) {
              userId = safeString(
                (customer as { metadata?: { userId?: string } }).metadata?.userId,
              );
            }
          }
          if (!userId) {
            return new Response("no user", { status: 200 });
          }

          const firstItem = sub.items?.data?.[0];
          const stripePrice = firstItem?.price as
            | { id: string; lookup_key: string | null; product: string | { id: string } }
            | undefined;
          const priceLookup =
            stripePrice?.lookup_key ??
            safeString((sub.metadata as Record<string, string> | undefined)?.priceId) ??
            null;
          const productId =
            typeof stripePrice?.product === "string"
              ? stripePrice.product
              : stripePrice?.product?.id ?? null;

          // Period — dahlia: on the subscription item.
          const item = firstItem as
            | { current_period_start?: number; current_period_end?: number }
            | undefined;
          const periodStart = item?.current_period_start
            ? new Date(item.current_period_start * 1000).toISOString()
            : null;
          const periodEnd = item?.current_period_end
            ? new Date(item.current_period_end * 1000).toISOString()
            : null;
          const canceledAt = sub.canceled_at
            ? new Date(sub.canceled_at * 1000).toISOString()
            : null;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Upsert by (stripe_subscription_id, environment).
          const { data: existing } = await supabaseAdmin
            .from("subscriptions")
            .select("id")
            .eq("stripe_subscription_id", subscriptionId)
            .eq("environment", env)
            .maybeSingle();

          const row = {
            user_id: userId,
            environment: env,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            product_id: productId,
            price_id: priceLookup,
            status: sub.status,
            cancel_at_period_end: !!sub.cancel_at_period_end,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            canceled_at: canceledAt,
          };

          if (existing?.id) {
            await supabaseAdmin.from("subscriptions").update(row).eq("id", existing.id);
          } else {
            await supabaseAdmin.from("subscriptions").insert(row);
          }

          return new Response("ok", { status: 200 });
        } catch (err) {
          console.error("[payments/webhook]", err);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});
