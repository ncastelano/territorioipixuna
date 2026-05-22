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
  groupTag?: string;
  groupPasswordHash?: string;
  groupPassword?: string;
  iconType?: string; // identificador do ícone escolhido (ex: "mountain")
  creatorName?: string; // nome do criador (full_name)
  creatorAvatar?: string; // avatar do criador
  videoThumbnail?: string; // thumbnail extraída do vídeo
};
