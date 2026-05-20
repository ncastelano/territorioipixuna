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
} from "lucide-react";



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

export default function FocosMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const mapRef = useRef<mapboxgl.Map | null>(null);

  const hasFitBoundsRef = useRef(false);

  const [points, setPoints] = useState<FireHotspot[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [selectedPoint, setSelectedPoint] = useState<FireHotspot | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);

  const [mapStyle, setMapStyle] = useState<"dark" | "satellite" | "outdoors">(
    "dark"
  );

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

      setPoints(data.points);
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

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setError("NEXT_PUBLIC_MAPBOX_TOKEN não encontrado");

      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,

      style: "mapbox://styles/mapbox/dark-v11",

      center: [-55, -12],

      zoom: 4,

      pitchWithRotate: false,

      dragRotate: false,
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
  }, []);

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

    const source = map.getSource("focos-source") as mapboxgl.GeoJSONSource;

    if (source) {
      source.setData(featureCollection);

      return;
    }

    map.addSource("focos-source", {
      type: "geojson",

      data: featureCollection,
    });

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
            7,

            50,
            14,

            200,
            24,
          ],
        ],

        "circle-color": [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", "risco_fogo"], 0.5],

          0,
          "#facc15",

          0.5,
          "#f97316",

          1,
          "#ef4444",
        ],

        "circle-opacity": 0.92,

        "circle-stroke-width": 1.5,

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
      padding: 80,

      maxZoom: 7,

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

      {/* BOTÃO FOCOS */}
      <div className="floating-fire-button">
        <button className="fire-toggle active">
          <Flame size={18} />

          <span>Focos Diários</span>

          <div className="fire-count">{filteredPoints.length}</div>
        </button>
      </div>

      {/* CONTROLES */}
      <div className="map-controls-group">
        <div className="control-card glass">
          <span className="control-label">Fundo do mapa</span>

          <div className="control-buttons">
            <button
              onClick={() => setMapStyle("dark")}
              className={`control-btn ${mapStyle === "dark" ? "active" : ""}`}
            >
              <MapIcon size={15} />
              <span>Escuro</span>
            </button>

            <button
              onClick={() => setMapStyle("satellite")}
              className={`control-btn ${
                mapStyle === "satellite" ? "active" : ""
              }`}
            >
              <Layers size={15} />
              <span>Satélite</span>
            </button>

            <button
              onClick={() => setMapStyle("outdoors")}
              className={`control-btn ${
                mapStyle === "outdoors" ? "active" : ""
              }`}
            >
              <Compass size={15} />
              <span>Relevo</span>
            </button>
          </div>
        </div>

        <button onClick={fitMapToBounds} className="map-action-btn glass">
          <Maximize2 size={16} />

          <span>Focar</span>
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-card">
            <Flame size={28} className="animate-pulse" />

            <span>Carregando focos...</span>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && <div className="error-card">{error}</div>}

      {/* POPUP */}
      {selectedPoint && (
        <div className="focos-info-panel glass animate-slide-up">
          <div className="panel-header">
            <div>
              <div className="panel-badge">
                🔥 Risco: {(selectedPoint.risco_fogo ?? 0).toFixed(2)}
              </div>

              <h3 className="panel-title">
                {selectedPoint.municipio}, {selectedPoint.estado}
              </h3>
            </div>

            <button
              className="panel-close-btn"
              onClick={() => setSelectedPoint(null)}
            >
              ×
            </button>
          </div>

          <div className="panel-content-grid">
            <div className="panel-meta-item">
              <span className="meta-label">Bioma</span>

              <span
                className="meta-val"
                style={{
                  color: BIOME_COLORS[selectedPoint.bioma] || "#fff",
                }}
              >
                {selectedPoint.bioma}
              </span>
            </div>

            <div className="panel-meta-item">
              <span className="meta-label">Intensidade</span>

              <span className="meta-val highlight-val">
                {selectedPoint.frp !== null
                  ? `${selectedPoint.frp.toFixed(1)} MW`
                  : "N/A"}
              </span>
            </div>

            <div className="panel-meta-item">
              <span className="meta-label">Satélite</span>

              <span className="meta-val">{selectedPoint.satelite}</span>
            </div>

            <div className="panel-meta-item">
              <span className="meta-label">Detectado</span>

              <span className="meta-val">
                {formatTime(selectedPoint.data_hora_gmt)}
              </span>
            </div>
          </div>

          <div className="panel-coords">
            <Info size={12} />

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
