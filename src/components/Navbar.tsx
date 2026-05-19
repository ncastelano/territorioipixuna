'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
        <div className="nav-icon-container">
          <Home size={24} />
        </div>
        <span>Início</span>
      </Link>

      <Link href="/adicionar" className={`nav-link ${pathname === '/adicionar' ? 'active' : ''}`}>
        <div className="nav-icon-container">
          <PlusCircle size={24} />
        </div>
        <span>Adicionar</span>
      </Link>

      <Link href="/perfil" className={`nav-link ${pathname === '/perfil' ? 'active' : ''}`}>
        <div className="nav-icon-container">
          <img 
            src="/avatar.png" 
            alt="Foto do Usuário" 
            className="nav-avatar"
            onError={(e) => {
              // Fallback if image fails to load
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop';
            }}
          />
        </div>
        <span>Perfil</span>
      </Link>
    </nav>
  );
}
