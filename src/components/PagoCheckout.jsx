import { useEffect, useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";

const API = import.meta.env.VITE_API_URL;

export default function PagoCheckout({ onPaymentSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // crea payment intent en backend
    fetch(`${API}/api/payments/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}) // si tu backend recibe amount, aquí lo mandas
    })
      .then((r) => r.json())
      .then((data) => setClientSecret(data.clientSecret))
      .catch(() => setMsg("No se pudo iniciar el pago"));
  }, []);

  const pagar = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setMsg("");

    const card = elements.getElement(CardElement);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });

    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    if (paymentIntent.status === "succeeded") {
      setMsg("Pago realizado ✅");
      onPaymentSuccess?.();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={pagar}>
      <div style={{ padding: 12, border: "1px solid rgba(0,0,0,.1)", borderRadius: 12 }}>
        <CardElement />
      </div>

      <button className="btn" style={{ marginTop: 12 }} disabled={!stripe || !clientSecret || loading}>
        {loading ? "Procesando..." : "Pagar"}
      </button>

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
    </form>
  );
}