import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface MarkerReport {
  id: string;
  category: 'invasao' | 'ameaca' | 'desmatamento' | 'queimada' | 'recurso_natural' | 'vigilancia';
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  reporter_name: string;
  created_at: string;
}

// SQL to run in Supabase SQL Editor:
/*
create table reports (
  id uuid default gen_random_uuid() primary key,
  category text not null check (category in ('invasao', 'ameaca', 'desmatamento', 'queimada', 'recurso_natural', 'vigilancia')),
  title text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  reporter_name text not null default 'Anônimo',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (optional, for anonymous access in this demo)
alter table reports enable row level security;
create policy "Allow public read" on reports for select using (true);
create policy "Allow public insert" on reports for insert with check (true);
*/
