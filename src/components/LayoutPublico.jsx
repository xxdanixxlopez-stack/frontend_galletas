
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import UbicacionMapa from "./UbicacionMapa";

import { auth } from "../firebaseConfig";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const API = import.meta.env.VITE_API_URL;

// ===== Helpers API =====
async function apiGetProductos({ q = "", categoria = "", disponible = "" } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (categoria) params.set("categoria", categoria);
  if (disponible !== "") params.set("disponible", String(disponible));

  const res = await fetch(`${API}/api/productos?${params.toString()}`);
  if (!res.ok) throw new Error("Error cargando productos");
  return res.json();
}

async function apiGetProductoById(id) {
  const res = await fetch(`${API}/api/productos/${id}`);
  if (!res.ok) throw new Error("Producto no encontrado");
  return res.json();
}

export default function LayoutPublico({ user, cerrarSesion }) {
  const { pathname } = useLocation();

  // ===== Login Google =====
  const [authError, setAuthError] = useState("");

  const loginGoogle = async () => {
    try {
      setAuthError("");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      setAuthError(e?.message || "Error al iniciar sesión con Google");
    }
  };

  // ===== Carrito (guardado en localStorage para no perderlo al recargar) =====
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart_galletas") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cart_galletas", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (producto) => {
    setCart((prev) => {
      const found = prev.find((i) => i.producto._id === producto._id);
      if (found) {
        return prev.map((i) =>
          i.producto._id === producto._id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { producto, qty: 1 }];
    });
  };

  const removeFromCart = (id) =>
    setCart((prev) => prev.filter((i) => i.producto._id !== id));

  const setQty = (id, qty) =>
    setCart((prev) =>
      prev.map((i) =>
        i.producto._id === id ? { ...i, qty: Math.max(1, qty) } : i
      )
    );

  const clearCart = () => setCart([]);

  const cartCount = useMemo(() => cart.reduce((acc, i) => acc + i.qty, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((acc, i) => acc + (Number(i.producto.precio) || 0) * i.qty, 0),
    [cart]
  );

  // ===== Navbar =====
  const Navbar = () => (
    <div className="nav">
      <div className="nav-inner">
        <Link to="/" className="logo">
          <div className="logo-dot">🍪</div>
          <div>
            <div style={{ lineHeight: 1.1, fontWeight: 800 }}>Tienda de Galletas</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Artesanales & Novedades</div>
          </div>
        </Link>

        <div className="nav-links">
          <Link to="/" className="badge">Inicio</Link>
          <Link to="/tienda" className="badge">Tienda</Link>
          <Link to="/ubicacion" className="badge">Ubicación</Link>
          <Link to="/carrito" className="badge">Carrito ({cartCount})</Link>

          {user ? (
            <>
              <span className="badge">{user.displayName || "Admin"} ✅</span>
              <Link to="/dashboard" className="badge">Admin</Link>
              <button className="btn outline" onClick={cerrarSesion}>Salir</button>
            </>
          ) : (
            <button className="btn" onClick={loginGoogle}>Admin (Google)</button>
          )}
        </div>
      </div>
    </div>
  );

  const Footer = () => (
    <div className="footer">
      © {new Date().getFullYear()} Tienda de Galletas · Proyecto
    </div>
  );

  // ===== HOME =====
  const Home = () => (
    <div className="container">
      <div className="card" style={{ padding: 22 }}>
        <div className="badge">Bienvenido</div>
        <h1 style={{ margin: "10px 0 6px" }}>Galletas 🍪</h1>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Explora el catálogo por categorías, revisa ingredientes y compra con carrito y pago.
        </p>

        {!user && authError && (
          <div className="card" style={{ marginTop: 12 }}>
            Error de Google: {authError}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <Link to="/tienda" className="btn">Ver Tienda</Link>
          <Link to="/carrito" className="btn outline">Ver Carrito</Link>
        </div>
      </div>
    </div>
  );

  // ===== TIENDA =====
  const Tienda = () => {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [q, setQ] = useState("");
    const [categoria, setCategoria] = useState("");
    const [disponible, setDisponible] = useState(""); // "" | true | false

    useEffect(() => {
      let alive = true;
      setLoading(true);
      setErr("");

      apiGetProductos({ q, categoria, disponible })
        .then((data) => { if (alive) setProductos(data); })
        .catch((e) => { if (alive) setErr(e.message); })
        .finally(() => { if (alive) setLoading(false); });

      return () => { alive = false; };
    }, [q, categoria, disponible]);

    const categorias = ["", ...Array.from(new Set(productos.map(p => p.categoria || "General")))];

    return (
      <div className="container">
        <div className="card" style={{ marginBottom: 14 }}>
          <h2 style={{ marginTop: 0 }}>Tienda</h2>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>Buscar</label>
              <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej: chispas, avena..." />
            </div>

            <div>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>Categoría</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {categorias.map((c) => (
                  <option key={c} value={c}>{c === "" ? "Todas" : c}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>Disponibilidad</label>
              <select
                value={disponible === "" ? "" : String(disponible)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") setDisponible("");
                  else setDisponible(v === "true");
                }}
              >
                <option value="">Todas</option>
                <option value="true">Disponibles</option>
                <option value="false">Agotadas</option>
              </select>
            </div>
          </div>
        </div>

        {loading && <div className="card">Cargando productos...</div>}
        {err && <div className="card">Error: {err}</div>}

        {!loading && !err && (
          <div className="grid">
            {productos.map((p) => {
              const ok = p.disponible && (p.stock ?? 0) > 0;

              return (
                <div key={p._id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span className="badge">{p.categoria || "General"}</span>
                    <span className="badge" style={{ background: ok ? "#e7fff1" : "#ffeaea", color: ok ? "#067a3a" : "#a40000" }}>
                      {ok ? "Disponible" : "Agotado"}
                    </span>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div style={{ height: 150, borderRadius: 14, background: "#ffe1f0", display: "grid", placeItems: "center", overflow: "hidden" }}>
                      {p.imagenUrl ? (
                        <img src={p.imagenUrl} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ fontSize: 42 }}>🍪</div>
                      )}
                    </div>
                  </div>

                  <h3 style={{ margin: "12px 0 6px" }}>{p.nombre}</h3>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    {p.presentacion || "Presentación"} · Stock: {p.stock ?? 0}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <b>${Number(p.precio).toFixed(2)}</b>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link to={`/producto/${p._id}`} className="btn outline">Ver</Link>
                      <button className="btn" disabled={!ok} onClick={() => addToCart(p)}>Añadir</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ===== DETALLE =====
  const Detalle = () => {
    const { id } = useParams();
    const [p, setP] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
      let alive = true;
      setLoading(true);
      setErr("");

      apiGetProductoById(id)
        .then((data) => { if (alive) setP(data); })
        .catch((e) => { if (alive) setErr(e.message); })
        .finally(() => { if (alive) setLoading(false); });

      return () => { alive = false; };
    }, [id]);

    if (loading) return <div className="container"><div className="card">Cargando...</div></div>;
    if (err) return <div className="container"><div className="card">Error: {err}</div></div>;
    if (!p) return null;

    const ok = p.disponible && (p.stock ?? 0) > 0;

    return (
      <div className="container">
        <div className="card">
          <span className="badge">{p.categoria || "General"}</span>
          <h2 style={{ margin: "10px 0 6px" }}>{p.nombre}</h2>
          <div style={{ color: "var(--muted)" }}>{p.presentacion || ""}</div>

          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 14 }}>
            <div style={{ height: 260, borderRadius: 18, background: "#ffe1f0", overflow: "hidden", display: "grid", placeItems: "center" }}>
              {p.imagenUrl ? (
                <img src={p.imagenUrl} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ fontSize: 72 }}>🍪</div>
              )}
            </div>

            <div>
              <h3 style={{ marginTop: 0 }}>${Number(p.precio).toFixed(2)}</h3>
              <div className="badge" style={{ background: ok ? "#e7fff1" : "#ffeaea", color: ok ? "#067a3a" : "#a40000" }}>
                {ok ? "Disponible" : "Agotado"} · Stock: {p.stock ?? 0}
              </div>

              <p style={{ color: "var(--muted)", marginTop: 12 }}>
                {p.descripcion || "Sin descripción por el momento."}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="card" style={{ boxShadow: "none" }}>
                  <b>Ingredientes</b>
                  <ul style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                    {(p.ingredientes?.length ? p.ingredientes : ["No especificado"]).map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
                <div className="card" style={{ boxShadow: "none" }}>
                  <b>Alérgenos</b>
                  <ul style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                    {(p.alergenos?.length ? p.alergenos : ["No especificado"]).map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <button className="btn" disabled={!ok} onClick={() => addToCart(p)}>Añadir al carrito</button>
                <Link to="/carrito" className="btn outline">Ir al carrito</Link>
                <Link to="/tienda" className="btn outline">Volver</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== CARRITO =====
  const Carrito = () => (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Carrito</h2>

        {cart.length === 0 ? (
          <>
            <p style={{ color: "var(--muted)" }}>Tu carrito está vacío.</p>
            <Link className="btn" to="/tienda">Ir a la tienda</Link>
          </>
        ) : (
          <>
            <div style={{ display: "grid", gap: 10 }}>
              {cart.map(({ producto, qty }) => (
                <div key={producto._id} className="card" style={{ boxShadow: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <b>{producto.nombre}</b>
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>
                      ${Number(producto.precio).toFixed(2)} · {producto.presentacion || ""}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      className="input"
                      style={{ width: 90 }}
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => setQty(producto._id, Number(e.target.value))}
                    />
                    <b>${(Number(producto.precio) * qty).toFixed(2)}</b>
                    <button className="btn outline" onClick={() => removeFromCart(producto._id)}>Quitar</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ color: "var(--muted)" }}>Total</div>
                <h2 style={{ margin: "6px 0 0" }}>${cartTotal.toFixed(2)}</h2>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn outline" onClick={clearCart}>Vaciar</button>
                <Link className="btn" to="/checkout">Pagar</Link>
                <Link className="btn outline" to="/tienda">Seguir comprando</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ===== UBICACION =====
  const Ubicacion = () => (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Ubicación</h2>
        <p style={{ color: "var(--muted)" }}>
          Aquí se muestra el mapa solicitado en la evidencia.
        </p>
        <UbicacionMapa />
      </div>
    </div>
  );

  //  Render por ruta 
  let contenido = <Home />;
  if (pathname.startsWith("/tienda")) contenido = <Tienda />;
  if (pathname.startsWith("/producto/")) contenido = <Detalle />;
  if (pathname.startsWith("/carrito")) contenido = <Carrito />;
  if (pathname.startsWith("/ubicacion")) contenido = <Ubicacion />;

  return (
    <>
      <Navbar />
      {contenido}
      <Footer />
    </>
  );
}