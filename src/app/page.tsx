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
  Cloudy,
} from "lucide-react";
import { MarkerType } from "@/types/marker";
import AddLocationModal from "@/components/AddLocationModal";
import MarkerCard from "@/components/MarkerCard";
import LocationsDialog from "@/components/LocationsDialog";
import BottomLocais from "@/components/ButtonLocais";
import { getSupabaseClient } from "@/lib/supabase";

const iconSVG: Record<string, string> = {
  mountain: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 10H6z"/><path d="M4 14h16"/><path d="M12 14v7"/></svg>`,
  tree: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 6h3l-3 4 1 6h-8l1-6-3-4h3z"/><path d="M12 16v4"/></svg>`,
  water: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6"/><path d="M4 12h16"/><path d="M12 22v-6"/><path d="M2 10h20"/><path d="M4 14h16"/><path d="M8 18h8"/></svg>`,
  fire: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  danger: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  home: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-6 9 6v9a2 2 0 0 1-2 2h-5v-7h-4v7H5a2 2 0 0 1-2-2z"/></svg>`,
};

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
  const [showPublicMarkers, setShowPublicMarkers] = useState(true);
  const [showExplorer, setShowExplorer] = useState(false);
  const [searchGroup, setSearchGroup] = useState("");
  const [searchPassword, setSearchPassword] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [currentGroupName, setCurrentGroupName] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLocationsDialog, setShowLocationsDialog] = useState(false);
  const [selectingLocation, setSelectingLocation] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{
    lng: number;
    lat: number;
  } | null>(null);
  const [localSearchResults, setLocalSearchResults] = useState<
    MarkerType[] | null
  >(null);

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

  // ======================== CONVERSÃO ========================
  const convertToMarkerType = (loc: any): MarkerType => ({
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
    creatorName: loc.creator_name,
    creatorAvatar: loc.creator_avatar,
    iconType: loc.icon_type,
    videoThumbnail: loc.video_thumbnail,
  });

  // ======================== CARREGAR PÚBLICOS + REALTIME ========================
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
    const publicM = (data || []).map(convertToMarkerType);
    setPublicMarkers(publicM);
    setLoadingInitial(false);
  };

  useEffect(() => {
    loadPublicMarkersOnInit();

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel("locations-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "locations" },
        (payload) => {
          const newMarker = convertToMarkerType(payload.new);
          if (!payload.new.group_tag || payload.new.group_tag === "public") {
            setPublicMarkers((prev) => [newMarker, ...prev]);
          } else {
            setGroupMarkers((prev) => [newMarker, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "locations" },
        (payload) => {
          const updatedMarker = convertToMarkerType(payload.new);
          setPublicMarkers((prev) =>
            prev.map((m) => (m.id === updatedMarker.id ? updatedMarker : m))
          );
          setGroupMarkers((prev) =>
            prev.map((m) => (m.id === updatedMarker.id ? updatedMarker : m))
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ======================== SINCRONIZAR COM SUPABASE ========================
  const syncMarkerToSupabase = async (marker: MarkerType): Promise<boolean> => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("locations").insert({
        title: marker.title,
        description: marker.description,
        address: marker.address,
        lng: marker.lng,
        lat: marker.lat,
        media_url: marker.mediaUrl,
        media_type: marker.mediaType,
        group_tag: marker.groupTag === "public" ? null : marker.groupTag,
        group_password_hash: marker.groupPasswordHash || null,
        user_id: marker.userId,
        user_email: marker.userEmail,
        icon_type: marker.iconType || null,
        creator_name: marker.creatorName || null,
        creator_avatar: marker.creatorAvatar || null,
        video_thumbnail: marker.videoThumbnail || null,
      });
      if (error) {
        console.error("Erro ao sincronizar:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // ======================== SAVE MARKER (com remoção do local após sincronizar) ========================
  const handleSaveMarker = async (marker: MarkerType) => {
    // Adiciona localmente (não sincronizado)
    const updated = [...markers, marker];
    setMarkers(updated);
    localStorage.setItem("territorio-markers", JSON.stringify(updated));
    setShowAddModal(false);
    setPendingCoords(null);

    // Tenta sincronizar
    const success = await syncMarkerToSupabase(marker);
    if (success) {
      // Remove o marcador local (pois será mostrado via Supabase)
      const withoutLocal = updated.filter((m) => m.id !== marker.id);
      setMarkers(withoutLocal);
      localStorage.setItem("territorio-markers", JSON.stringify(withoutLocal));

      // Adiciona manualmente ao array apropriado para exibição imediata
      const syncedMarker = { ...marker, synced: true };
      if (!marker.groupTag || marker.groupTag === "public") {
        setPublicMarkers((prev) => [syncedMarker, ...prev]);
      } else {
        setGroupMarkers((prev) => [syncedMarker, ...prev]);
      }
      alert("Local salvo e sincronizado com a nuvem!");
    } else {
      alert(
        "Local salvo localmente, mas a sincronização falhou. Tente novamente mais tarde."
      );
    }
  };

  // ======================== RENDER MARCADORES (apenas locais não sincronizados + públicos + grupos) ========================
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    let allMarkers: MarkerType[];
    if (localSearchResults !== null) {
      allMarkers = localSearchResults;
    } else {
      allMarkers = [
        ...markers, // apenas locais não sincronizados (synced == false)
        ...(showPublicMarkers ? publicMarkers : []),
        ...groupMarkers.filter((g) => !g.groupPasswordHash),
        ...groupMarkers.filter(
          (g) => g.groupPasswordHash && revealedGroupIds.has(g.id)
        ),
      ];
    }

    allMarkers.forEach((item) => {
      const el = document.createElement("div");
      const isSynced = item.synced === true;
      const borderColor = isSynced ? "#10b981" : "#ef4444";

      el.style.width = "36px";
      el.style.height = "36px";
      el.style.borderRadius = "999px";
      el.style.border = `3px solid ${borderColor}`;
      el.style.cursor = "pointer";
      el.style.background = "#fff";
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.style.backgroundRepeat = "no-repeat";

      if (item.mediaUrl && item.mediaType === "photo") {
        el.style.backgroundImage = `url(${item.mediaUrl})`;
      } else if (item.iconType && iconSVG[item.iconType]) {
        el.style.background = borderColor;
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.innerHTML = iconSVG[item.iconType];
        const svg = el.querySelector("svg");
        if (svg) {
          svg.style.width = "24px";
          svg.style.height = "24px";
        }
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
  }, [
    markers,
    publicMarkers,
    groupMarkers,
    revealedGroupIds,
    showPublicMarkers,
    mapLoaded,
    localSearchResults,
  ]);

  // ======================== PINS CADEADO ========================
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    groupMarkers.forEach((item) => {
      if (!item.groupPasswordHash) return;
      if (revealedGroupIds.has(item.id)) return;

      const el = document.createElement("div");
      el.style.width = "36px";
      el.style.height = "36px";
      el.style.borderRadius = "999px";
      el.style.border = "3px solid #8b5cf6";
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

  // ======================== BUSCAR POR GRUPO ========================
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
      return { groupMarkers: [] };
    }
    const groupM = (data || []).map(convertToMarkerType);
    if (groupTag !== "public" && groupTag !== "") {
      const hasAnyHash = groupM.some((m) => m.groupPasswordHash);
      if (hasAnyHash) {
        if (!password) {
          alert("Este grupo requer senha.");
          return { groupMarkers: [] };
        }
        const firstHash = groupM.find(
          (m) => m.groupPasswordHash
        )?.groupPasswordHash;
        if (firstHash) {
          const encoder = new TextEncoder();
          const hashBuffer = await crypto.subtle.digest(
            "SHA-256",
            encoder.encode(password)
          );
          const hashHex = Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          if (hashHex !== firstHash) {
            alert("Senha incorreta.");
            return { groupMarkers: [] };
          }
        }
      }
    }
    return { groupMarkers: groupM };
  };

  // ======================== BUSCA LOCAL POR NOME ========================
  const performLocalTitleSearch = (titleTerm: string) => {
    if (!titleTerm.trim()) {
      setLocalSearchResults(null);
      setCurrentGroupName(null);
      return;
    }
    const currentMarkers = [
      ...markers,
      ...(showPublicMarkers ? publicMarkers : []),
      ...groupMarkers.filter((g) => !g.groupPasswordHash),
      ...groupMarkers.filter(
        (g) => g.groupPasswordHash && revealedGroupIds.has(g.id)
      ),
    ];
    const termLower = titleTerm.trim().toLowerCase();
    const filtered = currentMarkers.filter((marker) =>
      marker.title.toLowerCase().includes(termLower)
    );
    if (filtered.length === 0) {
      alert("Nenhum local encontrado com esse nome.");
      return;
    }
    setLocalSearchResults(filtered);
    setCurrentGroupName(`nome: ${titleTerm.trim()}`);
  };

  const handleGroupSearch = async () => {
    if (!searchGroup.trim()) {
      alert("Digite um nome de grupo (ex: 'equipe', 'expedicao1')");
      return;
    }
    setLoadingGroup(true);
    const result = await loadMarkersByGroup(searchGroup.trim(), searchPassword);
    setLocalSearchResults(null);
    setGroupMarkers(result.groupMarkers);
    setPublicMarkers([]);
    setShowPublicMarkers(false);
    setRevealedGroupIds(new Set());
    if (result.groupMarkers.length > 0) {
      setCurrentGroupName(`grupo: ${searchGroup.trim()}`);
    } else {
      setCurrentGroupName(null);
    }
    setShowExplorer(false);
    setLoadingGroup(false);
  };

  const handleTitleSearch = () => {
    if (!searchTitle.trim()) {
      alert("Digite um título para pesquisar.");
      return;
    }
    setLoadingGroup(true);
    performLocalTitleSearch(searchTitle);
    setShowExplorer(false);
    setLoadingGroup(false);
  };

  const clearGroups = async () => {
    setGroupMarkers([]);
    setRevealedGroupIds(new Set());
    setLocalSearchResults(null);
    setCurrentGroupName(null);
    setSearchGroup("");
    setSearchPassword("");
    setSearchTitle("");
    await loadPublicMarkersOnInit();
    setShowPublicMarkers(true);
  };

  const togglePublicMarkers = () => {
    setShowPublicMarkers((prev) => !prev);
    if (localSearchResults !== null) {
      setLocalSearchResults(null);
      setCurrentGroupName(null);
      setSearchTitle("");
    }
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

  const removeMarker = (id: string) => {
    const updated = markers.filter((item) => item.id !== id);
    setMarkers(updated);
    localStorage.setItem("territorio-markers", JSON.stringify(updated));
    setSelectedMarker(null);
  };

  const handleSynced = (id: string) => {
    // Usado apenas pelo LocationsDialog (sincronização manual)
    const updated = markers.map((item) =>
      item.id === id ? { ...item, synced: true } : item
    );
    setMarkers(updated);
    localStorage.setItem("territorio-markers", JSON.stringify(updated));
  };

  const syncedCount = markers.filter((m) => m.synced).length;
  const unsyncedCount = markers.filter((m) => !m.synced).length;

  // ======================== JSX (mantido idêntico ao original) ========================
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
              background: currentGroupName
                ? "rgba(16,185,129,0.15)"
                : "rgba(0,0,0,0.45)",
              backdropFilter: "blur(20px)",
              border: currentGroupName
                ? "1px solid #10b981"
                : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 40,
              padding: isMobile ? "8px 12px" : "10px 16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              cursor: "pointer",
              color: currentGroupName ? "#10b981" : "#fff",
              fontWeight: 700,
              fontSize: isMobile ? 12 : 14,
              transition: "all 0.2s",
            }}
          >
            <Search size={16} />
            <span>
              {currentGroupName ? `Grupo: ${currentGroupName}` : "Procurar"}
            </span>
          </button>
          <button
            onClick={togglePublicMarkers}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: showPublicMarkers
                ? "rgba(16,185,129,0.2)"
                : "rgba(0,0,0,0.45)",
              backdropFilter: "blur(20px)",
              border: showPublicMarkers
                ? "1px solid #10b981"
                : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 40,
              padding: isMobile ? "8px 12px" : "10px 16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              cursor: "pointer",
              color: showPublicMarkers ? "#10b981" : "#fff",
              fontWeight: 700,
              fontSize: isMobile ? 12 : 14,
              transition: "all 0.2s",
            }}
          >
            <Cloudy size={16} />
            <span>Público</span>
          </button>
          {(groupMarkers.length > 0 ||
            (publicMarkers.length === 0 && !showPublicMarkers) ||
            localSearchResults !== null) && (
            <button
              onClick={clearGroups}
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
            <h3 style={{ margin: 0, color: "#fff" }}>Pesquisar locais</h3>
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

          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#ccc",
                marginBottom: 8,
              }}
            >
              🔍 Buscar por nome
            </div>
            <input
              type="text"
              placeholder="Digite parte do nome (ex: 'rio', 'área')"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
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
            <button
              onClick={handleTitleSearch}
              disabled={loadingGroup}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 40,
                background: "rgba(16,185,129,0.2)",
                border: "1px solid #10b981",
                color: "#10b981",
                fontWeight: "bold",
                cursor: loadingGroup ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loadingGroup ? "Carregando..." : "Buscar por nome"}
            </button>
          </div>

          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.1)",
              margin: "16px 0",
            }}
          />

          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#ccc",
                marginBottom: 8,
              }}
            >
              👥 Buscar por grupo
            </div>
            <input
              type="text"
              placeholder="Nome do grupo (ex: 'equipe', 'expedicao1')"
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
              onClick={handleGroupSearch}
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
              {loadingGroup ? "Carregando..." : "Buscar por grupo"}
            </button>
          </div>

          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              marginTop: 20,
              textAlign: "center",
            }}
          >
            Grupos públicos já aparecem automaticamente.
          </div>
        </div>
      )}

      <div className="custom-zoom-controls">
        <button onClick={zoomIn} className="zoom-btn">
          <PlusIcon size={18} />
        </button>
        <div className="zoom-divider" />
        <button onClick={zoomOut} className="zoom-btn">
          <MinusIcon size={18} />
        </button>
      </div>

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
