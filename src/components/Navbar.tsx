"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchProfile, getCurrentUser } from "@/lib/profiles";
import { Home, PlusCircle, UserRound, Map } from "lucide-react";

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (
    words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "IP"
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [displayName, setDisplayName] = useState("Perfil");

  useEffect(() => {
    let isMounted = true;

    async function loadProfilePreview() {
      const user = await getCurrentUser();

      if (!user || !isMounted) {
        setAvatarUrl("");
        setDisplayName("Entrar");
        return;
      }

      const profile = await fetchProfile(user.id);

      if (!isMounted) {
        return;
      }

      setAvatarUrl(profile?.image_url || "");
      setDisplayName(profile?.full_name || user.email || "Perfil");
    }

    loadProfilePreview().catch(() => {
      if (isMounted) {
        setAvatarUrl("");
        setDisplayName("Perfil");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const profilePath = displayName === "Entrar" ? "/entrar" : "/perfil";
  const isProfileActive =
    pathname === "/perfil" ||
    pathname === "/entrar" ||
    pathname === "/cadastrar";

  return (
    <nav className="navbar">
      <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>
        <div className="nav-icon-container">
          <Home size={24} />
        </div>
        <span>Início</span>
      </Link>

      <Link
        href="/mapa"
        className={`nav-link ${pathname === "/mapa" ? "active" : ""}`}
      >
        <div className="nav-icon-container">
          <Map size={24} />
        </div>
        <span>Mapa</span>
      </Link>

      <Link
        href="/adicionar"
        className={`nav-link ${pathname === "/adicionar" ? "active" : ""}`}
      >
        <div className="nav-icon-container">
          <PlusCircle size={24} />
        </div>
        <span>Adicionar</span>
      </Link>

      <Link
        href={profilePath}
        className={`nav-link ${isProfileActive ? "active" : ""}`}
      >
        <div className="nav-icon-container">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`Foto de ${displayName}`}
              className="nav-avatar"
            />
          ) : displayName === "Entrar" ? (
            <UserRound size={24} />
          ) : (
            <span className="nav-avatar nav-avatar-initials">
              {getInitials(displayName)}
            </span>
          )}
        </div>
        <span>{displayName === "Entrar" ? "Entrar" : "Perfil"}</span>
      </Link>
    </nav>
  );
}
