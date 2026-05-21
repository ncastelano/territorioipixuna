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
  groupTag?: string; // nome do grupo (ex: "public", "equipe", "expedicao1")
  groupPasswordHash?: string; // hash da senha (opcional)
  groupPassword?: string; // senha em texto plano (apenas para uso local antes do sync)
};
