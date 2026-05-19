'use client';

import dynamic from 'next/dynamic';

// Load MapComponent dynamically without SSR to prevent Mapbox-gl from executing on server
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      backgroundColor: 'var(--bg-primary)',
      gap: '16px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(16, 185, 129, 0.1)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <span style={{ color: 'var(--fg-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
        Carregando Mapa do Amazonas...
      </span>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
});

export default function Home() {
  return <MapComponent />;
}
