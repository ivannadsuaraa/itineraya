const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-red-300 bg-red-100 px-4 py-2 text-center text-sm text-red-800">
        Los pagos en producción aún no están configurados. Completa la activación en el panel de pagos.
      </div>
    );
  }
  if (typeof clientToken === "string" && clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-orange-300 bg-orange-100 px-4 py-2 text-center text-sm text-orange-800">
        Estás en modo de pruebas. Los pagos no son reales — usa la tarjeta{" "}
        <span className="font-mono font-semibold">4242 4242 4242 4242</span>.
      </div>
    );
  }
  return null;
}
