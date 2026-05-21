// app/components/MarkerCard.tsx

"use client";

import {
  MapPin,
  Trash2,
  Image as ImageIcon,
  Video,
  CalendarDays,
  Navigation,
  X,
} from "lucide-react";

import { MarkerType } from "../types/marker";

type Props = {
  marker: MarkerType | null;
  onClose: () => void;
  onRemove: (id: string) => void;
};

export default function MarkerCard({ marker, onClose, onRemove }: Props) {
  if (!marker) return null;

  const createdAt = marker.createdAt
    ? new Date(marker.createdAt).toLocaleString("pt-BR")
    : "Agora";

  const hasMedia = !!marker.mediaUrl;

  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        top: 16, // agora no topo
        zIndex: 60,
        maxWidth: 420, // reduzido (antes 500)
        margin: "0 auto",
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(30px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20, // um pouco menor
        overflow: "hidden",
        boxShadow: "0 15px 30px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "row",
        transition: "transform 0.2s ease",
      }}
    >
      {/* LADO ESQUERDO: MÍDIA (mais compacta) */}
      {hasMedia && (
        <div
          style={{
            width: 100, // antes 140
            flexShrink: 0,
            position: "relative",
            background: "#000",
          }}
        >
          {marker.mediaType === "photo" ? (
            <img
              src={marker.mediaUrl}
              alt={marker.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <video
              src={marker.mediaUrl}
              controls
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}

          {/* Badge menor */}
          <div
            style={{
              position: "absolute",
              bottom: 6,
              left: 6,
              padding: "2px 6px",
              borderRadius: 12,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(8px)",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {marker.mediaType === "photo" ? (
              <>
                <ImageIcon size={8} /> Foto
              </>
            ) : (
              <>
                <Video size={8} /> Vídeo
              </>
            )}
          </div>
        </div>
      )}

      {/* LADO DIREITO: CONTEÚDO (compactado) */}
      <div
        style={{
          flex: 1,
          padding: hasMedia ? 12 : 14,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Header com título e botão fechar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.45)",
                marginBottom: 2,
              }}
            >
              Local marcado
            </div>
            <h2
              style={{
                margin: 0,
                color: "#fff",
                fontSize: 14, // antes 18
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              {marker.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 26,
              height: 26,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={12} />
          </button>
        </div>

        {/* Endereço (compactado) */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 6,
            padding: 8,
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 10,
              background: "rgba(16,185,129,0.18)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MapPin size={12} />
          </div>
          <div>
            <div
              style={{
                color: "#fff",
                fontWeight: 600,
                fontSize: 11,
                marginBottom: 2,
              }}
            >
              {marker.address || "Endereço não encontrado"}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: 9,
              }}
            >
              {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
            </div>
          </div>
        </div>

        {/* Descrição (apenas se existir) - compactada */}
        {marker.description && (
          <div>
            <div
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 8,
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Descrição
            </div>
            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,0.85)",
                fontSize: 11,
                lineHeight: 1.4,
              }}
            >
              {marker.description}
            </p>
          </div>
        )}

        {/* Rodapé com data e botão remover (compactado) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "rgba(255,255,255,0.55)",
              fontSize: 9,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <CalendarDays size={10} />
              {createdAt}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Navigation size={10} />
              GPS
            </div>
          </div>

          <button
            onClick={() => onRemove(marker.id)}
            style={{
              border: 0,
              padding: "4px 10px",
              borderRadius: 30,
              background: "rgba(239,68,68,0.15)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 10,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.background = "rgba(239,68,68,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.background = "rgba(239,68,68,0.15)";
            }}
          >
            <Trash2 size={10} />
            Remover
          </button>
        </div>
      </div>
    </div>
  );
}
