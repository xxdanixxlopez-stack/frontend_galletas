import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function UbicacionMapa({ onCoords }) {
  const [coords, setCoords] = useState(null);
  const [estado, setEstado] = useState("Buscando ubicación...");

  useEffect(() => {
    if (!navigator.geolocation) {
      setEstado("Tu navegador no soporta geolocalización");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const c = { lat, lng };
        setCoords(c);

        // ✅ FIX: solo llama onCoords si existe
        if (typeof onCoords === "function") onCoords(c);

        setEstado("Ubicación lista ✅");
      },
      (err) => setEstado("Error GPS: " + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onCoords]);

  return (
    <div style={{ marginTop: 12 }}>
      <h4 style={{ marginBottom: 8 }}>Ubicación actual</h4>
      <p style={{ marginTop: 0 }}>{estado}</p>

      {coords && (
        <div
          style={{
            height: 320,
            borderRadius: 10,
            overflow: "hidden",
            border: "1px solid #ccc",
          }}
        >
          <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={16}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={[coords.lat, coords.lng]}>
              <Popup>
                Estás aquí <br />
                Lat: {coords.lat.toFixed(6)}
                <br />
                Lng: {coords.lng.toFixed(6)}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      {coords && (
        <p style={{ marginTop: 10 }}>
          <b>Lat:</b> {coords.lat} &nbsp; | &nbsp; <b>Lng:</b> {coords.lng}
        </p>
      )}
    </div>
  );
}