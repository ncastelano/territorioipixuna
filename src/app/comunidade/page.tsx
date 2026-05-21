"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Map,
  Loader2,
  Sparkles,
  ChevronRight,
  Globe,
} from "lucide-react";

export default function ComunidadePage() {
  const [focosCount, setFocosCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getFocos() {
      try {
        const res = await fetch("/api/focos-10min");
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
    <main style={styles.page}>
      {/* GLOW */}
      <div style={styles.glow} />

      <div style={styles.card}>
        {/* BADGE */}
        <div style={styles.badge}>
          <Sparkles size={13} />
          Território Ipixuna
        </div>

        {/* TITLE CONTEXTUAL */}
        <h1 style={styles.title}>Monitoramento de Focos de Queimadas</h1>

        {/* CONTEXT BLOCK (NOVA PARTE IMPORTANTE) */}
        <div style={styles.contextBox}>
          <p style={styles.contextText}>
            Os dados exibidos nesta plataforma são baseados no sistema oficial
            de detecção de focos de calor do INPE (Instituto Nacional de
            Pesquisas Espaciais), disponibilizados publicamente pelo portal{" "}
            <a
              href="https://terrabrasilis.dpi.inpe.br/queimadas/portal/pages/secao_downloads/dados-abertos/#da-focos"
              target="_blank"
              style={styles.link}
            >
              TerraBrasilis
            </a>
            .
          </p>

          <p style={styles.contextText}>
            Esses registros são gerados por satélites e representam eventos
            térmicos compatíveis com queimadas e incêndios florestais,
            permitindo o acompanhamento quase em tempo real da dinâmica
            ambiental na Amazônia e demais biomas brasileiros.
          </p>

          <p style={styles.contextTextMuted}>
            O uso desses dados não se limita à contagem de focos, mas serve como
            base para análise de desmatamento, risco ambiental, ação climática e
            proteção de territórios indígenas.
          </p>
        </div>

        {/* INDICADOR (menos central, mais contextual) */}
        <div style={styles.counterBox}>
          <Flame size={26} color="#ef4444" />

          {loading ? (
            <Loader2 className="animate-spin" size={26} color="#ef4444" />
          ) : (
            <span style={styles.counter}>{focosCount ?? 0}</span>
          )}

          <span style={styles.counterLabel}>focos detectados hoje</span>
        </div>

        {/* CTA */}
        <Link href="/mapa-incendios" style={styles.button}>
          <Map size={18} color="#ef4444" />
          Ver mapa de incendios
          <ChevronRight size={16} />
        </Link>

        {/* SOURCE FOOTER */}
        <div style={styles.source}>
          <Globe size={14} />
          Fonte: INPE / TerraBrasilis — Dados abertos de detecção por satélite
        </div>
      </div>
    </main>
  );
}

/* ================= STYLES ================= */

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: "100%",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#000",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
    padding: 20,
  },

  glow: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: 999,
    background: "rgba(239,68,68,0.12)",
    filter: "blur(140px)",
  },

  card: {
    width: "100%",
    maxWidth: 520,
    background: "rgba(0,0,0,0.55)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 28,
    padding: 28,
    backdropFilter: "blur(20px)",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  badge: {
    display: "inline-flex",
    gap: 8,
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid rgba(239,68,68,0.25)",
    background: "rgba(239,68,68,0.08)",
    color: "#ff9a55",
    fontSize: 11,
    fontWeight: 700,
  },

  title: {
    fontSize: 20,
    fontWeight: 800,
    margin: 0,
  },

  contextBox: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  contextText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.8)",
    margin: 0,
  },

  contextTextMuted: {
    fontSize: 12,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.55)",
    margin: 0,
  },

  link: {
    color: "#ff9a55",
    textDecoration: "underline",
  },

  counterBox: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    background: "rgba(239,68,68,0.06)",
    border: "1px solid rgba(239,68,68,0.15)",
  },

  counter: {
    fontSize: 34,
    fontWeight: 900,
    color: "#ef4444",
  },

  counterLabel: {
    fontSize: 12,
    opacity: 0.7,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  button: {
    display: "flex",
    justifyContent: "center",
    gap: 10,
    alignItems: "center",
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
  },

  source: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontSize: 11,
    opacity: 0.6,
  },
};
