"use client";

type Props = {
  total: number;
  synced: number; // adicionado
  unsynced: number;
  onOpen: () => void;
  isMobile: boolean;
};

export default function ButtonLocais({
  total,
  synced,
  unsynced,
  onOpen,
  isMobile,
}: Props) {
  return (
    <button
      onClick={onOpen}
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 22,
        padding: isMobile ? "10px 14px" : "12px 16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        cursor: "pointer",
        color: "#fff",
        fontWeight: 700,
        fontSize: isMobile ? 13 : 15,
        position: "absolute",
        right: 16,
        top: 5,
        zIndex: 50,
      }}
    >
      {/* Indicador de sincronizados (azul) */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "#3b82f6", // azul
            boxShadow: "0 0 6px rgba(59,130,246,0.6)",
          }}
        />
        <span style={{ fontSize: 13 }}>{synced}</span>
      </div>

      {/* Indicador de pendentes (vermelho) */}
      {unsynced > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#ef4444",
              boxShadow: "0 0 6px rgba(239,68,68,0.6)",
            }}
          />
          <span style={{ fontSize: 13 }}>{unsynced}</span>
        </div>
      )}

      <span>{total} locais</span>
    </button>
  );
}
