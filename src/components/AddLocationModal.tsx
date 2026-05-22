// components/AddLocationModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Video,
  Image as ImageIcon,
  MapPin,
  Save,
  X,
  Mountain,
  TreePine,
  Waves,
  Flame,
  AlertTriangle,
  Home,
} from "lucide-react";
import type { MarkerType } from "../types/marker";
import { getCurrentUser } from "@/lib/profiles";
import { getSupabaseClient } from "@/lib/supabase";

// Lista de ícones disponíveis (Lucide)
const ICON_OPTIONS = [
  { name: "Montanha", icon: Mountain, value: "mountain" },
  { name: "Árvore", icon: TreePine, value: "tree" },
  { name: "Rio", icon: Waves, value: "water" },
  { name: "Fogo", icon: Flame, value: "fire" },
  { name: "Perigo", icon: AlertTriangle, value: "danger" },
  { name: "Local", icon: Home, value: "home" },
];

type Props = {
  lng: number;
  lat: number;
  onClose: () => void;
  onSave: (marker: MarkerType) => void;
};

export default function AddLocationModal({ lng, lat, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [videoThumbnail, setVideoThumbnail] = useState<string>("");
  const [locationName, setLocationName] = useState("Buscando localização...");
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupTag, setGroupTag] = useState("");
  const [groupPassword, setGroupPassword] = useState("");
  const [confirmGroupPassword, setConfirmGroupPassword] = useState("");
  const [existingGroups, setExistingGroups] = useState<string[]>([]);
  const [showGroupSuggestions, setShowGroupSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroupInfo, setSelectedGroupInfo] = useState<{
    hasPassword: boolean;
    groupTag: string;
  } | null>(null);
  const [isPublicSelected, setIsPublicSelected] = useState(true);
  const [selectedIcon, setSelectedIcon] = useState<string>("mountain");
  const [creatorName, setCreatorName] = useState("");
  const [creatorAvatar, setCreatorAvatar] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Carregar dados do perfil do usuário logado
  useEffect(() => {
    const loadUserProfile = async () => {
      const user = await getCurrentUser();
      if (user) {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, image_url")
          .eq("id", user.id)
          .single();
        if (!error && data) {
          setCreatorName(data.full_name || user.email || "Usuário");
          setCreatorAvatar(data.image_url || "");
        } else {
          setCreatorName(user.email || "Usuário");
        }
      }
    };
    loadUserProfile();
  }, []);

  // PREVIEW e thumbnail de vídeo
  useEffect(() => {
    if (!mediaFile) {
      setPreviewUrl("");
      setVideoThumbnail("");
      return;
    }
    const url = URL.createObjectURL(mediaFile);
    setPreviewUrl(url);
    if (mediaType === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = url;
      video.onloadedmetadata = () => {
        video.currentTime = 1;
      };
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas
          .getContext("2d")
          ?.drawImage(video, 0, 0, canvas.width, canvas.height);
        setVideoThumbnail(canvas.toDataURL("image/jpeg"));
        URL.revokeObjectURL(url);
      };
    }
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [mediaFile, mediaType]);

  // Reverse geocode (Mapbox)
  useEffect(() => {
    const fetchLocationName = async () => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) return;
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`
        );
        const data = await response.json();
        const place = data?.features?.[0]?.place_name || "Local desconhecido";
        setLocationName(place);
      } catch {
        setLocationName("Não foi possível localizar");
      } finally {
        setLoadingLocation(false);
      }
    };
    fetchLocationName();
  }, [lng, lat]);

  // Buscar grupos existentes
  const fetchExistingGroups = async (search: string) => {
    if (!search.trim()) {
      setExistingGroups([]);
      return;
    }
    setLoadingGroups(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("locations")
      .select("group_tag")
      .not("group_tag", "is", null)
      .neq("group_tag", "public")
      .ilike("group_tag", `%${search}%`)
      .limit(10);
    if (!error && data) {
      const tags = [
        ...new Set(data.map((item: any) => item.group_tag).filter(Boolean)),
      ];
      setExistingGroups(tags);
    } else {
      setExistingGroups([]);
    }
    setLoadingGroups(false);
  };

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== groupTag) fetchExistingGroups(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sincroniza chip público
  useEffect(() => {
    if (groupTag === "") {
      if (!isPublicSelected) setIsPublicSelected(true);
    } else {
      if (isPublicSelected) setIsPublicSelected(false);
    }
  }, [groupTag]);

  const handleGroupInputChange = (value: string) => {
    setGroupTag(value);
    setSearchTerm(value);
    setShowGroupSuggestions(true);
    setSelectedGroupInfo(null);
    setGroupPassword("");
    setConfirmGroupPassword("");
    if (value.trim() !== "") setIsPublicSelected(false);
    else setIsPublicSelected(true);
  };

  const selectPublic = () => {
    setGroupTag("");
    setSearchTerm("");
    setShowGroupSuggestions(false);
    setSelectedGroupInfo(null);
    setGroupPassword("");
    setConfirmGroupPassword("");
    setIsPublicSelected(true);
  };

  const selectExistingGroup = async (tag: string) => {
    setGroupTag(tag);
    setSearchTerm(tag);
    setShowGroupSuggestions(false);
    setIsPublicSelected(false);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("locations")
      .select("group_password_hash")
      .eq("group_tag", tag)
      .not("group_password_hash", "is", null)
      .limit(1);
    if (!error && data && data.length > 0 && data[0].group_password_hash) {
      setSelectedGroupInfo({ hasPassword: true, groupTag: tag });
    } else {
      setSelectedGroupInfo({ hasPassword: false, groupTag: tag });
    }
  };

  const acceptType = useMemo(
    () => (mediaType === "photo" ? "image/*" : "video/*"),
    [mediaType]
  );

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const hashPassword = async (password: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleSave = async () => {
    // Validações
    if (!title.trim()) {
      alert("Por favor, informe o nome do local.");
      return;
    }
    if (!description.trim()) {
      alert("Por favor, adicione uma descrição.");
      return;
    }
    try {
      setSaving(true);
      let mediaUrl = "";
      if (mediaFile) mediaUrl = await fileToBase64(mediaFile);
      const user = await getCurrentUser();

      let finalGroupTag = groupTag.trim();
      if (isPublicSelected || finalGroupTag === "") finalGroupTag = "public";
      if (finalGroupTag.length > 30) finalGroupTag = finalGroupTag.slice(0, 30);

      let passwordHash = "";
      if (selectedGroupInfo && selectedGroupInfo.hasPassword) {
        if (!groupPassword) {
          alert("Este grupo requer senha para adicionar locais.");
          return;
        }
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from("locations")
          .select("group_password_hash")
          .eq("group_tag", finalGroupTag)
          .not("group_password_hash", "is", null)
          .limit(1);
        if (!error && data && data.length > 0) {
          const storedHash = data[0].group_password_hash;
          const inputHash = await hashPassword(groupPassword);
          if (inputHash !== storedHash) {
            alert("Senha do grupo incorreta.");
            return;
          }
          passwordHash = storedHash;
        } else {
          alert("Erro ao verificar senha do grupo.");
          return;
        }
      } else if (finalGroupTag !== "public" && groupPassword) {
        if (groupPassword !== confirmGroupPassword) {
          alert("As senhas não coincidem.");
          return;
        }
        if (groupPassword.length < 4) {
          alert("A senha deve ter pelo menos 4 caracteres.");
          return;
        }
        passwordHash = await hashPassword(groupPassword);
      }

      const newMarker: MarkerType = {
        id: crypto.randomUUID(),
        lng,
        lat,
        title: title.trim(),
        description: description.trim(),
        mediaType,
        mediaUrl,
        address: locationName,
        createdAt: new Date().toISOString(),
        synced: false,
        userId: user?.id,
        userEmail: user?.email,
        groupTag: finalGroupTag,
        groupPasswordHash: passwordHash || undefined,
        groupPassword:
          finalGroupTag !== "public" && groupPassword
            ? groupPassword
            : undefined,
        iconType: !mediaFile ? selectedIcon : undefined,
        creatorName,
        creatorAvatar,
        videoThumbnail: videoThumbnail || undefined,
      };

      const existing = localStorage.getItem("territorio-markers");
      const parsed = existing ? JSON.parse(existing) : [];
      localStorage.setItem(
        "territorio-markers",
        JSON.stringify([...parsed, newMarker])
      );
      onSave(newMarker);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar mídia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "92vh",
          overflowY: "auto",
          background:
            "linear-gradient(to bottom, rgba(15,15,15,0.98), rgba(5,5,5,0.98))",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 34,
          padding: 24,
          boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
        }}
      >
        <div style={{ width: "100%", height: 90 }} />

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 6,
              }}
            >
              Novo local
            </div>
            <h2 style={{ margin: 0, color: "#fff", fontSize: 24 }}>
              Adicionar registro
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              border: 0,
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Card de Localização redesenhado */}
        <div
          style={{
            background: "rgba(20,20,25,0.7)",
            backdropFilter: "blur(12px)",
            borderRadius: 28,
            padding: 20,
            marginBottom: 18,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                background: "rgba(16,185,129,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin size={24} color="#10b981" />
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
                Localização
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                Coordenadas geográficas
              </div>
            </div>
          </div>
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              borderRadius: 20,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: 14,
                lineHeight: 1.4,
              }}
            >
              {loadingLocation ? "Buscando endereço..." : locationName}
            </div>
          </div>
          {/* Coordenadas sem ícone, uma abaixo da outra */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: 12,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            <span>Latitude: {lat.toFixed(6)}</span>
            <span>Longitude: {lng.toFixed(6)}</span>
          </div>
        </div>

        {/* Nome do local (obrigatório) */}
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              display: "block",
              marginBottom: 10,
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Nome do local <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Cachoeira do Rio Negro"
            style={inputStyle}
          />
        </div>

        {/* Descrição (obrigatória) */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              marginBottom: 10,
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Descrição <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o local com detalhes..."
            style={{
              ...inputStyle,
              minHeight: 100,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Tipo de mídia */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ marginBottom: 12, color: "#fff", fontWeight: 600 }}>
            O que deseja adicionar?
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <button
              onClick={() => {
                setMediaType("photo");
                setTimeout(() => fileInputRef.current?.click(), 100);
              }}
              style={{
                border:
                  mediaType === "photo"
                    ? "1px solid #10b981"
                    : "1px solid rgba(255,255,255,0.08)",
                background:
                  mediaType === "photo"
                    ? "rgba(16,185,129,0.14)"
                    : "rgba(255,255,255,0.04)",
                borderRadius: 22,
                padding: 18,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <Camera size={24} />
              <div style={{ marginTop: 12, fontWeight: 700 }}>Foto</div>
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.6 }}>
                Tirar ou selecionar imagem
              </div>
            </button>
            <button
              onClick={() => {
                setMediaType("video");
                setTimeout(() => fileInputRef.current?.click(), 100);
              }}
              style={{
                border:
                  mediaType === "video"
                    ? "1px solid #10b981"
                    : "1px solid rgba(255,255,255,0.08)",
                background:
                  mediaType === "video"
                    ? "rgba(16,185,129,0.14)"
                    : "rgba(255,255,255,0.04)",
                borderRadius: 22,
                padding: 18,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <Video size={24} />
              <div style={{ marginTop: 12, fontWeight: 700 }}>Vídeo</div>
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.6 }}>
                Gravar ou selecionar vídeo
              </div>
            </button>
          </div>
        </div>

        {/* Preview ou seleção de ícone */}
        <div style={{ marginBottom: 18 }}>
          {mediaFile ? (
            <div
              style={{
                borderRadius: 24,
                overflow: "hidden",
                background: "#111",
                position: "relative",
                aspectRatio: "16/9",
              }}
            >
              {mediaType === "photo" ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <video
                  src={previewUrl}
                  controls
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
              <button
                onClick={() => setMediaFile(null)}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "rgba(0,0,0,0.6)",
                  border: "none",
                  borderRadius: 20,
                  padding: 4,
                  cursor: "pointer",
                }}
              >
                <X size={16} color="#fff" />
              </button>
            </div>
          ) : (
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 24,
                padding: 16,
                border: "1px dashed rgba(255,255,255,0.12)",
              }}
            >
              <div
                style={{
                  marginBottom: 12,
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 13,
                }}
              >
                Nenhuma mídia selecionada. Escolha um ícone para representar o
                local no mapa:
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {ICON_OPTIONS.map((opt) => {
                  const IconComp = opt.icon;
                  const isSelected = selectedIcon === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedIcon(opt.value)}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        background: isSelected
                          ? "rgba(16,185,129,0.2)"
                          : "rgba(255,255,255,0.05)",
                        border: isSelected
                          ? "1px solid #10b981"
                          : "1px solid rgba(255,255,255,0.1)",
                        color: isSelected ? "#10b981" : "#aaa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      title={opt.name}
                    >
                      <IconComp size={24} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Seção Grupo (completa) */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 12, color: "#fff", fontWeight: 600 }}>
            Grupo (opcional)
          </div>
          <div style={{ marginBottom: 12 }}>
            <button
              type="button"
              onClick={selectPublic}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 30,
                border: isPublicSelected
                  ? "1px solid #10b981"
                  : "1px solid rgba(255,255,255,0.2)",
                background: isPublicSelected
                  ? "rgba(16,185,129,0.2)"
                  : "transparent",
                color: isPublicSelected ? "#10b981" : "#aaa",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <span>🌍</span> Público
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Digite o nome do grupo (ou busque existentes)"
              value={groupTag}
              onChange={(e) => handleGroupInputChange(e.target.value)}
              onFocus={() => setShowGroupSuggestions(true)}
              style={inputStyle}
            />
            {showGroupSuggestions &&
              (searchTerm.length > 0 || existingGroups.length > 0) && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    background: "rgba(20,20,25,0.95)",
                    backdropFilter: "blur(8px)",
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.1)",
                    maxHeight: 200,
                    overflowY: "auto",
                    zIndex: 10,
                    boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
                  }}
                >
                  {loadingGroups && (
                    <div
                      style={{
                        padding: 12,
                        color: "#aaa",
                        textAlign: "center",
                      }}
                    >
                      Buscando...
                    </div>
                  )}
                  {!loadingGroups &&
                    existingGroups.length === 0 &&
                    searchTerm.length > 0 && (
                      <div
                        style={{
                          padding: 12,
                          color: "#aaa",
                          textAlign: "center",
                        }}
                      >
                        Nenhum grupo encontrado.
                      </div>
                    )}
                  {existingGroups.map((tag) => (
                    <div
                      key={tag}
                      onClick={() => selectExistingGroup(tag)}
                      style={{
                        padding: "10px 16px",
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        color: "#fff",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.1)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}
          </div>
          <div style={{ marginTop: 12 }}>
            {!loadingGroups &&
              existingGroups.length === 0 &&
              searchTerm.length > 0 &&
              groupTag && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#ff9a55",
                    marginBottom: 8,
                    padding: "4px 0",
                  }}
                >
                  ✨ Nenhum grupo encontrado. Você pode criar um novo.
                </div>
              )}
            {!groupTag && isPublicSelected && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                🔓 Se você não escolher um grupo, o local será público.
              </div>
            )}
            {groupTag === "public" && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                🌍 Grupo público – qualquer pessoa pode ver.
              </div>
            )}
            {groupTag && groupTag !== "public" && !selectedGroupInfo && (
              <>
                <div
                  style={{
                    fontSize: 12,
                    color: "#ff9a55",
                    marginBottom: 8,
                    paddingTop: "1rem",
                  }}
                >
                  🆕 Novo grupo. Opcionalmente, defina uma senha para proteger o
                  acesso.
                </div>
                <div style={{ marginTop: 8 }}>
                  <input
                    type="password"
                    placeholder="Senha do grupo (opcional, mínimo 4 caracteres)"
                    value={groupPassword}
                    onChange={(e) => setGroupPassword(e.target.value)}
                    style={{ ...inputStyle, marginBottom: 8 }}
                  />
                  <input
                    type="password"
                    placeholder="Confirmar senha"
                    value={confirmGroupPassword}
                    onChange={(e) => setConfirmGroupPassword(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </>
            )}
            {selectedGroupInfo && selectedGroupInfo.hasPassword && (
              <>
                <div
                  style={{ fontSize: 12, color: "#ff9a55", marginBottom: 8 }}
                >
                  🔒 Este grupo exige senha para adicionar novos locais.
                </div>
                <input
                  type="password"
                  placeholder="Senha do grupo"
                  value={groupPassword}
                  onChange={(e) => setGroupPassword(e.target.value)}
                  style={inputStyle}
                />
              </>
            )}
            {selectedGroupInfo && !selectedGroupInfo.hasPassword && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                🔓 Grupo aberto (sem senha). Qualquer pessoa pode adicionar
                locais.
              </div>
            )}
          </div>
        </div>

        {/* Botões finais */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: 56,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              height: 56,
              borderRadius: 18,
              border: 0,
              background: "linear-gradient(to right, #10b981, #059669)",
              opacity: saving ? 0.7 : 1,
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Save size={18} />
            {saving ? "Salvando..." : "Salvar local"}
          </button>
        </div>
        <div style={{ width: "100%", height: 100 }} />

        {/* Input de arquivo oculto (obrigatório para funcionar) */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptType}
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setMediaFile(file);
          }}
        />
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 28,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(20,20,25,0.6)",
  color: "#fff",
  outline: "none",
  fontSize: 14,
};
