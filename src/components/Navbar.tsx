"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { fetchProfile, getCurrentUser } from "@/lib/profiles";

import { PlusCircle, UserRound, MessagesSquare, MapPinned } from "lucide-react";

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (
    words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "IP"
  );
}

function truncateName(name: string, maxLength = 8) {
  return name.length > maxLength ? name.slice(0, maxLength) + "…" : name;
}

export default function Navbar() {
  const pathname = usePathname();

  const [avatarUrl, setAvatarUrl] = useState("");
  const [displayName, setDisplayName] = useState("Perfil");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfilePreview() {
      const user = await getCurrentUser();

      if (!user || !isMounted) {
        setIsLoggedIn(false);
        setAvatarUrl("");
        setDisplayName("Entrar");
        return;
      }

      setIsLoggedIn(true);
      const profile = await fetchProfile(user.id);
      if (!isMounted) return;

      setAvatarUrl(profile?.image_url || "");
      // Prioriza full_name, depois email, depois "Perfil"
      const name = profile?.full_name || user.email || "Perfil";
      setDisplayName(name);
    }

    loadProfilePreview();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const profilePath = isLoggedIn ? "/perfil" : "/login";
  const isProfileActive =
    pathname === "/perfil" ||
    pathname === "/login" ||
    pathname === "/cadastrar";

  const navItems = [
    {
      href: "/",
      label: "Mapa",
      icon: MapPinned,
      active: pathname === "/",
    },
    {
      href: "/comunidade",
      label: "Comunidade",
      icon: MessagesSquare,
      active: pathname === "/comunidade",
    },

    {
      href: profilePath,
      label: isLoggedIn ? truncateName(displayName) : "Entrar",
      icon: UserRound,
      active: isProfileActive,
      profile: true,
    },
  ];

  return (
    <nav style={navStyle}>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              ...itemStyle,
              color: item.active ? "#000" : "rgba(255,255,255,0.58)",
              background: item.active ? "#ffffff" : "transparent",
              border: item.active
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid transparent",
              boxShadow: item.active
                ? "0 8px 24px rgba(255,255,255,0.12)"
                : "none",
            }}
          >
            <div style={iconWrapStyle}>
              {item.profile ? (
                isLoggedIn && avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    style={{
                      ...avatarStyle,
                      border: item.active
                        ? "1px solid rgba(0,0,0,0.08)"
                        : "1px solid rgba(255,255,255,0.15)",
                    }}
                  />
                ) : isLoggedIn ? (
                  <div
                    style={{
                      ...initialsStyle,
                      background: item.active
                        ? "rgba(0,0,0,0.08)"
                        : "rgba(255,255,255,0.10)",
                      color: item.active ? "#000" : "#fff",
                    }}
                  >
                    {getInitials(displayName)}
                  </div>
                ) : (
                  <Icon size={18} />
                )
              ) : (
                <Icon size={18} />
              )}
            </div>
            <span style={labelStyle}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ================= STYLES (iguais aos originais) ================= */

const navStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 18,
  left: "50%",
  transform: "translateX(-50%)",
  width: "calc(100% - 24px)",
  maxWidth: 500,
  display: "flex",
  justifyContent: "space-between",
  gap: 4,
  padding: 6,
  borderRadius: 24,
  background: "rgba(0,0,0,0.62)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
  zIndex: 999,
};

const itemStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  padding: "8px 4px",
  borderRadius: 18,
  textDecoration: "none",
  transition: "all 0.2s ease",
};

const iconWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0.2,
};

const avatarStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  objectFit: "cover",
};

const initialsStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.12)",
  backdropFilter: "blur(12px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 9,
  fontWeight: 800,
  transition: "all 0.2s ease",
};
