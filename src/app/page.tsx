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
    <main className="min-h-screen bg-[#080c14] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* BACKGROUND GLOWS */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[350px] w-[350px] rounded-full bg-red-500/10 blur-[100px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[350px] w-[350px] rounded-full bg-orange-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col gap-6">
        {/* HERO LOGO / BRANDING */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2">
            <Sparkles size={14} className="text-orange-400" />
            <span className="text-[11px] font-bold uppercase tracking-[2px] text-orange-300">
              Território Ipixuna
            </span>
          </div>
        </div>

        {/* GLOWING STAT CARD */}
        <div className="glass-card overflow-hidden rounded-[36px] border border-white/10 p-8 flex flex-col items-center text-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5" />
          
          <div className="relative z-10 flex flex-col items-center gap-6 w-full">
            {/* ICON & COUNTER */}
            <div className="relative flex items-center justify-center">
              {/* Outer Pulsing Aura */}
              <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl animate-pulse w-24 h-24" />
              
              <div className="relative bg-red-500/10 border border-red-500/30 rounded-full p-6 text-red-500 animate-pulse">
                <Flame size={48} className="drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
              </div>
            </div>

            {/* MAIN STAT */}
            <div className="flex flex-col items-center">
              {loading ? (
                <div className="h-20 flex items-center justify-center">
                  <Loader2 className="animate-spin text-orange-500" size={36} />
                </div>
              ) : (
                <span className="text-7xl font-black tracking-tighter bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(239,68,68,0.2)]">
                  {focosCount ?? 0}
                </span>
              )}
              <h2 className="text-xl font-bold mt-2">Focos Ativos Detectados</h2>
            </div>

            {/* DESCRIPTION */}
            <p className="text-[15px] leading-relaxed text-slate-400 px-2">
              Atualmente existem estes números de focos de queimadas detectados hoje no Brasil.
            </p>

            {/* BUTTON LINK TO MAP */}
            <Link
              href="/mapa"
              className="mt-4 w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4 text-sm font-bold text-white shadow-[0_8px_30px_rgba(239,68,68,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Map size={18} />
              Visualizar no Mapa
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
