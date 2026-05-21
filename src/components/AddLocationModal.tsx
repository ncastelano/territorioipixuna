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
} from "lucide-react";
import type { MarkerType } from "../types/marker";
import { getCurrentUser } from "@/lib/profiles";
import { getSupabaseClient } from "@/lib/supabase";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // PREVIEW
  useEffect(() => {
    if (!mediaFile) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(mediaFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [mediaFile]);

  // REVERSE GEOCODE
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

  // Buscar grupos existentes (distinct)
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

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== groupTag) {
        fetchExistingGroups(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleGroupInputChange = (value: string) => {
    setGroupTag(value);
    setSearchTerm(value);
    setShowGroupSuggestions(true);
    setSelectedGroupInfo(null);
    // Limpar senha se mudar de grupo
    setGroupPassword("");
    setConfirmGroupPassword("");
  };

  const selectExistingGroup = async (tag: string) => {
    setGroupTag(tag);
    setSearchTerm(tag);
    setShowGroupSuggestions(false);
    // Verificar se o grupo tem senha
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
    try {
      setSaving(true);
      let mediaUrl = "";
      if (mediaFile) mediaUrl = await fileToBase64(mediaFile);
      const user = await getCurrentUser();

      let finalGroupTag = groupTag.trim();
      if (finalGroupTag === "") finalGroupTag = "public";
      if (finalGroupTag.length > 30) finalGroupTag = finalGroupTag.slice(0, 30);

      let passwordHash = "";
      // Se é um grupo existente com senha, validar a senha fornecida
      if (selectedGroupInfo && selectedGroupInfo.hasPassword) {
        if (!groupPassword) {
          alert("Este grupo requer senha para adicionar locais.");
          return;
        }
        // Verificar se a senha está correta (consultar hash do grupo)
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
          // Senha correta: não precisa salvar hash novamente (já existe)
          passwordHash = storedHash; // ou vazio, pois já existe no banco
        } else {
          alert("Erro ao verificar senha do grupo.");
          return;
        }
      } else if (finalGroupTag !== "public" && groupPassword) {
        // Novo grupo com senha
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
        title: title || "Local sem nome",
        description,
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

        {/* Localização */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 24,
            padding: 18,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <MapPin size={18} color="#10b981" />
            <div style={{ color: "#fff", fontWeight: 700 }}>Localização</div>
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 14,
              marginBottom: 10,
              lineHeight: 1.5,
            }}
          >
            {loadingLocation ? "Buscando endereço..." : locationName}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              color: "rgba(255,255,255,0.55)",
              fontSize: 13,
            }}
          >
            <span>Latitude: {lat.toFixed(6)}</span>
            <span>Longitude: {lng.toFixed(6)}</span>
          </div>
        </div>

        {/* Título */}
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              display: "block",
              marginBottom: 10,
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Nome do local
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: nome do local"
            style={{
              width: "100%",
              height: 56,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              padding: "0 18px",
              color: "#fff",
              outline: "none",
              fontSize: 15,
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
                    ? "1px solid #3b82f6"
                    : "1px solid rgba(255,255,255,0.08)",
                background:
                  mediaType === "video"
                    ? "rgba(59,130,246,0.14)"
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

        {/* Preview do arquivo */}
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              height: 180,
              borderRadius: 24,
              border: "2px dashed rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.03)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative",
              cursor: "pointer",
            }}
          >
            {!previewUrl && (
              <>
                <ImageIcon size={36} color="rgba(255,255,255,0.5)" />
                <div style={{ color: "#fff", marginTop: 12, fontWeight: 700 }}>
                  Nenhum arquivo selecionado
                </div>
              </>
            )}
            {previewUrl && mediaType === "photo" && (
              <img
                src={previewUrl}
                alt="preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
            {previewUrl && mediaType === "video" && (
              <video
                src={previewUrl}
                controls
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptType}
              capture="environment"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setMediaFile(file);
              }}
            />
          </label>
        </div>

        {/* Descrição */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              marginBottom: 10,
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o local..."
            style={{
              width: "100%",
              minHeight: 120,
              resize: "none",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              padding: 18,
              color: "#fff",
              outline: "none",
              fontSize: 15,
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Grupo personalizado com busca */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 12, color: "#fff", fontWeight: 600 }}>
            Grupo (opcional)
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
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "rgba(20,20,25,0.95)",
                    backdropFilter: "blur(8px)",
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.1)",
                    maxHeight: 200,
                    overflowY: "auto",
                    zIndex: 10,
                    marginTop: 4,
                  }}
                >
                  {loadingGroups && (
                    <div style={{ padding: 8, color: "#aaa" }}>Buscando...</div>
                  )}
                  {!loadingGroups &&
                    existingGroups.length === 0 &&
                    searchTerm.length > 0 && (
                      <div style={{ padding: 8, color: "#aaa" }}>
                        Nenhum grupo encontrado. Você pode criar um novo.
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

          {/* Se for um grupo existente com senha, pedir a senha */}
          {selectedGroupInfo && selectedGroupInfo.hasPassword && (
            <div style={{ marginTop: 12 }}>
              <input
                type="password"
                placeholder="Senha do grupo (necessária para adicionar ao grupo)"
                value={groupPassword}
                onChange={(e) => setGroupPassword(e.target.value)}
                style={{ ...inputStyle, marginBottom: 8 }}
              />
            </div>
          )}

          {/* Se for um novo grupo (não encontrado) e não for público, opção de criar com senha */}
          {groupTag && groupTag !== "public" && !selectedGroupInfo && (
            <div style={{ marginTop: 12 }}>
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
          )}

          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              marginTop: 6,
            }}
          >
            {!groupTag &&
              "Se você não escolher um grupo, o local será público."}
            {groupTag === "public" && "Grupo público (qualquer pessoa vê)."}
            {groupTag &&
              groupTag !== "public" &&
              !selectedGroupInfo &&
              "Novo grupo. Se definir senha, será necessário para adicionar mais locais."}
            {selectedGroupInfo &&
              selectedGroupInfo.hasPassword &&
              "Grupo protegido por senha."}
            {selectedGroupInfo &&
              !selectedGroupInfo.hasPassword &&
              "Grupo aberto (sem senha)."}
          </div>
        </div>

        {/* Botões */}
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
