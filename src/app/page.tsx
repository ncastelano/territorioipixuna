"use client";

import {
  Shield,
  Trees,
  RadioTower,
  Globe,
  Flame,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080c14] text-white">
      {/* =========================
          BACKGROUND EFFECTS
      ========================== */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-[260px] w-[260px] rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="absolute right-[-100px] top-[220px] h-[240px] w-[240px] rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="absolute bottom-[-140px] left-[20%] h-[280px] w-[280px] rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      {/* =========================
          CONTENT
      ========================== */}
      <div className="relative z-10 flex flex-col gap-8 px-4 pb-32 pt-5">
        {/* =========================
            HERO CARD
        ========================== */}
        <section className="glass-card overflow-hidden rounded-[36px] border border-white/10 p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10" />

          <div className="relative z-10">
            {/* badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
              <Sparkles size={14} className="text-emerald-400" />

              <span className="text-[11px] font-bold uppercase tracking-[2px] text-emerald-300">
                Plataforma Territorial
              </span>
            </div>

            {/* title */}
            <div className="mt-6">
              <h1 className="text-[46px] font-black leading-[0.92] tracking-[-3px]">
                Território
                <span className="mt-1 block bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Ipixuna
                </span>
              </h1>

              <p className="mt-6 text-[15px] leading-7 text-slate-400">
                Plataforma voltada para transmissão de dados relacionados aos
                interesses indígenas, vigilância territorial, cultura,
                monitoramento ambiental e comunicação comunitária.
              </p>
            </div>

            {/* buttons */}
            <div className="mt-8 flex gap-3">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-5 py-4 text-sm font-bold text-black shadow-[0_10px_30px_rgba(16,185,129,0.35)] transition active:scale-[0.98]">
                Explorar
                <ChevronRight size={18} />
              </button>

              <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold backdrop-blur-xl transition active:scale-[0.98]">
                Sobre
              </button>
            </div>

            {/* stats */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-4">
                <h3 className="text-2xl font-black text-emerald-400">+120</h3>

                <p className="mt-2 text-[11px] leading-4 text-slate-500">
                  Registros territoriais
                </p>
              </div>

              <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-4">
                <h3 className="text-2xl font-black text-cyan-400">24h</h3>

                <p className="mt-2 text-[11px] leading-4 text-slate-500">
                  Vigilância ativa
                </p>
              </div>

              <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-4">
                <h3 className="text-2xl font-black text-orange-400">+35</h3>

                <p className="mt-2 text-[11px] leading-4 text-slate-500">
                  Áreas monitoradas
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            MAP CARD
        ========================== */}
        <section className="glass-card rounded-[36px] border border-white/10 p-5">
          {/* header */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-1px]">
                Mapa Territorial
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Visualização de registros, informações e ocorrências
                territoriais.
              </p>
            </div>

            <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-400">
              <Globe size={22} />
            </div>
          </div>
        </section>

        {/* =========================
            FEATURES TITLE
        ========================== */}
        <section className="px-1">
          <span className="text-[11px] font-bold uppercase tracking-[3px] text-emerald-400">
            Recursos
          </span>

          <h2 className="mt-3 text-3xl font-black tracking-[-2px]">
            Funcionalidades da Plataforma
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            Ferramentas desenvolvidas para fortalecer a proteção territorial,
            compartilhamento de informações e monitoramento indígena.
          </p>
        </section>

        {/* =========================
            FEATURE CARDS
        ========================== */}
        <section className="grid gap-5">
          {/* CARD */}
          <div className="glass-card rounded-[32px] border border-red-500/10 p-6">
            <div className="flex items-start gap-5">
              <div className="rounded-3xl bg-red-500/10 p-4 text-red-400">
                <Shield size={28} />
              </div>

              <div>
                <h3 className="text-xl font-bold">Vigilância Territorial</h3>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Registro de ameaças, invasões e ocorrências dentro de áreas
                  monitoradas.
                </p>
              </div>
            </div>
          </div>

          {/* CARD */}
          <div className="glass-card rounded-[32px] border border-orange-500/10 p-6">
            <div className="flex items-start gap-5">
              <div className="rounded-3xl bg-orange-500/10 p-4 text-orange-400">
                <Flame size={28} />
              </div>

              <div>
                <h3 className="text-xl font-bold">Monitoramento Ambiental</h3>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Informações sobre queimadas, desmatamentos e impactos
                  ambientais.
                </p>
              </div>
            </div>
          </div>

          {/* CARD */}
          <div className="glass-card rounded-[32px] border border-emerald-500/10 p-6">
            <div className="flex items-start gap-5">
              <div className="rounded-3xl bg-emerald-500/10 p-4 text-emerald-400">
                <Trees size={28} />
              </div>

              <div>
                <h3 className="text-xl font-bold">Cultura e Comunidade</h3>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Compartilhamento de conhecimentos tradicionais, cultura e
                  dados territoriais.
                </p>
              </div>
            </div>
          </div>

          {/* CARD */}
          <div className="glass-card rounded-[32px] border border-cyan-500/10 p-6">
            <div className="flex items-start gap-5">
              <div className="rounded-3xl bg-cyan-500/10 p-4 text-cyan-400">
                <RadioTower size={28} />
              </div>

              <div>
                <h3 className="text-xl font-bold">Transmissão de Dados</h3>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Plataforma preparada para comunicação comunitária e futuras
                  melhorias colaborativas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            FINAL CARD
        ========================== */}
        <section className="relative overflow-hidden rounded-[36px] border border-emerald-500/10 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10 p-7">
          <div className="absolute right-[-50px] top-[-50px] h-[180px] w-[180px] rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-[3px] text-emerald-400">
              Futuro da Plataforma
            </span>

            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-2px]">
              O Território Ipixuna continuará evoluindo.
            </h2>

            <p className="mt-5 text-sm leading-8 text-slate-400">
              Novas ferramentas poderão ser adicionadas futuramente para ampliar
              a proteção territorial, comunicação comunitária e monitoramento
              das áreas indígenas.
            </p>

            <button className="mt-8 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold backdrop-blur-xl">
              Conhecer Projeto
              <ChevronRight size={18} />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
