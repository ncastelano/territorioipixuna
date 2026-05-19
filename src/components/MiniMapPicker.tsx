'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MiniMapPickerProps {
  latitude: number;
  longitude: number;
  category: string;
  onChange: (lat: number, lng: number) => void;
}

export default function MiniMapPicker({ latitude, longitude, category, onChange }: MiniMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [longitude, latitude],
      zoom: 6,
      pitchWithRotate: false,
      dragRotate: false,
    });

    mapRef.current = map;

    // Create marker element
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.innerHTML = `
      <div class="marker-pin" style="background-color: var(--color-${category}); border: 2px solid white;">
        <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
      </div>
    `;

    // Create draggable marker
    const marker = new mapboxgl.Marker({
      element: el,
      draggable: true
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    // Marker drag end event
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      onChange(lngLat.lat, lngLat.lng);
    });

    // Map click event to place marker
    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      marker.setLngLat([lng, lat]);
      onChange(lat, lng);
      map.easeTo({ center: [lng, lat], duration: 400 });
    });

    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker styling and position when category/lat/lng change externally
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const currentLngLat = markerRef.current.getLngLat();
    if (currentLngLat.lat !== latitude || currentLngLat.lng !== longitude) {
      markerRef.current.setLngLat([longitude, latitude]);
      mapRef.current.easeTo({ center: [longitude, latitude], duration: 400 });
    }

    // Update marker pin color
    const element = markerRef.current.getElement();
    const pin = element.querySelector('.marker-pin') as HTMLElement;
    if (pin) {
      pin.style.backgroundColor = `var(--color-${category})`;
    }
  }, [latitude, longitude, category]);

  return (
    <div className="mini-map-picker">
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        background: 'rgba(9, 13, 22, 0.8)',
        backdropFilter: 'blur(4px)',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.65rem',
        color: 'var(--fg-secondary)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        pointerEvents: 'none'
      }}>
        Clique no mapa ou arraste o marcador para definir o ponto
      </div>
    </div>
  );
}
