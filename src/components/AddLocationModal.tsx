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
  Lock,
  Clock,
  Plus,
  Users,
  Upload,
  Film,
  Image,
  Edit2,
  LogIn,
  Globe,
} from "lucide-react";
import type { MarkerType } from "../types/marker";
import {
  getCurrentUser,
  addRecentGroup,
  getRecentGroups,
} from "@/lib/profiles";
import { getSupabaseClient } from "@/lib/supabase";

// Lista de ícones disponíveis (10 opções)
const ICON_OPTIONS = [
  { name: "Montanha", icon: Mountain, value: "mountain" },
  { name: "Árvore", icon: TreePine, value: "tree" },
  { name: "Rio", icon: Waves, value: "water" },
  { name: "Fogo", icon: Flame, value: "fire" },
  { name: "Perigo", icon: AlertTriangle, value: "danger" },
  { name: "Local", icon: Home, value: "home" },
  { name: "Câmera", icon: Camera, value: "camera" },
  { name: "Vídeo", icon: Video, value: "video" },
  { name: "Usuários", icon: Users, value: "users" },
  {
    name: "Estrela",
    icon: (props: any) => <span {...props}>⭐</span>,
    value: "star",
  },
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
  const [isPrivateSelected, setIsPrivateSelected] = useState(false);
  const [recentGroups, setRecentGroups] = useState<string[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<string>("mountain");
  const [creatorName, setCreatorName] = useState("");
  const [creatorAvatar, setCreatorAvatar] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [showCreateGroupCard, setShowCreateGroupCard] = useState(false);
  const [showJoinGroupCard, setShowJoinGroupCard] = useState(false);
  const [joinGroupName, setJoinGroupName] = useState("");
  const [joinGroupPassword, setJoinGroupPassword] = useState("");
  const [joinGroupError, setJoinGroupError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Carregar perfil do usuário e grupos recentes
  useEffect(() => {
    const loadUserData = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
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
        const recents = await getRecentGroups(user.id);
        setRecentGroups(recents);
      }
    };
    loadUserData();
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

  // Reverse geocode
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

  // Buscar grupos existentes (exceto públicos e privados)
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
      .not("group_tag", "like", "private:%")
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

  // Sincroniza chips de visibilidade
  useEffect(() => {
    if (groupTag === "") {
      if (!isPublicSelected) setIsPublicSelected(true);
      if (isPrivateSelected) setIsPrivateSelected(false);
    } else {
      if (isPublicSelected) setIsPublicSelected(false);
      if (isPrivateSelected) setIsPrivateSelected(false);
    }
  }, [groupTag]);

  const handleGroupInputChange = (value: string) => {
    setGroupTag(value);
    setSearchTerm(value);
    setShowGroupSuggestions(true);
    setSelectedGroupInfo(null);
    setGroupPassword("");
    setConfirmGroupPassword("");
    setIsPublicSelected(false);
    setIsPrivateSelected(false);
    setShowCreateGroupCard(false);
    setShowJoinGroupCard(false);
  };

  const selectPublic = () => {
    setGroupTag("");
    setSearchTerm("");
    setShowGroupSuggestions(false);
    setSelectedGroupInfo(null);
    setGroupPassword("");
    setConfirmGroupPassword("");
    setIsPublicSelected(true);
    setIsPrivateSelected(false);
    setShowCreateGroupCard(false);
    setShowJoinGroupCard(false);
  };

  const selectPrivate = () => {
    setGroupTag("");
    setSearchTerm("");
    setShowGroupSuggestions(false);
    setSelectedGroupInfo(null);
    setGroupPassword("");
    setConfirmGroupPassword("");
    setIsPublicSelected(false);
    setIsPrivateSelected(true);
    setShowCreateGroupCard(false);
    setShowJoinGroupCard(false);
  };

  const selectRecentGroup = (tag: string) => {
    setGroupTag(tag);
    setSearchTerm(tag);
    setShowGroupSuggestions(false);
    setIsPublicSelected(false);
    setIsPrivateSelected(false);
    selectExistingGroup(tag);
    setShowCreateGroupCard(false);
    setShowJoinGroupCard(false);
  };

  const selectExistingGroup = async (tag: string) => {
    setGroupTag(tag);
    setSearchTerm(tag);
    setShowGroupSuggestions(false);
    setIsPublicSelected(false);
    setIsPrivateSelected(false);
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

  // Função para criar grupo (com validação de duplicidade)
  const handleCreateGroup = async () => {
    const groupName = groupTag.trim();
    if (!groupName) {
      alert("Digite o nome do grupo.");
      return;
    }
    if (groupName === "public" || groupName.startsWith("private:")) {
      alert("Nome de grupo inválido.");
      return;
    }
    // Verificar se o grupo já existe (buscar no Supabase)
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("locations")
      .select("group_tag")
      .eq("group_tag", groupName)
      .limit(1);
    if (!error && data && data.length > 0) {
      alert(
        "Já existe um grupo com este nome. Use 'Entrar no grupo' para participar."
      );
      return;
    }
    // Se escolheu senha, validar
    if (groupPassword && groupPassword !== confirmGroupPassword) {
      alert("As senhas não coincidem.");
      return;
    }
    if (groupPassword && groupPassword.length < 4) {
      alert("A senha deve ter pelo menos 4 caracteres.");
      return;
    }
    // Salvar o grupo (mas na verdade só definimos as variáveis; o grupo será criado ao salvar o local)
    setSelectedGroupInfo(null); // não é um grupo existente com senha
    setShowCreateGroupCard(false);
    alert(
      `Grupo "${groupName}" criado! Agora você pode adicionar locais a ele.`
    );
  };

  // Função para entrar em um grupo existente
  const handleJoinGroup = async () => {
    if (!joinGroupName.trim()) {
      setJoinGroupError("Digite o nome do grupo.");
      return;
    }
    const supabase = getSupabaseClient();
    // Buscar informações do grupo (senha)
    const { data, error } = await supabase
      .from("locations")
      .select("group_password_hash")
      .eq("group_tag", joinGroupName.trim())
      .not("group_password_hash", "is", null)
      .limit(1);
    if (error) {
      setJoinGroupError("Erro ao buscar grupo.");
      return;
    }
    const hasPassword = data && data.length > 0 && data[0].group_password_hash;
    if (hasPassword) {
      if (!joinGroupPassword) {
        setJoinGroupError("Este grupo requer senha.");
        return;
      }
      // Hash da senha informada
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(joinGroupPassword)
      );
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (hashHex !== data[0].group_password_hash) {
        setJoinGroupError("Senha incorreta.");
        return;
      }
    }
    // Se chegou aqui, pode entrar no grupo
    setGroupTag(joinGroupName.trim());
    setSearchTerm(joinGroupName.trim());
    setSelectedGroupInfo(
      hasPassword
        ? { hasPassword: true, groupTag: joinGroupName.trim() }
        : { hasPassword: false, groupTag: joinGroupName.trim() }
    );
    setIsPublicSelected(false);
    setIsPrivateSelected(false);
    setShowJoinGroupCard(false);
    setJoinGroupError("");
    setJoinGroupName("");
    setJoinGroupPassword("");
    alert(`Você entrou no grupo "${joinGroupName.trim()}"!`);
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
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const handleSave = async () => {
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
      if (isPublicSelected) finalGroupTag = "public";
      if (isPrivateSelected && currentUserId)
        finalGroupTag = `private:${currentUserId}`;
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
      } else if (
        finalGroupTag !== "public" &&
        !finalGroupTag.startsWith("private:") &&
        groupPassword
      ) {
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
          finalGroupTag !== "public" &&
          !finalGroupTag.startsWith("private:") &&
          groupPassword
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

  // Renderização do conteúdo do container de mídia
  const renderMediaContent = () => {
    if (mediaFile) {
      if (mediaType === "photo") {
        return (
          <img
            src={previewUrl}
            alt="preview"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        );
      } else {
        const thumb = videoThumbnail || previewUrl;
        return (
          <img
            src={thumb}
            alt="video thumb"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        );
      }
    } else {
      const IconComp =
        ICON_OPTIONS.find((i) => i.value === selectedIcon)?.icon || MapPin;
      return <IconComp size={48} color="#10b981" strokeWidth={1.5} />;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      {/* Modal principal */}
      <div
        style={{
          width: "100%",
          maxWidth: 500,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "rgba(10,10,15,0.95)",
          borderRadius: 32,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 600 }}>
            Novo local
          </h3>
          <button
            onClick={onClose}
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

        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Card modelo */}
          <div
            style={{
              background: "rgba(20,20,30,0.8)",
              borderRadius: 24,
              padding: 16,
              display: "flex",
              gap: 16,
              border: "1px solid rgba(255,255,255,0.05)",
              position: "relative",
            }}
          >
            {/* Container de mídia clicável com relative para posicionar o botão */}
            <div
              onClick={() => setShowMediaOptions(true)}
              style={{
                width: 100,
                height: 100,
                borderRadius: 20,
                background: "rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "transform 0.2s",
                position: "relative", // necessário para o botão absoluto dentro
              }}
            >
              {renderMediaContent()}
              {/* Botão de editar (lápis) sobre a imagem, canto inferior direito */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // evitar que o clique no botão dispare também o onClick do container
                  setShowMediaOptions(true);
                }}
                style={{
                  position: "absolute",
                  bottom: 4,
                  right: 4,
                  background: "rgba(0,0,0,0.6)",
                  border: "none",
                  borderRadius: 16,
                  padding: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                }}
              >
                <Edit2 size={12} color="#fff" />
              </button>
            </div>

            {/* Informações do card */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                  Localização
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>
                  {loadingLocation ? "Carregando..." : locationName}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                  Latitude / Longitude
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontFamily: "monospace",
                    color: "#aaa",
                  }}
                >
                  {lat.toFixed(6)} / {lng.toFixed(6)}
                </div>
              </div>
            </div>
          </div>

          {/* Campos de entrada */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 500,
                color: "#ddd",
              }}
            >
              Nome do local <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Cachoeira do Rio Negro"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 500,
                color: "#ddd",
              }}
            >
              Descrição <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o local..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Seção "Quem pode ver" - todos os botões padronizados */}
          <div>
            <div
              style={{
                marginBottom: 12,
                fontSize: 13,
                fontWeight: 500,
                color: "#ddd",
              }}
            >
              Quem pode ver
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <button
                onClick={selectPublic}
                style={{
                  padding: "6px 14px",
                  borderRadius: 30,
                  background: isPublicSelected ? "#10b981" : "transparent",
                  border: isPublicSelected
                    ? "1px solid #10b981"
                    : "1px solid rgba(255,255,255,0.3)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Globe size={14} /> Todos
              </button>
              <button
                onClick={selectPrivate}
                style={{
                  padding: "6px 14px",
                  borderRadius: 30,
                  background: isPrivateSelected ? "#8b5cf6" : "transparent",
                  border: isPrivateSelected
                    ? "1px solid #8b5cf6"
                    : "1px solid rgba(255,255,255,0.3)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Lock size={14} /> Apenas eu
              </button>
              <button
                onClick={() => {
                  setShowCreateGroupCard(!showCreateGroupCard);
                  setShowJoinGroupCard(false);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 30,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Plus size={14} /> Criar grupo
              </button>
              <button
                onClick={() => {
                  setShowJoinGroupCard(!showJoinGroupCard);
                  setShowCreateGroupCard(false);
                  setJoinGroupError("");
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 30,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <LogIn size={14} /> Entrar no grupo
              </button>
            </div>

            {/* Card azul para criar grupo */}
            {showCreateGroupCard && (
              <div
                style={{
                  marginTop: 12,
                  padding: 16,
                  borderRadius: 20,
                  border: "2px solid #3b82f6",
                  background: "rgba(59,130,246,0.05)",
                }}
              >
                <div
                  style={{
                    marginBottom: 12,
                    fontWeight: 600,
                    color: "#60a5fa",
                  }}
                >
                  Criar novo grupo
                </div>
                <input
                  type="text"
                  placeholder="Nome do grupo"
                  value={groupTag}
                  onChange={(e) => setGroupTag(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 8 }}
                />
                <input
                  type="password"
                  placeholder="Senha (opcional, mínimo 4 caracteres)"
                  value={groupPassword}
                  onChange={(e) => setGroupPassword(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 8 }}
                />
                {groupPassword.length >= 4 && (
                  <input
                    type="password"
                    placeholder="Confirmar senha"
                    value={confirmGroupPassword}
                    onChange={(e) => setConfirmGroupPassword(e.target.value)}
                    style={{ ...inputStyle, marginBottom: 12 }}
                  />
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setShowCreateGroupCard(false)}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 30,
                      background: "rgba(255,255,255,0.1)",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 30,
                      background: "#3b82f6",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Criar
                  </button>
                </div>
              </div>
            )}

            {/* Card verde para entrar em grupo */}
            {showJoinGroupCard && (
              <div
                style={{
                  marginTop: 12,
                  padding: 16,
                  borderRadius: 20,
                  border: "2px solid #10b981",
                  background: "rgba(16,185,129,0.05)",
                }}
              >
                <div
                  style={{
                    marginBottom: 12,
                    fontWeight: 600,
                    color: "#10b981",
                  }}
                >
                  Entrar em um grupo existente
                </div>
                <input
                  type="text"
                  placeholder="Nome do grupo"
                  value={joinGroupName}
                  onChange={(e) => setJoinGroupName(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 8 }}
                />
                <input
                  type="password"
                  placeholder="Senha (se necessário)"
                  value={joinGroupPassword}
                  onChange={(e) => setJoinGroupPassword(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 12 }}
                />
                {joinGroupError && (
                  <div
                    style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}
                  >
                    {joinGroupError}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setShowJoinGroupCard(false)}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 30,
                      background: "rgba(255,255,255,0.1)",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleJoinGroup}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 30,
                      background: "#10b981",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Entrar
                  </button>
                </div>
              </div>
            )}

            {recentGroups.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 16,
                }}
              >
                <Clock size={14} color="#aaa" />
                <span style={{ fontSize: 12, color: "#aaa" }}>Recentes:</span>
                {recentGroups.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => selectRecentGroup(tag)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#ddd",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botões de ação */}
        <div
          style={{
            padding: "16px 24px",
            display: "flex",
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 40,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "#fff",
              fontWeight: 600,
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
              padding: "12px",
              borderRadius: 40,
              border: "none",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff",
              fontWeight: 600,
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Salvando..." : "Salvar local"}
          </button>
        </div>
        {/* Espaço extra de 300px para evitar sobreposição com a navbar */}
        <div style={{ height: 300 }} />
      </div>

      {/* Modal de opções de mídia (agora com ícones) */}
      {showMediaOptions && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowMediaOptions(false)}
        >
          <div
            style={{
              background: "rgba(20,20,30,0.95)",
              borderRadius: 32,
              padding: 20,
              width: "90%",
              maxWidth: 320,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4
              style={{
                margin: "0 0 16px 0",
                fontSize: 18,
                textAlign: "center",
              }}
            >
              Adicionar mídia
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={() => {
                  setMediaType("photo");
                  setTimeout(() => fileInputRef.current?.click(), 100);
                  setShowMediaOptions(false);
                }}
                style={{
                  ...mediaOptionStyle,
                  background: "rgba(16,185,129,0.1)",
                }}
              >
                <Camera size={20} /> Tirar foto
              </button>
              <button
                onClick={() => {
                  setMediaType("photo");
                  setTimeout(() => fileInputRef.current?.click(), 100);
                  setShowMediaOptions(false);
                }}
                style={mediaOptionStyle}
              >
                <Image size={20} /> Escolher foto
              </button>
              <button
                onClick={() => {
                  setMediaType("video");
                  setTimeout(() => fileInputRef.current?.click(), 100);
                  setShowMediaOptions(false);
                }}
                style={{
                  ...mediaOptionStyle,
                  background: "rgba(139,92,246,0.1)",
                }}
              >
                <Video size={20} /> Gravar vídeo
              </button>
              <button
                onClick={() => {
                  setMediaType("video");
                  setTimeout(() => fileInputRef.current?.click(), 100);
                  setShowMediaOptions(false);
                }}
                style={mediaOptionStyle}
              >
                <Film size={20} /> Escolher vídeo
              </button>
              <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: 8 }} />
              <div style={{ fontSize: 13, color: "#aaa", marginBottom: 8 }}>
                Ou escolha um ícone:
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  justifyContent: "center",
                }}
              >
                {ICON_OPTIONS.map((opt) => {
                  const IconComp = opt.icon;
                  const isActive = selectedIcon === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSelectedIcon(opt.value);
                        setMediaFile(null);
                        setShowMediaOptions(false);
                      }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        background: isActive
                          ? "rgba(16,185,129,0.2)"
                          : "rgba(255,255,255,0.05)",
                        border: isActive
                          ? "1px solid #10b981"
                          : "1px solid rgba(255,255,255,0.1)",
                        color: isActive ? "#10b981" : "#aaa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      title={opt.name}
                    >
                      <IconComp size={22} />
                    </button>
                  );
                })}
              </div>
              <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: 8 }} />
              <button
                onClick={() => setShowMediaOptions(false)}
                style={{
                  ...mediaOptionStyle,
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                <X size={20} /> Cancelar
              </button>
              <div style={{ height: 400 }} />
            </div>
          </div>
        </div>
      )}

      {/* Input de arquivo oculto */}
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
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  outline: "none",
  fontSize: 14,
  transition: "all 0.2s",
};

const mediaOptionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 16px",
  borderRadius: 28,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 500,
  width: "100%",
  justifyContent: "center",
};
