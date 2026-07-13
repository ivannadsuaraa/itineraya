import { lazy, Suspense, useCallback, useState } from "react";
import { Loader2 } from "lucide-react";

// @stripe/react-stripe-js (~24 kB) only matters once the user actually opens
// checkout — this hook is imported eagerly from three routes (pricing,
// new-trip, my-trip.$tripId), which was enough for Rollup's default chunking
// to hoist it into the app-wide shared chunk downloaded on every page,
// including ones that never touch Stripe (landing, demo, explore). lazy()
// keeps it in its own chunk, fetched only when `isOpen` first flips true.
const StripeEmbeddedCheckout = lazy(() =>
  import("@/components/StripeEmbeddedCheckout").then((m) => ({
    default: m.StripeEmbeddedCheckout,
  })),
);

interface CheckoutOptions {
  priceId: string;
  returnUrl?: string;
  mode?: "subscription" | "payment";
}

function CheckoutFallback() {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
    </div>
  );
}

export function useStripeCheckout() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<CheckoutOptions | null>(null);

  const openCheckout = useCallback((opts: CheckoutOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  const checkoutElement =
    isOpen && options ? (
      <Suspense fallback={<CheckoutFallback />}>
        <StripeEmbeddedCheckout {...options} />
      </Suspense>
    ) : null;

  return { openCheckout, closeCheckout, isOpen, checkoutElement };
}
