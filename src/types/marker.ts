// types/marker.ts
export type MarkerType = {
  id: string;
  lng: number;
  lat: number;
  title: string;
  description: string;
  mediaType: "photo" | "video";
  mediaUrl: string;
  address: string;
  createdAt: string;
  synced?: boolean;
  userId?: string;
  userEmail?: string;
  visibility?: "public" | "private" | "team";
  teamPasswordHash?: string; // apenas para uso interno (hash)
  teamPassword?: string; // senha em texto plano (usada localmente antes de sync)
};
