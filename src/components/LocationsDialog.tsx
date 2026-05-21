// components/LocationsDialog.tsx
"use client";

import { Cloud, Cloudy, Smartphone, Upload, X } from "lucide-react";
import { MarkerType } from "@/types/marker";
import { getSupabaseClient } from "@/lib/supabase";

type Props = {
  markers: MarkerType[];
  onClose: () => void;
  onSynced: (id: string) => void;
};

export default function LocationsDialog({ markers, onClose, onSynced }: Props) {
  const uploadToSupabase = async (marker: MarkerType) => {
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
        visibility: marker.visibility || "public", // novo campo
      });

      if (error) {
        console.error(error);
        alert("Erro ao salvar no Supabase");
        return;
      }

      const updated = markers.map((item) =>
        item.id === marker.id ? { ...item, synced: true } : item
      );
      localStorage.setItem("territorio-markers", JSON.stringify(updated));
      onSynced(marker.id);
      alert("Local sincronizado com sucesso!");
    } catch (err) {
      console.error(err);
    }
  };

  const unsyncedCount = markers.filter((m) => !m.synced).length;
  const syncedCount = markers.length - unsyncedCount;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 999,
        backdropFilter: "blur(12px)",
        display: "flex",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 700,
          background: "#0b0b0b",
          borderRadius: 28,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: 22,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>
              Localizações
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.6)",
                marginTop: 4,
                fontSize: 13,
                display: "flex",
                gap: 10,
              }}
            >
              <span>● {syncedCount} salvos</span>
              <span style={{ color: "#ef4444" }}>
                ● {unsyncedCount} pendentes
              </span>
            </div>
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
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* LIST */}
        <div
          style={{
            overflowY: "auto",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {markers.map((item) => (
            <div
              key={item.id}
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 22,
                padding: 16,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ display: "flex", gap: 14 }}>
                {/* MEDIA */}
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 18,
                    overflow: "hidden",
                    background: "#111",
                    flexShrink: 0,
                  }}
                >
                  {item.mediaType === "photo" ? (
                    <img
                      src={item.mediaUrl}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <video
                      src={item.mediaUrl}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>

                {/* CONTENT */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}
                    >
                      {item.title}
                    </div>
                    {item.visibility && (
                      <div
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 20,
                          background: "rgba(0,0,0,0.3)",
                        }}
                      >
                        {item.visibility === "public" && "🌍 Público"}
                        {item.visibility === "private" && "🔒 Privado"}
                        {item.visibility === "team" && "👥 Equipe"}
                      </div>
                    )}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
                    {item.address}
                  </div>
                  <div
                    style={{ color: "rgba(255,255,255,0.75)", marginTop: 10 }}
                  >
                    {item.description}
                  </div>

                  {/* STATUS */}
                  <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: "#10b981",
                      }}
                    >
                      <Smartphone size={16} />
                      <span>Local</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: item.synced ? "#3b82f6" : "#ef4444",
                      }}
                    >
                      <Cloudy size={16} />
                      <span>
                        {item.synced ? "sincronizado" : "não sincronizado"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACTION */}
                {!item.synced && (
                  <button
                    onClick={() => uploadToSupabase(item)}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      border: 0,
                      background: "linear-gradient(to right, #3b82f6, #2563eb)",
                      color: "#fff",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <Upload size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <div style={{ height: 150 }} />
        </div>
      </div>
    </div>
  );
}
