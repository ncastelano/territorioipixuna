"use client";

import dynamic from "next/dynamic";

const FocosMap = dynamic(() => import("@/components/FocosMap"), {
  ssr: false,
  loading: () => (
    <div className="map-page-loading">
      <div className="loader-container">
        <div className="loading-pulse-glow"></div>
        <p className="loading-text">Carregando mapa de queimadas...</p>
      </div>
    </div>
  ),
});

export default function MapaPage() {
  return <FocosMap />;
}
