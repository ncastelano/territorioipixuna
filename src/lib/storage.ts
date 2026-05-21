// app/lib/storage.ts

import { MarkerType } from "../types/marker";

const STORAGE_KEY = "territorio_markers";

export function saveMarkersLocally(markers: MarkerType[]) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
  } catch (error) {
    console.error("Erro ao salvar markers:", error);
  }
}

export function getMarkersLocally(): MarkerType[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) return [];

    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao carregar markers:", error);

    return [];
  }
}

export function addMarkerLocally(marker: MarkerType) {
  const current = getMarkersLocally();

  const updated = [marker, ...current];

  saveMarkersLocally(updated);

  return updated;
}

export function removeMarkerLocally(id: string) {
  const current = getMarkersLocally();

  const updated = current.filter((item) => item.id !== id);

  saveMarkersLocally(updated);

  return updated;
}

export function clearMarkersLocally() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);
}
