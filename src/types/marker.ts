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
  userId?: string; // ID do usuário que criou o marcador
  userEmail?: string; // Email do usuário que criou o marcador
};
