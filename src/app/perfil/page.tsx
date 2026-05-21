// app/perfil/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchProfile,
  getCurrentUser,
  saveProfile,
  signOut,
  uploadProfileImage,
  type ProfileFormInput,
} from "@/lib/profiles";
import type { UserProfile } from "@/lib/supabase";
import { getSupabaseClient } from "@/lib/supabase";
import { MarkerType } from "@/types/marker";
import MarkerCard from "@/components/MarkerCard";
import {
  Camera,
  LogOut,
  Save,
  Upload,
  UserRound,
  MapPin,
  Calendar,
  Navigation,
  Cloud,
} from "lucide-react";

const emptyProfile: ProfileFormInput = {
  full_name: "",
  role: "",
  bio: "",
  region: "AM",
  image_url: "",
};

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (
    words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "IP"
  );
}

export default function Perfil() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileFormInput>(emptyProfile);
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "guest" | "error">(
    "loading"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const displayName = form.full_name.trim() || userEmail || "Usuário Ipixuna";
  const avatarUrl = form.image_url.trim();

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Função para sincronizar um marcador com o Supabase
  const uploadToSupabase = async (marker: MarkerType) => {
    setSyncingId(marker.id);
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
        user_id: userId,
        user_email: userEmail,
      });

      if (error) {
        console.error(error);
        showToast("Erro ao sincronizar local.");
        return;
      }

      // Atualizar estado local e localStorage
      const updatedMarkers = markers.map((m) =>
        m.id === marker.id ? { ...m, synced: true } : m
      );
      setMarkers(updatedMarkers);
      localStorage.setItem(
        "territorio-markers",
        JSON.stringify(updatedMarkers)
      );
      showToast("Local sincronizado com a nuvem!");
    } catch (err) {
      console.error(err);
      showToast("Erro ao sincronizar.");
    } finally {
      setSyncingId(null);
    }
  };

  useEffect(() => {
    async function loadData() {
      const user = await getCurrentUser();
      if (!user) {
        setStatus("guest");
        return;
      }

      const currentProfile = await fetchProfile(user.id);
      const nextForm = {
        full_name:
          currentProfile?.full_name || user.user_metadata?.full_name || "",
        role: currentProfile?.role || "",
        bio: currentProfile?.bio || "",
        region: currentProfile?.region || "AM",
        image_url: currentProfile?.image_url || "",
      };

      setUserId(user.id);
      setUserEmail(user.email ?? null);
      setProfile(currentProfile);
      setForm(nextForm);

      const stored = localStorage.getItem("territorio-markers");
      let allMarkers: MarkerType[] = [];
      if (stored) {
        try {
          allMarkers = JSON.parse(stored);
        } catch (err) {
          console.error(err);
        }
      }

      const userMarkers = allMarkers.filter(
        (m) => m.userId === user.id || m.userEmail === user.email
      );
      setMarkers(userMarkers);
      setStatus("ready");
    }

    loadData().catch((error) => {
      console.error(error);
      setStatus("error");
    });
  }, []);

  const handleChange = (field: keyof ProfileFormInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId) {
      router.push("/login?redirect=/perfil");
      return;
    }
    setIsSaving(true);
    try {
      const saved = await saveProfile(userId, form, userEmail);
      setProfile(saved);
      setForm({
        full_name: saved.full_name,
        role: saved.role || "",
        bio: saved.bio || "",
        region: saved.region || "AM",
        image_url: saved.image_url || "",
      });
      showToast("Perfil salvo com sucesso.");
    } catch (error) {
      console.error(error);
      showToast("Não foi possível salvar o perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;
    setIsUploading(true);
    try {
      const imageUrl = await uploadProfileImage(userId, file);
      const nextForm = { ...form, image_url: imageUrl };
      setForm(nextForm);
      const saved = await saveProfile(userId, nextForm, userEmail);
      setProfile(saved);
      showToast("Imagem de perfil atualizada.");
    } catch (error) {
      console.error(error);
      showToast("Não foi possível enviar a imagem.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Data desconhecida";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (status === "loading") {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>Carregando perfil...</div>
      </div>
    );
  }

  if (status === "guest") {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={avatarContainerStyle}>
            <div style={initialsAvatarStyle}>
              <UserRound size={38} />
            </div>
          </div>
          <h1 style={nameStyle}>Entre para ver seu perfil</h1>
          <p style={subtitleStyle}>
            Visualize todos os locais que você já marcou no mapa.
          </p>
          <div style={authActionsStyle}>
            <Link
              href="/login"
              style={{
                ...buttonStyle,
                textDecoration: "none",
                display: "inline-flex",
                gap: 8,
                justifyContent: "center",
              }}
            >
              Entrar
            </Link>
            <Link
              href="/cadastrar"
              style={{
                ...secondaryButtonStyle,
                textDecoration: "none",
                display: "inline-flex",
                gap: 8,
                justifyContent: "center",
              }}
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>Não foi possível carregar o perfil.</div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Card de perfil */}
        <div style={cardStyle}>
          <div style={avatarContainerStyle}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} style={avatarImageStyle} />
            ) : (
              <div style={initialsAvatarStyle}>{getInitials(displayName)}</div>
            )}
            <label style={avatarEditBadgeStyle} title="Enviar foto">
              {isUploading ? <Upload size={15} /> : <Camera size={15} />}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                hidden
              />
            </label>
          </div>
          <h2 style={nameStyle}>{displayName}</h2>
          <p style={roleStyle}>{form.role || "Explorador de território"}</p>
          <p style={bioStyle}>
            {form.bio || "Compartilhe um pouco sobre sua atuação."}
          </p>
          <div style={statsContainerStyle}>
            <div style={statItemStyle}>
              <span style={statValueStyle}>{markers.length}</span>
              <span style={statLabelStyle}>Locais marcados</span>
            </div>
            <div
              style={{
                ...statItemStyle,
                borderLeft: "1px solid rgba(255,255,255,0.1)",
                borderRight: "1px solid rgba(255,255,255,0.1)",
                paddingLeft: 16,
                paddingRight: 16,
              }}
            >
              <span style={statValueStyle}>{form.region || "AM"}</span>
              <span style={statLabelStyle}>Região</span>
            </div>
            <div style={statItemStyle}>
              <span style={statValueStyle}>{profile ? "✓" : "Novo"}</span>
              <span style={statLabelStyle}>Perfil</span>
            </div>
          </div>
        </div>

        {/* Formulário de edição */}
        <form onSubmit={handleSave} style={cardStyle}>
          <h3 style={sectionTitleStyle}>Meus Dados</h3>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Nome</label>
            <input
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="Seu nome"
              disabled={isSaving}
              style={inputStyle}
            />
          </div>
          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Função</label>
              <input
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
                placeholder="Ex: Agente territorial"
                disabled={isSaving}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Região</label>
              <input
                value={form.region}
                onChange={(e) => handleChange("region", e.target.value)}
                placeholder="AM"
                disabled={isSaving}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Descrição</label>
            <textarea
              value={form.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Conte rapidamente sua atuação no território."
              disabled={isSaving}
              style={textareaStyle}
            />
          </div>
          <button type="submit" disabled={isSaving} style={buttonStyle}>
            <Save size={18} />
            <span>{isSaving ? "Salvando..." : "Salvar Perfil"}</span>
          </button>
        </form>

        {/* Seção de locais marcados */}
        <h3 style={{ ...sectionTitleStyle, marginTop: "2rem" }}>
          Meus Locais Marcados
        </h3>
        {markers.length === 0 ? (
          <div
            style={{
              ...cardStyle,
              textAlign: "center",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <MapPin size={32} strokeWidth={1} />
            <p>Você ainda não marcou nenhum local.</p>
            <Link
              href="/"
              style={{ ...secondaryButtonStyle, textDecoration: "none" }}
            >
              Ir para o mapa
            </Link>
          </div>
        ) : (
          <div style={gridStyle}>
            {markers.map((marker) => {
              const isSynced = marker.synced === true;
              const borderColor = isSynced ? "#3b82f6" : "#ef4444";

              return (
                <div
                  key={marker.id}
                  style={{
                    ...previewCardStyle,
                    borderBottom: `3px solid ${borderColor}`,
                    boxShadow: `0 4px 12px ${borderColor}20`,
                  }}
                >
                  <div style={mediaContainerStyle}>
                    {marker.mediaUrl && marker.mediaType === "photo" ? (
                      <img
                        src={marker.mediaUrl}
                        alt={marker.title}
                        style={mediaStyle}
                      />
                    ) : marker.mediaUrl && marker.mediaType === "video" ? (
                      <video src={marker.mediaUrl} style={mediaStyle} />
                    ) : (
                      <div style={placeholderStyle}>
                        <MapPin size={28} />
                      </div>
                    )}
                  </div>
                  <div style={infoContainerStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 4,
                      }}
                    >
                      <h4 style={titleStyle}>{marker.title}</h4>
                      {isSynced ? (
                        <Cloud size={18} color="#3b82f6" />
                      ) : (
                        <button
                          onClick={() => uploadToSupabase(marker)}
                          disabled={syncingId === marker.id}
                          style={{
                            background: "none",
                            border: "none",
                            cursor:
                              syncingId === marker.id ? "wait" : "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            color:
                              syncingId === marker.id ? "#aaa" : borderColor,
                          }}
                          title="Sincronizar com a nuvem"
                        >
                          {syncingId === marker.id ? (
                            <span style={{ fontSize: 11 }}>...</span>
                          ) : (
                            <Upload size={18} />
                          )}
                        </button>
                      )}
                    </div>
                    <p style={addressStyle}>
                      {marker.address || "Endereço não informado"}
                    </p>
                    <div style={metaStyle}>
                      <span>
                        <Calendar size={12} /> {formatDate(marker.createdAt)}
                      </span>
                      <span>
                        <Navigation size={12} /> {marker.lat.toFixed(4)},{" "}
                        {marker.lng.toFixed(4)}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedMarker(marker)}
                      style={detailButtonStyle}
                    >
                      Ver detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Logout */}
        <div
          style={{
            ...cardStyle,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: 40,
                padding: 8,
              }}
            >
              <UserRound size={18} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 500 }}>Conta conectada</p>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                {userEmail}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              ...secondaryButtonStyle,
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>

        {/* MarkerCard modal */}
        {selectedMarker && (
          <MarkerCard
            marker={selectedMarker}
            onClose={() => setSelectedMarker(null)}
            onRemove={() => {
              const updated = markers.filter((m) => m.id !== selectedMarker.id);
              setMarkers(updated);
              localStorage.setItem(
                "territorio-markers",
                JSON.stringify(updated)
              );
              setSelectedMarker(null);
              showToast("Local removido da lista.");
            }}
          />
        )}

        {/* Toast */}
        {toastMessage && (
          <div style={toastStyle}>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== ESTILOS ==========
const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "radial-gradient(circle at 10% 20%, #1a1a1a, #000000)",
  color: "#fff",
  padding: "2rem 1rem",
  boxSizing: "border-box",
};

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
  maxWidth: 800,
  width: "100%",
  margin: "0 auto",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(24px)",
  borderRadius: 40,
  padding: "1.5rem",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 30px 50px rgba(0,0,0,0.6)",
};

const avatarContainerStyle: React.CSSProperties = {
  position: "relative",
  width: 96,
  height: 96,
  margin: "0 auto 1rem auto",
};

const avatarImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  borderRadius: "50%",
  objectFit: "cover",
  border: "2px solid rgba(255,255,255,0.2)",
};

const initialsAvatarStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  borderRadius: "50%",
  background: "linear-gradient(145deg, #333333, #111111)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "2rem",
  fontWeight: "bold",
  color: "#fff",
  border: "2px solid rgba(255,255,255,0.2)",
};

const avatarEditBadgeStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 0,
  right: 0,
  background: "#2a2a2a",
  borderRadius: "50%",
  padding: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.2)",
  backdropFilter: "blur(4px)",
};

const nameStyle: React.CSSProperties = {
  fontSize: "1.8rem",
  fontWeight: 700,
  textAlign: "center",
  margin: "0.5rem 0 0.25rem",
  background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  color: "transparent",
};

const roleStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: "0.9rem",
  color: "rgba(255,255,255,0.7)",
  margin: 0,
};

const bioStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: "0.85rem",
  color: "rgba(255,255,255,0.6)",
  margin: "0.5rem 0 1rem",
};

const statsContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  paddingTop: "1rem",
  borderTop: "1px solid rgba(255,255,255,0.05)",
};

const statItemStyle: React.CSSProperties = {
  textAlign: "center",
  flex: 1,
};

const statValueStyle: React.CSSProperties = {
  display: "block",
  fontSize: "1.5rem",
  fontWeight: "bold",
  color: "#fff",
};

const statLabelStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  color: "rgba(255,255,255,0.5)",
  textTransform: "uppercase",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1.2rem",
  fontWeight: 600,
  marginBottom: "1rem",
  paddingBottom: "0.5rem",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: "1rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 500,
  color: "rgba(255,255,255,0.7)",
  marginBottom: "0.25rem",
  textTransform: "uppercase",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 28,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(20,20,25,0.6)",
  color: "#fff",
  outline: "none",
  fontSize: 14,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 28,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(20,20,25,0.6)",
  color: "#fff",
  outline: "none",
  fontSize: 14,
  resize: "vertical",
  fontFamily: "inherit",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: "1rem",
  marginBottom: "1rem",
};

const buttonStyle: React.CSSProperties = {
  marginTop: "0.5rem",
  padding: "12px 16px",
  borderRadius: 40,
  border: "none",
  background: "linear-gradient(135deg, #3a3a3a, #0a0a0a)",
  color: "#fff",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  cursor: "pointer",
  transition: "transform 0.1s ease",
  width: "100%",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: 40,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#ccc",
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
  transition: "background 0.2s",
};

const authActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "1rem",
  justifyContent: "center",
  marginTop: "1rem",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "1.5rem",
};

const previewCardStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(24px)",
  borderRadius: 32,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
  transition: "transform 0.2s",
};

const mediaContainerStyle: React.CSSProperties = {
  height: 160,
  background: "#111",
  overflow: "hidden",
};

const mediaStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const placeholderStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.05)",
  color: "#888",
};

const infoContainerStyle: React.CSSProperties = {
  padding: "1rem",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.1rem",
};

const addressStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "rgba(255,255,255,0.6)",
  margin: "0.25rem 0",
};

const metaStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  fontSize: "0.7rem",
  color: "rgba(255,255,255,0.5)",
  margin: "0.5rem 0",
  flexWrap: "wrap",
};

const detailButtonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: "0.5rem",
  padding: "0.5rem",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 24,
  color: "white",
  fontSize: "0.75rem",
  fontWeight: 500,
  cursor: "pointer",
};

const toastStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 80,
  left: "50%",
  transform: "translateX(-50%)",
  background: "rgba(0,0,0,0.8)",
  backdropFilter: "blur(12px)",
  padding: "10px 20px",
  borderRadius: 40,
  fontSize: "0.85rem",
  color: "#fff",
  zIndex: 1000,
  whiteSpace: "nowrap",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "rgba(255,255,255,0.6)",
  textAlign: "center",
};
