"use client";

import { useEffect, useState } from "react";
import { MapPin, X, Calendar, Navigation, Cloud } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

type PublicLocation = {
  id: string;
  title: string;
  description: string;
  address: string;
  lng: number;
  lat: number;
  media_url: string;
  media_type: string;
  created_at: string;
};

type Props = {
  onClose: () => void;
  onSelectLocation: (lng: number, lat: number) => void;
};

export default function PublicLocationsDialog({
  onClose,
  onSelectLocation,
}: Props) {
  const [locations, setLocations] = useState<PublicLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocations() {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setLocations(data || []);
      }
      setLoading(false);
    }
    fetchLocations();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 1000,
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
          background: "rgba(0,0,0,0.85)",
          borderRadius: 32,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 20,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>
              🌍 Todos os locais
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 13,
                marginTop: 4,
              }}
            >
              {locations.length} locais compartilhados
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
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

        {/* Lista */}
        <div
          style={{
            overflowY: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Carregando...
            </div>
          ) : locations.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Nenhum local encontrado.
            </div>
          ) : (
            locations.map((loc) => (
              <div
                key={loc.id}
                onClick={() => onSelectLocation(loc.lng, loc.lat)}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 20,
                  padding: 12,
                  border: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <div style={{ display: "flex", gap: 12 }}>
                  {loc.media_url ? (
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "#111",
                        flexShrink: 0,
                      }}
                    >
                      {loc.media_type === "photo" ? (
                        <img
                          src={loc.media_url}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <video
                          src={loc.media_url}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MapPin size={24} color="#888" />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: 16 }}>{loc.title}</h4>
                      <Cloud size={14} color="#3b82f6" />
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.6)",
                        margin: "4px 0",
                      }}
                    >
                      {loc.address || "Endereço não informado"}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        fontSize: 11,
                        color: "rgba(255,255,255,0.5)",
                        marginTop: 6,
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Calendar size={10} /> {formatDate(loc.created_at)}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Navigation size={10} /> {loc.lat.toFixed(4)},{" "}
                        {loc.lng.toFixed(4)}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.7)",
                        margin: "6px 0 0 0",
                      }}
                    >
                      {loc.description}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div style={{ height: 20 }} />
        </div>
      </div>
    </div>
  );
}
