
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function AdminPanel({ user, cerrarSesion }) {
  const [productos, setProductos] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // Form
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    presentacion: "",
    precio: 0,
    categoria: "General",
    stock: 0,
    disponible: true,
    imagenUrl: "",
    ingredientes: "",
    alergenos: "",
  });

  const [editId, setEditId] = useState(null);

  const cargar = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await fetch(`${API}/api/productos`);
      const data = await res.json();
      setProductos(data);
    } catch (e) {
      setErr("No se pudieron cargar productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const onChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const limpiar = () => {
    setEditId(null);
    setForm({
      nombre: "",
      descripcion: "",
      presentacion: "",
      precio: 0,
      categoria: "General",
      stock: 0,
      disponible: true,
      imagenUrl: "",
      ingredientes: "",
      alergenos: "",
    });
  };

  const guardar = async (e) => {
    e.preventDefault();
    setErr("");

    const payload = {
      ...form,
      precio: Number(form.precio),
      stock: Number(form.stock),
      ingredientes: form.ingredientes
        ? form.ingredientes.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      alergenos: form.alergenos
        ? form.alergenos.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    };

    try {
      const url = editId ? `${API}/api/productos/${editId}` : `${API}/api/productos`;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.error || "Error guardando");
      }

      limpiar();
      await cargar();
    } catch (e) {
      setErr(e.message);
    }
  };

  const editar = (p) => {
    setEditId(p._id);
    setForm({
      nombre: p.nombre || "",
      descripcion: p.descripcion || "",
      presentacion: p.presentacion || "",
      precio: p.precio ?? 0,
      categoria: p.categoria || "General",
      stock: p.stock ?? 0,
      disponible: !!p.disponible,
      imagenUrl: p.imagenUrl || "",
      ingredientes: (p.ingredientes || []).join(", "),
      alergenos: (p.alergenos || []).join(", "),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar producto?")) return;
    try {
      const res = await fetch(`${API}/api/productos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar");
      await cargar();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Panel Admin</h2>
            <div style={{ color: "var(--muted)" }}>
              {user?.displayName} ({user?.email})
            </div>
          </div>
          <button className="btn outline" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid rgba(0,0,0,.08)", margin: "14px 0" }} />

        <h3>{editId ? "Editar producto" : "Nuevo producto"}</h3>

        {err && <div className="card" style={{ boxShadow: "none" }}>Error: {err}</div>}

        <form onSubmit={guardar} style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input className="input" placeholder="Nombre" value={form.nombre} onChange={(e) => onChange("nombre", e.target.value)} required />
            <input className="input" placeholder="Categoría" value={form.categoria} onChange={(e) => onChange("categoria", e.target.value)} />
          </div>

          <input className="input" placeholder="Presentación (Caja 6, Bolsa 250g...)" value={form.presentacion} onChange={(e) => onChange("presentacion", e.target.value)} />
          <input className="input" placeholder="Imagen URL (opcional)" value={form.imagenUrl} onChange={(e) => onChange("imagenUrl", e.target.value)} />

          <textarea className="input" style={{ minHeight: 90 }} placeholder="Descripción" value={form.descripcion} onChange={(e) => onChange("descripcion", e.target.value)} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <input className="input" type="number" min="0" step="0.01" placeholder="Precio" value={form.precio} onChange={(e) => onChange("precio", e.target.value)} required />
            <input className="input" type="number" min="0" placeholder="Stock" value={form.stock} onChange={(e) => onChange("stock", e.target.value)} />
            <select value={String(form.disponible)} onChange={(e) => onChange("disponible", e.target.value === "true")}>
              <option value="true">Disponible</option>
              <option value="false">No disponible</option>
            </select>
          </div>

          <input className="input" placeholder="Ingredientes (separados por coma)" value={form.ingredientes} onChange={(e) => onChange("ingredientes", e.target.value)} />
          <input className="input" placeholder="Alérgenos (separados por coma)" value={form.alergenos} onChange={(e) => onChange("alergenos", e.target.value)} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" type="submit">{editId ? "Actualizar" : "Guardar"}</button>
            <button className="btn outline" type="button" onClick={limpiar}>Limpiar</button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Productos</h3>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {productos.map((p) => (
              <div key={p._id} className="card" style={{ boxShadow: "none", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <b>{p.nombre}</b>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    ${Number(p.precio).toFixed(2)} · {p.categoria} · Stock: {p.stock ?? 0}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn outline" onClick={() => editar(p)}>Editar</button>
                  <button className="btn outline" onClick={() => eliminar(p._id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}