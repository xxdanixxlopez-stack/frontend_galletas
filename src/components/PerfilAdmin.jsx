export default function PerfilAdmin({ user, cerrarSesion }) {
  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Perfil Admin</h2>

        {user ? (
          <>
            <p><b>Nombre:</b> {user.displayName || "Sin nombre"}</p>
            <p><b>Email:</b> {user.email}</p>
            <button className="btn outline" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <p>No hay sesión activa.</p>
        )}
      </div>
    </div>
  );
}