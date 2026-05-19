'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MarkerReport } from '@/lib/supabase';
import { fetchReports } from '@/lib/reports';
import { ShieldAlert, Skull, Axe, Flame, Leaf, Eye, X, MapPin, User, Calendar } from 'lucide-react';

const CATEGORIES = [
  { id: 'invasao', label: 'Invasões', icon: ShieldAlert, color: 'var(--color-invasao)' },
  { id: 'ameaca', label: 'Ameaças', icon: Skull, color: 'var(--color-ameaca)' },
  { id: 'desmatamento', label: 'Desmatamentos', icon: Axe, color: 'var(--color-desmatamento)' },
  { id: 'queimada', label: 'Queimadas', icon: Flame, color: 'var(--color-queimada)' },
  { id: 'recurso_natural', label: 'Recursos Naturais', icon: Leaf, color: 'var(--color-recurso-natural)' },
  { id: 'vigilancia', label: 'Grupos de Vigilância', icon: Eye, color: 'var(--color-vigilancia)' },
] as const;

function getCategoryIconSVG(category: string) {
  switch (category) {
    case 'invasao':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`;
    case 'ameaca':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v1a4 4 0 0 0 3 3.87v1.13a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-1.13A4 4 0 0 0 20 11v-1a8 8 0 0 0-8-8z"/><path d="M10 14h4"/><path d="M9 16h6"/><path d="M10 20v2"/><path d="M14 20v2"/></svg>`;
    case 'desmatamento':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m14 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9"/><path d="M15 13 9 7l4-4 6 6-4 4z"/></svg>`;
    case 'queimada':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
    case 'recurso_natural':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2z"/><path d="M9 22v-4h-4"/></svg>`;
    case 'vigilancia':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
  }
}

export default function MapComponent() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [reports, setReports] = useState<MarkerReport[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>(
    CATEGORIES.map((c) => c.id)
  );
  const [selectedReport, setSelectedReport] = useState<MarkerReport | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Fetch reports on mount
  useEffect(() => {
    async function loadData() {
      const data = await fetchReports();
      setReports(data);
    }
    loadData();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-62.2159, -3.4653], // Center in Amazonas State, Brazil
      zoom: 5.5,
      pitchWithRotate: false,
      dragRotate: false, // keep 2D view for better tracking
    });

    // Add navigation controls (zoom in / zoom out)
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Filter reports
  const filteredReports = reports.filter((r) => activeFilters.includes(r.category));

  // Update Markers when filtered reports change or map loads
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers
    filteredReports.forEach((report) => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.innerHTML = `
        <div class="marker-pin" style="background-color: var(--color-${report.category})">
          <div class="marker-icon-wrapper">
            ${getCategoryIconSVG(report.category)}
          </div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedReport(report);
        mapRef.current?.easeTo({
          center: [report.longitude, report.latitude],
          zoom: Math.max(mapRef.current.getZoom(), 8),
          duration: 800,
        });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([report.longitude, report.latitude])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [filteredReports, mapLoaded]);

  // Toggle filter logic
  const handleToggleFilter = (categoryId: string) => {
    setActiveFilters((prev) => {
      // If category is already in filter, remove it, unless it's the last one left
      if (prev.includes(categoryId)) {
        if (prev.length === 1) {
          // If it's the last one, toggle all back ON instead of showing blank map
          return CATEGORIES.map((c) => c.id);
        }
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const getCategoryLabel = (catId: string) => {
    return CATEGORIES.find((c) => c.id === catId)?.label || catId;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="map-container-wrapper">
      {/* Category Filters Overlay */}
      <div className="filters-overlay">
        <div className="filters-scroll">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeFilters.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => handleToggleFilter(cat.id)}
                className={`filter-chip ${isActive ? `active ${cat.id}` : ''}`}
                title={`Filtrar por ${cat.label}`}
              >
                <span className="filter-icon">
                  <Icon size={16} />
                </span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mapbox container */}
      <div ref={mapContainerRef} className="mapbox-container" />

      {/* Report Info Panel (Slide-up Drawer) */}
      {selectedReport && (
        <div className="info-panel">
          <div className="info-header">
            <div className="info-title-group">
              <span className={`info-badge ${selectedReport.category}`}>
                {getCategoryLabel(selectedReport.category)}
              </span>
              <h3 className="info-title">{selectedReport.title}</h3>
            </div>
            <button
              className="close-btn"
              onClick={() => setSelectedReport(null)}
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>

          <p className="info-description">{selectedReport.description}</p>

          <div className="info-meta">
            <div className="info-reporter">
              <div className="info-reporter-avatar">
                <User size={12} />
              </div>
              <span>Por: {selectedReport.reporter_name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} />
              <span>{formatDate(selectedReport.created_at)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--fg-tertiary)', marginTop: '8px' }}>
            <MapPin size={10} />
            <span>Lat: {selectedReport.latitude.toFixed(4)}, Lng: {selectedReport.longitude.toFixed(4)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
