// app/page.tsx

"use client";

import { useEffect, useRef, useState } from "react";

import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";

import {
  Plus,
  Layers,
  Satellite,
  Mountain,
  LocateFixed,
  PlusIcon,
  MinusIcon,
  MapPin,
} from "lucide-react";

import { MarkerType } from "@/types/marker";

import AddLocationModal from "@/components/AddLocationModal";

import MarkerCard from "@/components/MarkerCard";

import LocationsDialog from "@/components/LocationsDialog";
import BottomLocais from "@/components/ButtonLocais";

export default function Home() {
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);

  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [mapLoaded, setMapLoaded] = useState(false);

  const [mapStyle, setMapStyle] = useState<"satellite" | "dark" | "outdoors">(
    "satellite"
  );

  const [isMobile, setIsMobile] = useState(false);

  const [markers, setMarkers] = useState<MarkerType[]>([]);

  const [selectedMarker, setSelectedMarker] = useState<MarkerType | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);

  const [showLocationsDialog, setShowLocationsDialog] = useState(false);

  const [selectingLocation, setSelectingLocation] = useState(false);

  const [pendingCoords, setPendingCoords] = useState<{
    lng: number;
    lat: number;
  } | null>(null);

  // =========================
  // MOBILE
  // =========================

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // =========================
  // INIT MAP
  // =========================

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!token) {
      alert("NEXT_PUBLIC_MAPBOX_TOKEN não encontrado");

      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,

      style: "mapbox://styles/mapbox/satellite-streets-v12",

      center: [-54.5, -12.5],

      zoom: isMobile ? 3.5 : 4.2,

      pitch: 0,

      antialias: true,
    });

    map.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: false,
        showCompass: false,
      }),
      "bottom-right"
    );

    map.on("load", () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();

      mapRef.current = null;
    };
  }, [isMobile]);

  // =========================
  // CHANGE STYLE
  // =========================

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    let style = "mapbox://styles/mapbox/satellite-streets-v12";

    if (mapStyle === "dark") {
      style = "mapbox://styles/mapbox/dark-v11";
    }

    if (mapStyle === "outdoors") {
      style = "mapbox://styles/mapbox/outdoors-v12";
    }

    mapRef.current.setStyle(style);
  }, [mapStyle, mapLoaded]);

  // =========================
  // LOAD STORAGE
  // =========================

  useEffect(() => {
    const stored = localStorage.getItem("territorio-markers");

    if (!stored) return;

    try {
      setMarkers(JSON.parse(stored));
    } catch (err) {
      console.error(err);
    }
  }, []);

  // =========================
  // RENDER MARKERS
  // =========================

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    markers.forEach((item) => {
      const el = document.createElement("div");

      const isSynced = item.synced === true;
      // Agora: azul para sincronizado, vermelho para pendente
      const borderColor = isSynced ? "#3b82f6" : "#ef4444";
      const shadowColor = isSynced
        ? "rgba(59,130,246,0.8)"
        : "rgba(239,68,68,0.8)";

      el.style.width = "36px";
      el.style.height = "36px";
      el.style.borderRadius = "999px";
      el.style.border = `3px solid ${borderColor}`;
      el.style.boxShadow = `0 0 12px ${shadowColor}`;
      el.style.cursor = "pointer";
      el.style.background = "#fff";
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.style.backgroundRepeat = "no-repeat";

      // Se tem mídia do tipo foto, usa como thumbnail
      if (item.mediaUrl && item.mediaType === "photo") {
        el.style.backgroundImage = `url(${item.mediaUrl})`;
      } else {
        // Fallback: círculo colorido sólido
        el.style.background = borderColor;
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.fontSize = "20px";
        el.style.color = "#fff";
        el.innerText = "📍";
        el.style.fontWeight = "bold";
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([item.lng, item.lat])
        .addTo(mapRef.current!);

      el.addEventListener("click", () => {
        setSelectedMarker(item);
        mapRef.current?.easeTo({
          center: [item.lng, item.lat],
          zoom: 16, // zoom mais próximo
          duration: 1200,
        });
      });

      markersRef.current.push(marker);
    });
  }, [markers, mapLoaded]);

  // =========================
  // GEOLOCATION
  // =========================

  const goToMyLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return;

    navigator.geolocation.getCurrentPosition((position) => {
      mapRef.current?.flyTo({
        center: [position.coords.longitude, position.coords.latitude],

        zoom: 14,

        duration: 2000,
      });
    });
  };

  // =========================
  // ZOOM
  // =========================

  const zoomIn = () => {
    mapRef.current?.zoomIn({
      duration: 400,
    });
  };

  const zoomOut = () => {
    mapRef.current?.zoomOut({
      duration: 400,
    });
  };

  // =========================
  // SELECT LOCATION
  // =========================

  const startSelectingLocation = () => {
    setSelectingLocation(true);
  };

  const confirmLocation = () => {
    if (!mapRef.current) return;

    const center = mapRef.current.getCenter();

    setPendingCoords({
      lng: center.lng,
      lat: center.lat,
    });

    setSelectingLocation(false);

    setShowAddModal(true);
  };

  // =========================
  // SAVE MARKER
  // =========================

  const handleSaveMarker = (marker: MarkerType) => {
    const updated = [...markers, marker];

    setMarkers(updated);

    localStorage.setItem("territorio-markers", JSON.stringify(updated));

    setShowAddModal(false);

    setPendingCoords(null);
  };

  // =========================
  // REMOVE MARKER
  // =========================

  const removeMarker = (id: string) => {
    const updated = markers.filter((item) => item.id !== id);

    setMarkers(updated);

    localStorage.setItem("territorio-markers", JSON.stringify(updated));

    setSelectedMarker(null);
  };

  // =========================
  // SYNC UPDATE
  // =========================

  const handleSynced = (id: string) => {
    const updated = markers.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          synced: true,
        };
      }

      return item;
    });

    setMarkers(updated);

    localStorage.setItem("territorio-markers", JSON.stringify(updated));
  };

  const syncedCount = markers.filter((m) => m.synced).length;
  const unsyncedCount = markers.filter((m) => !m.synced).length;

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#000",
      }}
    >
      {/* MAP */}
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      {/* SELECT LOCATION MODE */}
      {selectingLocation && (
        <>
          {/* OVERLAY */}
          <div
            style={{
              position: "absolute",
              inset: 0,

              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0.08))",

              zIndex: 40,

              pointerEvents: "none",
            }}
          />

          {/* CENTER PIN */}
          <div
            style={{
              position: "absolute",

              top: "50%",
              left: "50%",

              transform: "translate(-50%, -100%)",

              zIndex: 150,

              pointerEvents: "none",

              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                position: "absolute",

                top: 10,

                width: 80,
                height: 80,

                borderRadius: 999,

                background: "rgba(16,185,129,0.28)",

                filter: "blur(18px)",
              }}
            />

            <MapPin
              size={72}
              color="#ffffff"
              fill="#10b981"
              strokeWidth={2.2}
              style={{
                filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.45))",
              }}
            />

            <div
              style={{
                width: 24,
                height: 10,

                borderRadius: 999,

                background: "rgba(0,0,0,0.45)",

                filter: "blur(5px)",

                marginTop: -6,
              }}
            />
          </div>

          {/* TOP BAR */}
          <div
            style={{
              position: "absolute",

              top: isMobile ? 84 : 92,

              left: 16,
              right: 16,

              zIndex: 160,

              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",

              gap: 14,

              background: "rgba(0,0,0,0.76)",

              backdropFilter: "blur(24px)",

              border: "1px solid rgba(255,255,255,0.08)",

              borderRadius: 22,

              padding: isMobile ? "12px 14px" : "14px 16px",

              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                flex: 1,
              }}
            >
              <div
                style={{
                  color: "#fff",

                  fontWeight: 700,

                  fontSize: isMobile ? 14 : 15,

                  marginBottom: 3,
                }}
              >
                Escolha a localização
              </div>

              <div
                style={{
                  color: "rgba(255,255,255,0.65)",

                  fontSize: 12,
                }}
              >
                Mova o mapa até o pin ficar no local
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
              }}
            >
              <button
                onClick={() => setSelectingLocation(false)}
                style={{
                  height: 44,

                  padding: "0 16px",

                  borderRadius: 14,

                  border: "1px solid rgba(255,255,255,0.08)",

                  background: "rgba(255,255,255,0.06)",

                  color: "#fff",

                  fontWeight: 700,

                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>

              <button
                onClick={confirmLocation}
                style={{
                  height: 44,

                  padding: "0 18px",

                  borderRadius: 14,

                  border: 0,

                  background: "linear-gradient(to right, #10b981, #059669)",

                  color: "#fff",

                  fontWeight: 700,

                  cursor: "pointer",
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </>
      )}

      {/* TOP NAVBAR */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,

          zIndex: 30,

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          pointerEvents: "none",
        }}
      >
        <BottomLocais
          total={markers.length}
          synced={syncedCount} // ← adicione esta linha
          unsynced={unsyncedCount}
          isMobile={isMobile}
          onOpen={() => setShowLocationsDialog(true)}
        />

        {/* CENTER */}
        <div
          style={{
            pointerEvents: "auto",

            position: "absolute",

            left: "50%",

            transform: "translateX(-50%)",

            display: "flex",
            alignItems: "center",
            gap: 8,

            background: "rgba(0,0,0,0.45)",

            backdropFilter: "blur(20px)",

            border: "1px solid rgba(255,255,255,0.08)",

            borderRadius: 24,

            padding: 8,

            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          <button
            onClick={() => setMapStyle("satellite")}
            style={{
              border: 0,

              borderRadius: 16,

              padding: isMobile ? "10px 12px" : "12px 14px",

              background:
                mapStyle === "satellite" ? "#fff" : "rgba(255,255,255,0.06)",

              color: mapStyle === "satellite" ? "#000" : "#fff",

              display: "flex",
              alignItems: "center",
              gap: 8,

              cursor: "pointer",
            }}
          >
            <Satellite size={16} />

            {!isMobile && "Satélite"}
          </button>

          <button
            onClick={() => setMapStyle("dark")}
            style={{
              border: 0,

              borderRadius: 16,

              padding: isMobile ? "10px 12px" : "12px 14px",

              background:
                mapStyle === "dark" ? "#fff" : "rgba(255,255,255,0.06)",

              color: mapStyle === "dark" ? "#000" : "#fff",

              display: "flex",
              alignItems: "center",
              gap: 8,

              cursor: "pointer",
            }}
          >
            <Layers size={16} />

            {!isMobile && "Escuro"}
          </button>

          <button
            onClick={() => setMapStyle("outdoors")}
            style={{
              border: 0,

              borderRadius: 16,

              padding: isMobile ? "10px 12px" : "12px 14px",

              background:
                mapStyle === "outdoors" ? "#fff" : "rgba(255,255,255,0.06)",

              color: mapStyle === "outdoors" ? "#000" : "#fff",

              display: "flex",
              alignItems: "center",
              gap: 8,

              cursor: "pointer",
            }}
          >
            <Mountain size={16} />

            {!isMobile && "Relevo"}
          </button>
        </div>

        {/* RIGHT */}
        <div
          style={{
            pointerEvents: "auto",

            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            onClick={goToMyLocation}
            style={{
              border: "1px solid rgba(255,255,255,0.08)",

              width: isMobile ? 46 : 50,
              height: isMobile ? 46 : 50,

              borderRadius: 18,

              background: "rgba(0,0,0,0.45)",

              backdropFilter: "blur(20px)",

              color: "#fff",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              cursor: "pointer",

              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            <LocateFixed size={18} />
          </button>

          {/* IMPORTANTE:
              esse botão NÃO pode ficar dentro de overlay
              e precisa de pointerEvents auto
          */}
          <button
            onClick={startSelectingLocation}
            style={{
              pointerEvents: "auto",

              border: "1px solid rgba(255,255,255,0.08)",

              width: isMobile ? 46 : 50,
              height: isMobile ? 46 : 50,

              borderRadius: 18,

              background: "rgba(0,0,0,0.45)",

              backdropFilter: "blur(20px)",

              color: "#fff",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              cursor: "pointer",

              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* CUSTOM ZOOM */}
      <div className="custom-zoom-controls">
        <button onClick={zoomIn} className="zoom-btn">
          <PlusIcon size={18} />
        </button>

        <div className="zoom-divider" />

        <button onClick={zoomOut} className="zoom-btn">
          <MinusIcon size={18} />
        </button>
      </div>

      {/* ADD MODAL */}
      {showAddModal && pendingCoords && (
        <AddLocationModal
          lng={pendingCoords.lng}
          lat={pendingCoords.lat}
          onClose={() => {
            setShowAddModal(false);

            setPendingCoords(null);
          }}
          onSave={handleSaveMarker}
        />
      )}

      {/* MARKER CARD */}
      {selectedMarker && (
        <MarkerCard
          marker={selectedMarker}
          onClose={() => setSelectedMarker(null)}
          onRemove={removeMarker}
        />
      )}

      {/* LOCATIONS DIALOG */}
      {showLocationsDialog && (
        <LocationsDialog
          markers={markers}
          onClose={() => setShowLocationsDialog(false)}
          onSynced={handleSynced}
        />
      )}
    </div>
  );
}
