'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MarkerReport } from '@/lib/supabase';
import { fetchReports } from '@/lib/reports';
import { ShieldAlert, Skull, Axe, Flame, Leaf, Eye, X, MapPin, User, Calendar } from 'lucide-react';

const CATEGORIES = [
  { id: 'invasao', label: 'Invasões', icon: ShieldAlert, color: '#ef4444' },
  { id: 'ameaca', label: 'Ameaças', icon: Skull, color: '#d946ef' },
  { id: 'desmatamento', label: 'Desmatamentos', icon: Axe, color: '#f97316' },
  { id: 'queimada', label: 'Queimadas', icon: Flame, color: '#f59e0b' },
  { id: 'recurso_natural', label: 'Recursos Naturais', icon: Leaf, color: '#10b981' },
  { id: 'vigilancia', label: 'Grupos de Vigilância', icon: Eye, color: '#06b6d4' },
] as const;

const REPORTS_SOURCE_ID = 'reports-source';
const REPORTS_LAYER_ID = 'reports-layer';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

function getCategoryPaintColor(): mapboxgl.ExpressionSpecification {
  return [
    'match',
    ['get', 'category'],
    ...CATEGORIES.flatMap((category) => [category.id, category.color]),
    '#10b981',
  ] as mapboxgl.ExpressionSpecification;
}

function featureToReport(properties: Record<string, unknown>): MarkerReport {
  return {
    id: String(properties.id ?? ''),
    user_id: properties.user_id ? String(properties.user_id) : null,
    category: properties.category as MarkerReport['category'],
    title: String(properties.title ?? ''),
    description: properties.description ? String(properties.description) : null,
    latitude: Number(properties.latitude),
    longitude: Number(properties.longitude),
    reporter_name: String(properties.reporter_name ?? 'Anônimo'),
    created_at: String(properties.created_at ?? ''),
  };
}

export default function MapComponent() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const hasFitBoundsRef = useRef(false);

  const [reports, setReports] = useState<MarkerReport[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>(
    CATEGORIES.map((c) => c.id)
  );
  const [selectedReport, setSelectedReport] = useState<MarkerReport | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [mapError, setMapError] = useState<string | null>(
    MAPBOX_TOKEN ? null : 'Token do Mapbox não encontrado em NEXT_PUBLIC_MAPBOX_TOKEN.'
  );

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoadingReports(true);
        const data = await fetchReports();
        setReports(data);
      } catch (error) {
        console.error(error);
        setMapError('Não foi possível carregar as marcações do Supabase.');
      } finally {
        setIsLoadingReports(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    if (!MAPBOX_TOKEN) {
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-62.2159, -3.4653],
      zoom: 5.5,
      pitchWithRotate: false,
      dragRotate: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      setMapLoaded(true);
    });

    map.on('error', (event) => {
      console.error('Erro no Mapbox:', event.error);
      setMapError('O Mapbox não conseguiu carregar o mapa. Verifique o token e as restrições de URL.');
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const filteredReports = useMemo(
    () => reports.filter((report) => activeFilters.includes(report.category)),
    [reports, activeFilters]
  );

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    const featureCollection = {
      type: 'FeatureCollection' as const,
      features: filteredReports
        .filter((report) => Number.isFinite(report.latitude) && Number.isFinite(report.longitude))
        .map((report) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [report.longitude, report.latitude],
          },
          properties: report,
        })),
    };

    const source = map.getSource(REPORTS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;

    if (source) {
      source.setData(featureCollection);
      return;
    }

    map.addSource(REPORTS_SOURCE_ID, {
      type: 'geojson',
      data: featureCollection,
    });

    map.addLayer({
      id: REPORTS_LAYER_ID,
      type: 'circle',
      source: REPORTS_SOURCE_ID,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 5, 8, 8, 12, 12],
        'circle-color': getCategoryPaintColor(),
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-opacity': 0.95,
      },
    });

    map.on('mouseenter', REPORTS_LAYER_ID, () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', REPORTS_LAYER_ID, () => {
      map.getCanvas().style.cursor = '';
    });

    map.on('click', REPORTS_LAYER_ID, (event) => {
      const properties = event.features?.[0]?.properties;
      if (!properties) return;

      const report = featureToReport(properties);
      setSelectedReport(report);

      map.easeTo({
        center: [report.longitude, report.latitude],
        zoom: Math.max(map.getZoom(), 8),
        duration: 800,
      });
    });
  }, [filteredReports, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || hasFitBoundsRef.current || filteredReports.length === 0) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    let validCoordinateCount = 0;

    filteredReports.forEach((report) => {
      if (Number.isFinite(report.latitude) && Number.isFinite(report.longitude)) {
        bounds.extend([report.longitude, report.latitude]);
        validCoordinateCount += 1;
      }
    });

    if (validCoordinateCount === 0) {
      return;
    }

    mapRef.current.fitBounds(bounds, {
      padding: { top: 90, right: 36, bottom: 110, left: 36 },
      maxZoom: 8,
      duration: 900,
    });
    hasFitBoundsRef.current = true;
  }, [filteredReports, mapLoaded]);

  const handleToggleFilter = (categoryId: string) => {
    setActiveFilters((prev) => {
      if (prev.includes(categoryId)) {
        if (prev.length === 1) {
          return CATEGORIES.map((c) => c.id);
        }

        return prev.filter((id) => id !== categoryId);
      }

      return [...prev, categoryId];
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

      <div ref={mapContainerRef} className="mapbox-container" />

      {(mapError || isLoadingReports || reports.length === 0) && (
        <div className={`map-status ${mapError ? 'error' : ''}`}>
          {mapError
            ? mapError
            : isLoadingReports
              ? 'Carregando marcações...'
              : 'Nenhuma marcação encontrada.'}
        </div>
      )}

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

          {selectedReport.description && (
            <p className="info-description">{selectedReport.description}</p>
          )}

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
