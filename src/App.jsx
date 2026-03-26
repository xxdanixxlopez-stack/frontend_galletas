import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import LayoutPublico from "./components/LayoutPublico";
import AdminPanel from "./components/AdminPanel";
import PagoCheckout from "./components/PagoCheckout";
import PerfilAdmin from "./components/PerfilAdmin";

import { auth } from "./firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function RutaPrivada({ user, children }) {
  if (!user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const cerrarSesion = async () => {
    await signOut(auth);
  };

  return (
    <Routes>
      {/* PUBLICO */}
      <Route path="/" element={<LayoutPublico user={user} cerrarSesion={cerrarSesion} />} />
      <Route path="/tienda" element={<LayoutPublico user={user} cerrarSesion={cerrarSesion} />} />
      <Route path="/producto/:id" element={<LayoutPublico user={user} cerrarSesion={cerrarSesion} />} />
      <Route path="/carrito" element={<LayoutPublico user={user} cerrarSesion={cerrarSesion} />} />
      <Route path="/ubicacion" element={<LayoutPublico user={user} cerrarSesion={cerrarSesion} />} />

      {/* CHECKOUT */}
      <Route
        path="/checkout"
        element={
          <div className="container">
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Checkout</h2>
              <Elements stripe={stripePromise}>
                <PagoCheckout onPaymentSuccess={() => alert("Pago OK ✅")} />
              </Elements>
            </div>
          </div>
        }
      />

      {/* PRIVADO */}
      <Route
        path="/dashboard"
        element={
          <RutaPrivada user={user}>
            <AdminPanel user={user} cerrarSesion={cerrarSesion} />
          </RutaPrivada>
        }
      />

      <Route
        path="/perfil"
        element={
          <RutaPrivada user={user}>
            <PerfilAdmin user={user} cerrarSesion={cerrarSesion} />
          </RutaPrivada>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}