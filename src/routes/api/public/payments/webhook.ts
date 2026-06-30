import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";
import { createNativeStripeClient, getWebhookSecret, type StripeEnv } from "@/lib/stripe.server";

function pickEnv(url: URL): StripeEnv {
  const env = url.searchParams.get("env");
  return env === "live" ? "live" : "sandbox";
}

function safeString(v: unknown): string | null {
  return typeof v === "string" && v.length ? v : null;
}

// Event types we actually act on; everything else is acknowledged and ignored.
const HANDLED_EVENT_TYPES = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "checkout.session.completed",
]);

/**
 * Resolves our internal user id for a subscription, preferring the
 * subscription's own metadata (set at creation time, see
 * payments.functions.ts) and falling back to the Stripe customer's metadata.
 */
async function resolveUserId(
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const fromSubscription = safeString(
    (subscription.metadata as Record<string, string> | undefined)?.userId,
  );
  if (fromSubscription) return fromSubscription;

  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
  if (!customerId) return null;

  const customer = await stripe.customers.retrieve(customerId);
  if (!customer || ("deleted" in customer && customer.deleted)) return null;
  return safeString((customer as Stripe.Customer).metadata?.userId);
}

async function upsertSubscriptionRow(env: StripeEnv, subscription: Stripe.Subscription, userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null;

  const firstItem = subscription.items?.data?.[0];
  const price = firstItem?.price;
  const priceLookup =
    price?.lookup_key ??
    safeString((subscription.metadata as Record<string, string> | undefined)?.priceId) ??
    null;
  const productId = typeof price?.product === "string" ? price.product : price?.product?.id ?? null;

  const periodStart = firstItem?.current_period_start
    ? new Date(firstItem.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000).toISOString()
    : null;
  const canceledAt = subscription.canceled_at
    ? new Date(subscription.canceled_at * 1000).toISOString()
    : null;

  const row = {
    user_id: userId,
    environment: env,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    product_id: productId,
    price_id: priceLookup,
    status: subscription.status,
    cancel_at_period_end: !!subscription.cancel_at_period_end,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    canceled_at: canceledAt,
  };

  // Upsert by (stripe_subscription_id, environment) — matches the unique
  // index defined in the subscriptions table.
  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env)
    .maybeSingle();

  if (existing?.id) {
    await supabaseAdmin.from("subscriptions").update(row).eq("id", existing.id);
  } else {
    await supabaseAdmin.from("subscriptions").insert(row);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const env = pickEnv(url);

          const signature = request.headers.get("stripe-signature");
          if (!signature) {
            console.error("[payments/webhook] missing stripe-signature header");
            return new Response("missing signature", { status: 400 });
          }

          const rawBody = await request.text();
          const stripe = createNativeStripeClient(env);
          const webhookSecret = getWebhookSecret(env);

          let event: Stripe.Event;
          try {
            event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
          } catch (err) {
            console.error("[payments/webhook] signature verification failed", {
              message: err instanceof Error ? err.message : String(err),
            });
            return new Response("invalid signature", { status: 401 });
          }

          if (!HANDLED_EVENT_TYPES.has(event.type)) {
            return new Response("ignored", { status: 200 });
          }

          let subscription: Stripe.Subscription;

          if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const subscriptionId =
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription?.id;
            if (!subscriptionId) {
              // Not a subscription checkout (e.g. one-off payment) — nothing to sync.
              return new Response("no subscription", { status: 200 });
            }
            subscription = await stripe.subscriptions.retrieve(subscriptionId, {
              expand: ["items.data.price"],
            });
          } else {
            // customer.subscription.{created,updated,deleted}
            subscription = event.data.object as Stripe.Subscription;
          }

          const userId = await resolveUserId(stripe, subscription);
          if (!userId) {
            console.error("[payments/webhook] no userId resolved for subscription", {
              subscriptionId: subscription.id,
              eventType: event.type,
            });
            return new Response("no user", { status: 200 });
          }

          await upsertSubscriptionRow(env, subscription, userId);

          return new Response("ok", { status: 200 });
        } catch (err) {
          console.error("[payments/webhook]", err);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});
