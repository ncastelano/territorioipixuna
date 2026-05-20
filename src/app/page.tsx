"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Map, Loader2, Sparkles, ChevronRight } from "lucide-react";

export default function Home() {
  const [focosCount, setFocosCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getFocos() {
      try {
        const res = await fetch("/api/focos-diarios");
        const data = await res.json();
        if (data.success) {
          setFocosCount(data.count);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    getFocos();
  }, []);

  return (
    <main
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        position: "relative",
        overflow: "hidden",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
      }}
    >
      {/* BACKGROUND AMBIENT GLOW */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          height: 400,
          borderRadius: "999px",
          background: "rgba(239, 85, 0, 0.12)",
          filter: "blur(120px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* CENTRAL CARD */}
      <div
        style={{
          width: "90%",
          maxWidth: 450,
          background: "rgba(0, 0, 0, 0.55)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 28,
          padding: "48px 36px",
          textAlign: "center",
          boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.75), 0 0 50px rgba(239, 68, 68, 0.08)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* BRAND BADGE */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 999,
            padding: "8px 16px",
            border: "1px solid rgba(239, 85, 0, 0.25)",
            background: "rgba(239, 85, 0, 0.08)",
            color: "#ff9955",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          <Sparkles size={13} color="#ff9955" />
          <span>Território Ipixuna</span>
        </div>

        {/* FIRE GLOW ICON */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
          }}
        >
          {/* Outer Pulsing Effect */}
          <div
            style={{
              position: "absolute",
              inset: -8,
              borderRadius: "999px",
              background: "rgba(239, 68, 68, 0.2)",
              filter: "blur(18px)",
              animation: "pulse 2s infinite ease-in-out",
            }}
          />
          <div
            style={{
              position: "relative",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "999px",
              padding: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Flame
              size={40}
              color="#ef4444"
              style={{ filter: "drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))" }}
            />
          </div>
        </div>

        {/* COUNTER */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          {loading ? (
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Loader2 className="animate-spin" size={36} color="#ef4444" />
            </div>
          ) : (
            <span
              style={{
                fontSize: 80,
                fontWeight: 900,
                letterSpacing: "-2px",
                lineHeight: 1,
                background: "linear-gradient(135deg, #ff8833 0%, #ef4444 50%, #dc2626 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 4px 15px rgba(239, 68, 68, 0.35))",
              }}
            >
              {focosCount ?? 0}
            </span>
          )}
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(255, 255, 255, 0.45)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginTop: 6,
            }}
          >
            Focos Ativos Detectados
          </span>
        </div>

        {/* DESCRIPTION TEXT */}
        <p
          style={{
            fontSize: 15,
            lineHeight: "1.6",
            color: "rgba(255, 255, 255, 0.75)",
            margin: 0,
            padding: "0 8px",
            fontWeight: 500,
          }}
        >
          Atualmente existem estes números de focos de queimadas detectados hoje no Brasil.
        </p>

        {/* ACTION BUTTON (MATCHES MAP PAGE HEADER CONTROLS) */}
        <Link
          href="/mapa"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            width: "100%",
            borderRadius: 18,
            padding: "16px 24px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            background: "rgba(255, 255, 255, 0.06)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <Map size={18} color="#ef4444" />
          <span>Visualizar no Mapa</span>
          <ChevronRight size={16} color="rgba(255, 255, 255, 0.4)" />
        </Link>
      </div>
    </main>
  );
}
