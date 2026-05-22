// app/login/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, signIn } from "@/lib/profiles";
import { LogIn, MapPin, Camera, Database, Users } from "lucide-react";

export default function EntrarPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) router.replace("/perfil");
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await signIn(email.trim(), password);
      router.push("/");
    } catch (error) {
      setMessage("Email ou senha inválidos. Verifique suas credenciais.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: Camera,
      title: "Fotos & Vídeos",
      desc: "Registre evidências visuais diretamente no local marcado.",
    },
    {
      icon: MapPin,
      title: "Marcadores Inteligentes",
      desc: "Pins coloridos indicam sincronização e status do dado.",
    },
    {
      icon: Users,
      title: "Trabalho em Equipe",
      desc: "Compartilhe pontos com colaboradores, veja atualizações ao vivo.",
    },
    {
      icon: Database,
      title: "Armazenamento Local + Cloud",
      desc: "Dados salvos offline no dispositivo, sincronização sob demanda.",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 10% 20%, #1a1a1a, #000000)",
        color: "#fff",
        padding: "1rem",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          gap: "2rem",
        }}
        className="login-container"
      >
        {/* CARD DE LOGIN – ocupa toda largura no mobile */}
        <div
          style={{
            width: "100%",
            maxWidth: "100%",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(24px)",
              borderRadius: 32,
              padding: "1.5rem",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 30px 50px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <h2
                style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 4 }}
              >
                Entrar
              </h2>
              <p
                style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}
              >
                Acesse seu painel de mapeamento
              </p>
            </div>

            <input
              placeholder="Email cadastrado"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />

            <input
              placeholder="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />

            {message && (
              <div
                style={{
                  fontSize: 13,
                  color: "#f87171",
                  textAlign: "center",
                  background: "rgba(239,68,68,0.1)",
                  padding: 10,
                  borderRadius: 20,
                }}
              >
                {message}
              </div>
            )}

            <button style={buttonStyle} disabled={isSubmitting}>
              <LogIn size={18} />
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>

            <Link
              href="/cadastrar"
              style={{
                textAlign: "center",
                fontSize: 13,
                color: "rgba(255,255,255,0.6)",
                textDecoration: "none",
                marginTop: 8,
              }}
            >
              Não tem conta?{" "}
              <span style={{ color: "#cccccc", fontWeight: 500 }}>
                Cadastre-se
              </span>
            </Link>
          </form>
        </div>

        {/* SEÇÃO DE APRESENTAÇÃO – oculta no mobile, visível apenas em desktop */}
        <div
          className="presentation-section"
          style={{
            flex: 1,
            minWidth: 280,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "1.5rem",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                background:
                  "linear-gradient(135deg, rgba(80,80,80,0.15), rgba(40,40,40,0.3))",
                padding: "8px 20px",
                borderRadius: 100,
                border: "1px solid rgba(150,150,150,0.2)",
                marginBottom: "1rem",
              }}
            >
              <MapPin size={16} color="#bbb" />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  background: "linear-gradient(135deg, #cccccc, #666666)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                Mapeamento Colaborativo
              </span>
            </div>
            <h1
              style={{
                fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
                fontWeight: 800,
                marginBottom: "1rem",
                background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Gestão de Dados Geográficos
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
              Capture, organize e compartilhe informações de campo com sua
              equipe. Ideal para projetos ambientais, urbanos ou qualquer
              mapeamento colaborativo.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  style={{
                    background: "rgba(20,20,25,0.7)",
                    backdropFilter: "blur(12px)",
                    borderRadius: 24,
                    padding: "1rem",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    style={{
                      background: "linear-gradient(145deg, #333333, #111111)",
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <Icon size={20} color="#e0e0e0" />
                  </div>
                  <h3 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>
                    {feat.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.65)",
                    }}
                  >
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RODAPÉ FIXO COM ESPAÇAMENTO */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: "0.7rem",
          color: "rgba(255,255,255,0.35)",
          padding: "0.75rem",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 18,
            flexWrap: "wrap",
            marginBottom: 4,
          }}
        >
          <span>✓ Dados offline</span>
          <span>✓ Sincronização em tempo real</span>
          <span>✓ Compartilhamento de equipe</span>
          <span>✓ Imagens e vídeos georreferenciados</span>
        </div>
        <p>
          © 2026 – Plataforma de Mapeamento Colaborativo · Desenvolvido para
          campo e equipe - Natanael Parintintin Castelano
        </p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .presentation-section {
            display: none;
          }
          .login-container {
            padding-bottom: 80px;
          }
        }
        @media (min-width: 769px) {
          .login-container {
            flex-direction: row;
            flex-wrap: nowrap;
            gap: 2rem;
          }
          .login-container > div:first-child {
            max-width: 460px;
          }
        }
      `}</style>
    </main>
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
  transition: "all 0.2s",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  marginTop: 6,
  padding: "14px 16px",
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
  transition: "transform 0.1s ease, background 0.2s",
  width: "100%",
};
