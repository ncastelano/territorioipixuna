// app/components/FireMap.tsx

"use client";

import { useEffect, useState } from "react";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

// Corrige ícones do Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type FireHotspot = {
  id: number;
  latitude: number;
  longitude: number;
  satellite: string;
  detected_at: string;
};

// Ícone customizado de fogo
const fireIcon = new L.Icon({
  iconUrl: "/fire.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function FireMap() {
  const [points, setPoints] = useState<FireHotspot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/fire-hotspots");

        const data = await res.json();

        console.log("FOCOS:", data);

        setPoints(data);
      } catch (error) {
        console.error("Erro ao carregar focos:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
      }}
    >
      <MapContainer
        center={[-8, -63]}
        zoom={5}
        scrollWheelZoom={true}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* TESTE FIXO */}
        <Marker position={[-3.1, -60]}>
          <Popup>Manaus</Popup>
        </Marker>

        {/* FOCOS REAIS */}
        {points.map((point) => (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            icon={fireIcon}
          >
            <Popup>
              <div>
                <strong>🔥 Foco de Queimada</strong>
                <br />
                Satélite: {point.satellite}
                <br />
                Data: {new Date(point.detected_at).toLocaleString()}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* DEBUG */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 9999,
          background: "white",
          padding: 10,
          borderRadius: 8,
        }}
      >
        {loading ? "Carregando..." : `${points.length} focos carregados`}
      </div>
    </div>
  );
}
