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
  Globe,
  Search,
  X,
} from "lucide-react";
import { MarkerType } from "@/types/marker";
import AddLocationModal from "@/components/AddLocationModal";
import MarkerCard from "@/components/MarkerCard";
import LocationsDialog from "@/components/LocationsDialog";
import BottomLocais from "@/components/ButtonLocais";
import { getSupabaseClient } from "@/lib/supabase";

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
  const [publicMarkers, setPublicMarkers] = useState<MarkerType[]>([]);
  const [groupMarkers, setGroupMarkers] = useState<MarkerType[]>([]);
  const [revealedGroupIds, setRevealedGroupIds] = useState<Set<string>>(
    new Set()
  );
  const [showExplorer, setShowExplorer] = useState(false);
  const [searchGroup, setSearchGroup] = useState("");
  const [searchPassword, setSearchPassword] = useState("");
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLocationsDialog, setShowLocationsDialog] = useState(false);
  const [selectingLocation, setSelectingLocation] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{
    lng: number;
    lat: number;
  } | null>(null);

  // MOBILE
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // INIT MAP
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
    map.on("load", () => setMapLoaded(true));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [isMobile]);

  // CHANGE STYLE
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    let style = "mapbox://styles/mapbox/satellite-streets-v12";
    if (mapStyle === "dark") style = "mapbox://styles/mapbox/dark-v11";
    if (mapStyle === "outdoors") style = "mapbox://styles/mapbox/outdoors-v12";
    mapRef.current.setStyle(style);
  }, [mapStyle, mapLoaded]);

  // LOAD STORAGE (LOCAIS)
  useEffect(() => {
    const stored = localStorage.getItem("territorio-markers");
    if (stored) {
      try {
        setMarkers(JSON.parse(stored));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  // CARREGAR PÚBLICOS NA INICIALIZAÇÃO
  useEffect(() => {
    const loadPublicMarkersOnInit = async () => {
      if (loadingInitial) return;
      setLoadingInitial(true);
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .or("group_tag.is.null,group_tag.eq.public")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setLoadingInitial(false);
        return;
      }

      const publicM: MarkerType[] = (data || []).map((loc: any) => ({
        id: loc.id,
        lng: loc.lng,
        lat: loc.lat,
        title: loc.title || "Local público",
        description: loc.description || "",
        mediaType: loc.media_type === "video" ? "video" : "photo",
        mediaUrl: loc.media_url || "",
        address: loc.address || "",
        createdAt: loc.created_at,
        synced: true,
        userId: loc.user_id,
        userEmail: loc.user_email,
        groupTag: loc.group_tag || "public",
        groupPasswordHash: loc.group_password_hash,
      }));
      setPublicMarkers(publicM);
      setLoadingInitial(false);
    };

    loadPublicMarkersOnInit();
  }, []);

  // RENDER LOCAIS LOCAIS + PÚBLICOS + GRUPOS REVELADOS
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const allMarkers = [
      ...markers,
      ...publicMarkers,
      ...groupMarkers.filter((g) => revealedGroupIds.has(g.id)),
    ];

    allMarkers.forEach((item) => {
      const el = document.createElement("div");
      const isSynced = item.synced === true;
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

      if (item.mediaUrl && item.mediaType === "photo") {
        el.style.backgroundImage = `url(${item.mediaUrl})`;
      } else {
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
          zoom: 16,
          duration: 1200,
        });
      });

      markersRef.current.push(marker);
    });
  }, [markers, publicMarkers, groupMarkers, revealedGroupIds, mapLoaded]);

  // RENDER PINS DE GRUPOS NÃO REVELADOS (CADEADO)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    groupMarkers.forEach((item) => {
      if (revealedGroupIds.has(item.id)) return;
      const el = document.createElement("div");
      el.style.width = "36px";
      el.style.height = "36px";
      el.style.borderRadius = "999px";
      el.style.border = "3px solid #8b5cf6";
      el.style.boxShadow = "0 0 12px rgba(139,92,246,0.8)";
      el.style.background = "#fff";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.fontSize = "20px";
      el.innerText = "🔒";
      el.style.cursor = "pointer";

      const marker = new mapboxgl.Marker(el)
        .setLngLat([item.lng, item.lat])
        .addTo(mapRef.current!);

      el.addEventListener("click", async () => {
        const groupTag = item.groupTag;
        let password =
          prompt(`Digite a senha para o grupo "${groupTag}":`) || "";
        if (!password) return;
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest(
          "SHA-256",
          encoder.encode(password)
        );
        const hashHex = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        if (hashHex !== item.groupPasswordHash) {
          alert("Senha incorreta.");
          return;
        }
        setRevealedGroupIds((prev) => new Set(prev).add(item.id));
        marker.remove();
      });
      markersRef.current.push(marker);
    });
  }, [groupMarkers, revealedGroupIds, mapLoaded]);

  // CARREGAR LOCAIS POR GRUPO (com suporte a senha)
  const loadMarkersByGroup = async (groupTag: string, password?: string) => {
    const supabase = getSupabaseClient();
    let query = supabase.from("locations").select("*");

    if (groupTag === "public" || groupTag === "") {
      query = query.or("group_tag.is.null,group_tag.eq.public");
    } else {
      query = query.eq("group_tag", groupTag);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error(error);
      alert("Erro ao carregar locais.");
      return { publicMarkers: [], groupMarkers: [] };
    }

    const publicM: MarkerType[] = [];
    const groupM: MarkerType[] = [];

    (data || []).forEach((loc: any) => {
      const marker: MarkerType = {
        id: loc.id,
        lng: loc.lng,
        lat: loc.lat,
        title: loc.title || "Local",
        description: loc.description || "",
        mediaType: loc.media_type === "video" ? "video" : "photo",
        mediaUrl: loc.media_url || "",
        address: loc.address || "",
        createdAt: loc.created_at,
        synced: true,
        userId: loc.user_id,
        userEmail: loc.user_email,
        groupTag: loc.group_tag,
        groupPasswordHash: loc.group_password_hash,
      };

      if (loc.group_tag === "public" || !loc.group_tag) {
        publicM.push(marker);
      } else {
        groupM.push(marker);
      }
    });

    if (
      groupTag !== "public" &&
      groupTag !== "" &&
      groupM.length > 0 &&
      groupM[0].groupPasswordHash
    ) {
      if (!password) {
        alert("Este grupo requer senha.");
        return { publicMarkers: [], groupMarkers: [] };
      }
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(password)
      );
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (hashHex !== groupM[0].groupPasswordHash) {
        alert("Senha incorreta.");
        return { publicMarkers: [], groupMarkers: [] };
      }
      return { publicMarkers: [], groupMarkers: groupM };
    }

    return { publicMarkers: publicM, groupMarkers: groupM };
  };

  const handleExplore = async () => {
    if (!searchGroup.trim()) {
      alert("Digite um nome de grupo (ex: 'public', 'equipe', 'expedicao1')");
      return;
    }
    setLoadingGroup(true);
    const result = await loadMarkersByGroup(searchGroup.trim(), searchPassword);
    // Substitui os públicos atuais pelos novos (se for "public", carrega os públicos; se for outro grupo, limpa públicos)
    setPublicMarkers(result.publicMarkers);
    setGroupMarkers(result.groupMarkers);
    setRevealedGroupIds(new Set());
    setShowExplorer(false);
    setLoadingGroup(false);
  };

  const clearExplorer = () => {
    setPublicMarkers([]);
    setGroupMarkers([]);
    setRevealedGroupIds(new Set());
    setSearchGroup("");
    setSearchPassword("");
  };

  // GEOLOCATION
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

  // ZOOM
  const zoomIn = () => mapRef.current?.zoomIn({ duration: 400 });
  const zoomOut = () => mapRef.current?.zoomOut({ duration: 400 });

  // SELECT LOCATION
  const startSelectingLocation = () => setSelectingLocation(true);
  const confirmLocation = () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    setPendingCoords({ lng: center.lng, lat: center.lat });
    setSelectingLocation(false);
    setShowAddModal(true);
  };

  // SAVE MARKER
  const handleSaveMarker = (marker: MarkerType) => {
    const updated = [...markers, marker];
    setMarkers(updated);
    localStorage.setItem("territorio-markers", JSON.stringify(updated));
    setShowAddModal(false);
    setPendingCoords(null);
  };

  // REMOVE MARKER
  const removeMarker = (id: string) => {
    const updated = markers.filter((item) => item.id !== id);
    setMarkers(updated);
    localStorage.setItem("territorio-markers", JSON.stringify(updated));
    setSelectedMarker(null);
  };

  // SYNC UPDATE
  const handleSynced = (id: string) => {
    const updated = markers.map((item) =>
      item.id === id ? { ...item, synced: true } : item
    );
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
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* SELECT LOCATION MODE */}
      {selectingLocation && (
        <>
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
              style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.45))" }}
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
            <div style={{ flex: 1 }}>
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
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
                Mova o mapa até o pin ficar no local
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
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
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          pointerEvents: "none",
        }}
      >
        {/* Esquerda: botões empilhados */}
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <BottomLocais
            total={markers.length}
            synced={syncedCount}
            unsynced={unsyncedCount}
            isMobile={isMobile}
            onOpen={() => setShowLocationsDialog(true)}
          />
          <button
            onClick={() => setShowExplorer(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 40,
              padding: isMobile ? "8px 12px" : "10px 16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              cursor: "pointer",
              color: "#fff",
              fontWeight: 700,
              fontSize: isMobile ? 12 : 14,
              transition: "all 0.2s",
            }}
          >
            <Globe size={16} />
            <span>Explorar locais</span>
          </button>
          {(publicMarkers.length > 0 || groupMarkers.length > 0) && (
            <button
              onClick={clearExplorer}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 40,
                padding: isMobile ? "8px 12px" : "10px 16px",
                cursor: "pointer",
                color: "#fff",
                fontWeight: 500,
                fontSize: isMobile ? 12 : 14,
              }}
            >
              <X size={14} />
              <span>Limpar</span>
            </button>
          )}
        </div>

        {/* Centro: botões de estilo */}
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 40,
            padding: "4px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          <button
            onClick={() => setMapStyle("satellite")}
            style={{
              border: 0,
              borderRadius: 32,
              padding: isMobile ? "8px 12px" : "10px 16px",
              background:
                mapStyle === "satellite" ? "#fff" : "rgba(255,255,255,0.06)",
              color: mapStyle === "satellite" ? "#000" : "#fff",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontSize: isMobile ? 12 : 14,
              fontWeight: 500,
            }}
          >
            <Satellite size={16} />
            {!isMobile && "Satélite"}
          </button>
          <button
            onClick={() => setMapStyle("dark")}
            style={{
              border: 0,
              borderRadius: 32,
              padding: isMobile ? "8px 12px" : "10px 16px",
              background:
                mapStyle === "dark" ? "#fff" : "rgba(255,255,255,0.06)",
              color: mapStyle === "dark" ? "#000" : "#fff",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontSize: isMobile ? 12 : 14,
              fontWeight: 500,
            }}
          >
            <Layers size={16} />
            {!isMobile && "Escuro"}
          </button>
          <button
            onClick={() => setMapStyle("outdoors")}
            style={{
              border: 0,
              borderRadius: 32,
              padding: isMobile ? "8px 12px" : "10px 16px",
              background:
                mapStyle === "outdoors" ? "#fff" : "rgba(255,255,255,0.06)",
              color: mapStyle === "outdoors" ? "#000" : "#fff",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontSize: isMobile ? 12 : 14,
              fontWeight: 500,
            }}
          >
            <Mountain size={16} />
            {!isMobile && "Relevo"}
          </button>
        </div>

        {/* Direita: localização e adicionar */}
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            onClick={goToMyLocation}
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              width: isMobile ? 40 : 44,
              height: isMobile ? 40 : 44,
              borderRadius: 40,
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
          <button
            onClick={startSelectingLocation}
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              width: isMobile ? 40 : 44,
              height: isMobile ? 40 : 44,
              borderRadius: 40,
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

      {/* MODAL DE EXPLORAÇÃO */}
      {showExplorer && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 200,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 32,
            padding: 24,
            width: "90%",
            maxWidth: 400,
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <h3 style={{ margin: 0, color: "#fff" }}>Explorar locais</h3>
            <button
              onClick={() => setShowExplorer(false)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <X size={24} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Nome do grupo (ex: 'public', 'equipe', 'expedicao1')"
            value={searchGroup}
            onChange={(e) => setSearchGroup(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 28,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              marginBottom: 12,
              fontSize: 14,
            }}
          />
          <input
            type="password"
            placeholder="Senha do grupo (se necessário)"
            value={searchPassword}
            onChange={(e) => setSearchPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 28,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              marginBottom: 20,
              fontSize: 14,
            }}
          />
          <button
            onClick={handleExplore}
            disabled={loadingGroup}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 40,
              background: "linear-gradient(135deg, #3a3a3a, #0a0a0a)",
              color: "#fff",
              fontWeight: "bold",
              border: "none",
              cursor: loadingGroup ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loadingGroup ? (
              "Carregando..."
            ) : (
              <>
                <Search size={18} /> Ir
              </>
            )}
          </button>
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Digite "public" para ver locais públicos.
          </div>
        </div>
      )}

      {/* CUSTOM ZOOM CONTROLS */}
      <div className="custom-zoom-controls">
        <button onClick={zoomIn} className="zoom-btn">
          <PlusIcon size={18} />
        </button>
        <div className="zoom-divider" />
        <button onClick={zoomOut} className="zoom-btn">
          <MinusIcon size={18} />
        </button>
      </div>

      {/* MODAIS */}
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
      {selectedMarker && (
        <MarkerCard
          marker={selectedMarker}
          onClose={() => setSelectedMarker(null)}
          onRemove={removeMarker}
        />
      )}
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
