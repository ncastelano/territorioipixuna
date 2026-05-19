import { MarkerReport } from './supabase';

export const MOCK_REPORTS: MarkerReport[] = [
  {
    id: 'mock-1',
    category: 'invasao',
    title: 'Invasão em Área de Preservação',
    description: 'Loteamento ilegal detectado nas margens do Rio Tarumã, região metropolitana de Manaus.',
    latitude: -3.015,
    longitude: -60.085,
    reporter_name: 'Guarda Florestal',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'mock-2',
    category: 'desmatamento',
    title: 'Alerta de Desmatamento Raso',
    description: 'Corte raso de mata nativa cobrindo aproximadamente 15 hectares próximo à BR-319.',
    latitude: -7.512,
    longitude: -63.021,
    reporter_name: 'Satélite INPE',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
  },
  {
    id: 'mock-3',
    category: 'queimada',
    title: 'Foco de Queimada Ativo',
    description: 'Incêndio florestal fora de controle avançando sobre floresta primária em Apuí.',
    latitude: -7.198,
    longitude: -59.882,
    reporter_name: 'Brigada de Combate',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
  },
  {
    id: 'mock-4',
    category: 'ameaca',
    title: 'Ameaça a Lideranças Indígenas',
    description: 'Presença de invasores armados coagindo pescadores tradicionais na calha do Rio Javari, Atalaia do Norte.',
    latitude: -4.265,
    longitude: -70.192,
    reporter_name: 'CIMI',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
  },
  {
    id: 'mock-5',
    category: 'recurso_natural',
    title: 'Manejo Sustentável de Pirarucu',
    description: 'Área certificada de manejo comunitário do pirarucu com alto índice de conservação da espécie.',
    latitude: -3.354,
    longitude: -64.711,
    reporter_name: 'Associação de Moradores',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
  },
  {
    id: 'mock-6',
    category: 'vigilancia',
    title: 'Patrulhamento do Grupo de Vigilância',
    description: 'Ronda territorial preventiva realizada pelos Guardiões da Floresta nos limites da TI Waimiri Atroari.',
    latitude: -1.950,
    longitude: -60.120,
    reporter_name: 'Guardiões Waimiri',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
  },
  {
    id: 'mock-7',
    category: 'invasao',
    title: 'Balsas de Garimpo Ilegal',
    description: 'Presença de 3 balsas operando ilegalmente para extração de ouro no Rio Purus.',
    latitude: -7.260,
    longitude: -64.810,
    reporter_name: 'Morador Local',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(), // 1.5 days ago
  },
  {
    id: 'mock-8',
    category: 'recurso_natural',
    title: 'Coleta Tradicional de Castanha',
    description: 'Castanhal nativo mapeado para manejo sustentável pela cooperativa local de extrativistas.',
    latitude: -0.130,
    longitude: -67.080,
    reporter_name: 'COOPMAS',
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(), // 4 days ago
  }
];
