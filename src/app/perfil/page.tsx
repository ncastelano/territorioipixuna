'use client';

import { useEffect, useState } from 'react';
import { fetchReports } from '@/lib/reports';
import { MarkerReport } from '@/lib/supabase';
import { User, Database, Map, Info, Compass, Shield, CheckCircle } from 'lucide-react';

export default function Perfil() {
  const [reports, setReports] = useState<MarkerReport[]>([]);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchReports();
        setReports(data);
        setDbStatus('connected');
      } catch (err) {
        console.error(err);
        setDbStatus('error');
      }
    }
    loadData();
  }, []);

  const counts = reports.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="page-wrapper">
      {/* Profile Header Card */}
      <div className="glass-card profile-card">
        <div className="profile-avatar-container">
          <img 
            src="/avatar.png" 
            alt="Foto do Usuário" 
            className="profile-avatar"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop';
            }}
          />
          <div className="avatar-edit-badge" title="Editar Foto">
            <CheckCircle size={16} />
          </div>
        </div>
        
        <h2 className="profile-name">Natan Castelano</h2>
        <p className="profile-role">Coordenador de Monitoramento</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--fg-tertiary)', maxWidth: '280px', margin: '0 auto' }}>
          Agente encarregado da vigilância ambiental e territorial do Estado do Amazonas.
        </p>

        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{reports.length}</span>
            <span className="stat-label">Ocorrências</span>
          </div>
          <div className="stat-item" style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)', padding: '0 20px' }}>
            <span className="stat-value" style={{ color: 'var(--accent)' }}>PWA</span>
            <span className="stat-label">Instalável</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">AM</span>
            <span className="stat-label">Região</span>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '1.1rem', fontWeight: 750, marginBottom: '1rem', color: 'var(--fg-primary)' }}>Estatísticas Territoriais</h3>
      
      {/* Category distribution grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '3px solid var(--color-invasao)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)', fontWeight: 600 }}>Invasões</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{counts['invasao'] || 0}</span>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '3px solid var(--color-ameaca)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)', fontWeight: 600 }}>Ameaças</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{counts['ameaca'] || 0}</span>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '3px solid var(--color-desmatamento)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)', fontWeight: 600 }}>Desmatamentos</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{counts['desmatamento'] || 0}</span>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '3px solid var(--color-queimada)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)', fontWeight: 600 }}>Queimadas</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{counts['queimada'] || 0}</span>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '3px solid var(--color-recurso-natural)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)', fontWeight: 600 }}>Recursos Naturais</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{counts['recurso_natural'] || 0}</span>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '3px solid var(--color-vigilancia)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)', fontWeight: 600 }}>Grupos de Vigilância</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{counts['vigilancia'] || 0}</span>
        </div>
      </div>

      <h3 style={{ fontSize: '1.1rem', fontWeight: 750, marginBottom: '1rem', color: 'var(--fg-primary)' }}>Integrações Externas</h3>
      
      {/* Integrations panel */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '2rem' }}>
        {/* Supabase status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
              <Database size={18} />
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Supabase Database</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--fg-secondary)' }}>Armazenamento em Nuvem</p>
            </div>
          </div>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '12px',
            background: dbStatus === 'connected' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: dbStatus === 'connected' ? '#10b981' : '#ef4444',
            border: `1px solid ${dbStatus === 'connected' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
          }}>
            {dbStatus === 'connected' ? 'CONECTADO' : 'SEM CONEXÃO'}
          </span>
        </div>

        {/* Mapbox status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-vigilancia)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Map size={18} />
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Mapbox Engine</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--fg-secondary)' }}>Imagens de Satélite e Vetores</p>
            </div>
          </div>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            AUTORIZADO
          </span>
        </div>
      </div>

      {/* Info footer */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
        <Info size={16} style={{ color: 'var(--fg-tertiary)', flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '0.75rem', color: 'var(--fg-tertiary)', lineHeight: '1.4' }}>
          Este aplicativo é uma PWA (Progressive Web App). Você pode adicioná-lo à tela inicial do seu celular usando o menu do navegador para uso off-line e acesso rápido.
        </p>
      </div>
    </div>
  );
}
