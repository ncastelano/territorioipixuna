"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";

import {
  Flame,
  Layers,
  Map as MapIcon,
  Maximize2,
  Info,
  Compass,
  FileText,
  Clock3,
} from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const BIOME_COLORS: Record<string, string> = {
  Amazônia: "#10b981",
  Cerrado: "#f59e0b",
  Caatinga: "#b45309",
  Pantanal: "#06b6d4",
  "Mata Atlântica": "#047857",
  Pampa: "#84cc16",
  Outros: "#6b7280",
};

interface FireHotspot {
  id: string;
  lat: number;
  lon: number;
  data_hora_gmt: string;
  satelite: string;
  municipio: string;
  estado: string;
  risco_fogo: number | null;
  bioma: string;
  frp: number | null;
}

interface CsvInfo {
  fileName?: string;
  updatedAt?: string;
}

export default function MapaPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const mapRef = useRef<mapboxgl.Map | null>(null);

  const hasFitBoundsRef = useRef(false);

  const [points, setPoints] = useState<FireHotspot[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [selectedPoint, setSelectedPoint] = useState<FireHotspot | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);

  const [csvInfo, setCsvInfo] = useState<CsvInfo>({});

  const [isMobile, setIsMobile] = useState(false);

  const [mapStyle, setMapStyle] = useState<"dark" | "satellite" | "outdoors">(
    "dark"
  );

  // =========================
  // MOBILE DETECT
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
  // LOAD API
  // =========================

  const loadData = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/focos-diarios");

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao carregar dados");
      }

      setPoints(data.points || []);

      // PEGA INFO DO CSV
      setCsvInfo({
        fileName:
          data.fileName || data.csvFile || data.file || "focos_diarios.csv",

        updatedAt:
          data.updatedAt ||
          data.lastModified ||
          data.generatedAt ||
          new Date().toISOString(),
      });
    } catch (err: any) {
      console.error(err);

      setError(err.message || "Erro ao carregar focos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // MAP INIT
  // =========================

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    if (!MAPBOX_TOKEN) {
      setError("NEXT_PUBLIC_MAPBOX_TOKEN não encontrado");

      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,

      style: "mapbox://styles/mapbox/dark-v11",

      // MOBILE MAIS FECHADO
      center: isMobile ? [-54, -13] : [-55, -12],

      zoom: isMobile ? 3.2 : 4,

      pitchWithRotate: false,

      dragRotate: false,

      antialias: true,
    });

    map.addControl(
      new mapboxgl.NavigationControl({
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
  // MAP STYLE
  // =========================

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    let styleUrl = "mapbox://styles/mapbox/dark-v11";

    if (mapStyle === "satellite") {
      styleUrl = "mapbox://styles/mapbox/satellite-streets-v12";
    }

    if (mapStyle === "outdoors") {
      styleUrl = "mapbox://styles/mapbox/outdoors-v12";
    }

    map.setStyle(styleUrl);

    map.once("style.load", () => {
      setupMapLayers();
    });
  }, [mapStyle]);

  // =========================
  // FILTERED
  // =========================

  const filteredPoints = useMemo(() => {
    return points;
  }, [points]);

  // =========================
  // MAP LAYERS
  // =========================

  const setupMapLayers = () => {
    const map = mapRef.current;

    if (!map) return;

    const featureCollection = {
      type: "FeatureCollection" as const,

      features: filteredPoints.map((p) => ({
        type: "Feature" as const,

        geometry: {
          type: "Point" as const,

          coordinates: [p.lon, p.lat],
        },

        properties: {
          ...p,
        },
      })),
    };

    const source = map.getSource("focos-source") as
      | mapboxgl.GeoJSONSource
      | undefined;

    if (source) {
      source.setData(featureCollection);

      return;
    }

    map.addSource("focos-source", {
      type: "geojson",

      data: featureCollection,
    });

    // GLOW
    map.addLayer({
      id: "focos-glow",

      type: "circle",

      source: "focos-source",

      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 10, 8, 22],

        "circle-color": "#ff5500",

        "circle-opacity": 0.25,

        "circle-blur": 1,
      },
    });

    // PONTO PRINCIPAL
    map.addLayer({
      id: "focos-circles",

      type: "circle",

      source: "focos-source",

      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],

          3,

          [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "frp"], 10],

            0,
            3,

            50,
            5,

            200,
            8,
          ],

          10,

          [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "frp"], 10],

            0,
            8,

            50,
            16,

            200,
            28,
          ],
        ],

        "circle-color": [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", "risco_fogo"], 0.5],

          0,
          "#fde047",

          0.5,
          "#fb923c",

          1,
          "#ef4444",
        ],

        "circle-opacity": 0.95,

        "circle-stroke-width": 2,

        "circle-stroke-color": "#ffffff",
      },
    });

    map.on("mouseenter", "focos-circles", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "focos-circles", () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("click", "focos-circles", (event) => {
      const properties = event.features?.[0]?.properties;

      if (!properties) return;

      setSelectedPoint(properties as FireHotspot);

      map.easeTo({
        center: [properties.lon, properties.lat],

        zoom: Math.max(map.getZoom(), 7),

        duration: 1000,
      });
    });
  };

  // =========================
  // UPDATE MAP
  // =========================

  useEffect(() => {
    if (!mapLoaded) return;

    setupMapLayers();
  }, [filteredPoints, mapLoaded]);

  // =========================
  // FIT BOUNDS
  // =========================

  const fitMapToBounds = () => {
    if (!mapRef.current || filteredPoints.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    filteredPoints.forEach((p) => {
      bounds.extend([p.lon, p.lat]);
    });

    mapRef.current.fitBounds(bounds, {
      padding: isMobile ? 40 : 80,

      maxZoom: isMobile ? 5 : 7,

      duration: 1200,
    });
  };

  useEffect(() => {
    if (mapLoaded && filteredPoints.length > 0 && !hasFitBoundsRef.current) {
      fitMapToBounds();

      hasFitBoundsRef.current = true;
    }
  }, [filteredPoints, mapLoaded]);

  // =========================
  // TIME FORMAT
  // =========================

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "N/A";

    try {
      const date = new Date(timeStr);

      return date.toLocaleString("pt-BR");
    } catch {
      return timeStr;
    }
  };

  // =========================
  // RENDER
  // =========================

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
      {/* MAPA */}
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      {/* BOTÃO */}
      <div
        style={{
          position: "absolute",
          top: isMobile ? 14 : 20,
          left: isMobile ? 14 : 20,
          zIndex: 20,
        }}
      >
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderRadius: 999,
            padding: isMobile ? "12px 16px" : "14px 18px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(16px)",
            color: "#fff",
            fontWeight: 600,
            fontSize: isMobile ? 12 : 14,
            boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
          }}
        >
          <Flame size={18} color="#ef4444" />

          {!isMobile && <span>Focos Diários</span>}

          <div
            style={{
              minWidth: 28,
              height: 28,
              borderRadius: 999,
              background: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              padding: "0 8px",
            }}
          >
            {filteredPoints.length}
          </div>
        </button>
      </div>

      {/* CARD CSV */}
      <div
        style={{
          position: "absolute",
          top: isMobile ? 14 : 20,
          right: isMobile ? 14 : 20,
          zIndex: 20,
          width: isMobile ? 220 : 280,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "14px 16px",
          color: "#fff",
          boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
            fontWeight: 700,
            fontSize: 13,
            opacity: 0.9,
          }}
        >
          <FileText size={15} />

          <span>Arquivo CSV</span>
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#ffffff",
            wordBreak: "break-word",
            lineHeight: 1.4,
            marginBottom: 10,
          }}
        >
          {csvInfo.fileName || "focos_diarios.csv"}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            opacity: 0.72,
          }}
        >
          <Clock3 size={13} />

          <span>
            {csvInfo.updatedAt
              ? formatTime(csvInfo.updatedAt)
              : "Sem informação"}
          </span>
        </div>
      </div>

      {/* CONTROLES */}
      <div
        style={{
          position: "absolute",
          bottom: isMobile ? 18 : 20,
          right: isMobile ? 14 : 20,
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            padding: 10,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 8,
          }}
        >
          <button
            onClick={() => setMapStyle("dark")}
            style={{
              border: 0,
              borderRadius: 16,
              padding: "10px 14px",
              background:
                mapStyle === "dark" ? "#ffffff" : "rgba(255,255,255,0.06)",
              color: mapStyle === "dark" ? "#000" : "#fff",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <MapIcon size={16} />
            {!isMobile && "Escuro"}
          </button>

          <button
            onClick={() => setMapStyle("satellite")}
            style={{
              border: 0,
              borderRadius: 16,
              padding: "10px 14px",
              background:
                mapStyle === "satellite" ? "#ffffff" : "rgba(255,255,255,0.06)",
              color: mapStyle === "satellite" ? "#000" : "#fff",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <Layers size={16} />
            {!isMobile && "Satélite"}
          </button>

          <button
            onClick={() => setMapStyle("outdoors")}
            style={{
              border: 0,
              borderRadius: 16,
              padding: "10px 14px",
              background:
                mapStyle === "outdoors" ? "#ffffff" : "rgba(255,255,255,0.06)",
              color: mapStyle === "outdoors" ? "#000" : "#fff",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <Compass size={16} />
            {!isMobile && "Relevo"}
          </button>
        </div>

        <button
          onClick={fitMapToBounds}
          style={{
            border: 0,
            borderRadius: 18,
            padding: "14px 18px",
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(16px)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <Maximize2 size={16} />
          {!isMobile && "Focar"}
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(10px)",
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "rgba(20,20,20,0.9)",
              padding: "22px 26px",
              borderRadius: 24,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 14,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Flame size={24} color="#ef4444" />

            <span>Carregando focos...</span>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            zIndex: 20,
            background: "#7f1d1d",
            color: "#fff",
            padding: "14px 18px",
            borderRadius: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* POPUP */}
      {selectedPoint && (
        <div
          style={{
            position: "absolute",
            bottom: isMobile ? 12 : 20,
            left: isMobile ? 12 : 20,
            width: isMobile ? "calc(100% - 24px)" : 360,
            background: "rgba(0,0,0,0.82)",
            backdropFilter: "blur(18px)",
            borderRadius: 28,
            padding: isMobile ? 18 : 24,
            color: "#fff",
            zIndex: 20,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              marginBottom: 18,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#ef4444",
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                🔥 Risco: {(selectedPoint.risco_fogo ?? 0).toFixed(2)}
              </div>

              <h3
                style={{
                  fontSize: isMobile ? 16 : 20,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {selectedPoint.municipio}, {selectedPoint.estado}
              </h3>
            </div>

            <button
              onClick={() => setSelectedPoint(null)}
              style={{
                border: 0,
                background: "rgba(255,255,255,0.08)",
                width: 34,
                height: 34,
                borderRadius: 999,
                color: "#fff",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.6,
                  marginBottom: 6,
                }}
              >
                Bioma
              </div>

              <div
                style={{
                  color: BIOME_COLORS[selectedPoint.bioma] || "#ffffff",
                  fontWeight: 700,
                }}
              >
                {selectedPoint.bioma}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.6,
                  marginBottom: 6,
                }}
              >
                Intensidade
              </div>

              <div
                style={{
                  fontWeight: 700,
                }}
              >
                {selectedPoint.frp !== null
                  ? `${selectedPoint.frp.toFixed(1)} MW`
                  : "N/A"}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.6,
                  marginBottom: 6,
                }}
              >
                Satélite
              </div>

              <div>{selectedPoint.satelite}</div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.6,
                  marginBottom: 6,
                }}
              >
                Detectado
              </div>

              <div>{formatTime(selectedPoint.data_hora_gmt)}</div>
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              paddingTop: 18,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              opacity: 0.8,
            }}
          >
            <Info size={14} />

            <span>
              Lat: {selectedPoint.lat.toFixed(5)}
              {" | "}
              Lon: {selectedPoint.lon.toFixed(5)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
