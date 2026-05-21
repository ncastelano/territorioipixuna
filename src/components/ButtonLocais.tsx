"use client";

type Props = {
  total: number;
  synced: number;
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
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "#3b82f6",
            boxShadow: "0 0 4px #3b82f6",
          }}
        />
        <span>{synced}</span>
      </div>
      {unsynced > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "#ef4444",
              boxShadow: "0 0 4px #ef4444",
            }}
          />
          <span>{unsynced}</span>
        </div>
      )}
      <span>{total} locais</span>
    </button>
  );
}
