-- TABELA DE OCORRÊNCIAS / MARCAÇÕES
-- Execute este script no SQL Editor do seu projeto no Supabase

-- 1. Criar a tabela
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  category text not null check (category in ('invasao', 'ameaca', 'desmatamento', 'queimada', 'recurso_natural', 'vigilancia')),
  title text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  reporter_name text not null default 'Anônimo',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilitar o RLS (Row Level Security)
alter table public.reports enable row level security;

-- 3. Criar políticas de segurança para acesso público (leitura e escrita anônimas)
create policy "Allow public read access" 
on public.reports 
for select 
using (true);

create policy "Allow public insert access" 
on public.reports 
for insert 
with check (true);

-- 4. Inserir dados mockados iniciais (opcional, caso queira preencher o Supabase de início)
insert into public.reports (category, title, description, latitude, longitude, reporter_name, created_at)
values 
  ('invasao', 'Invasão em Área de Preservação', 'Loteamento ilegal detectado nas margens do Rio Tarumã, região metropolitana de Manaus.', -3.0150, -60.0850, 'Guarda Florestal', now() - interval '2 hours'),
  ('desmatamento', 'Alerta de Desmatamento Raso', 'Corte raso de mata nativa cobrindo aproximadamente 15 hectares próximo à BR-319.', -7.5120, -63.0210, 'Satélite INPE', now() - interval '1 day'),
  ('queimada', 'Foco de Queimada Ativo', 'Incêndio florestal fora de controle avançando sobre floresta primária em Apuí.', -7.1980, -59.8820, 'Brigada de Combate', now() - interval '5 hours'),
  ('ameaca', 'Ameaça a Lideranças Indígenas', 'Presença de invasores armados coagindo pescadores tradicionais na calha do Rio Javari, Atalaia do Norte.', -4.2650, -70.1920, 'CIMI', now() - interval '2 days'),
  ('recurso_natural', 'Manejo Sustentável de Pirarucu', 'Área certificada de manejo comunitário do pirarucu com alto índice de conservação da espécie.', -3.3540, -64.7110, 'Associação de Moradores', now() - interval '3 days'),
  ('vigilancia', 'Patrulhamento do Grupo de Vigilância', 'Ronda territorial preventiva realizada pelos Guardiões da Floresta nos limites da TI Waimiri Atroari.', -1.9500, -60.1200, 'Guardiões Waimiri', now() - interval '12 hours');
