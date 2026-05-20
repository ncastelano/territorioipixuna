import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local.');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
}

export type ReportCategory = 'invasao' | 'ameaca' | 'desmatamento' | 'queimada' | 'recurso_natural' | 'vigilancia';

export interface MarkerReport {
  id: string;
  user_id: string | null;
  category: ReportCategory;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  reporter_name: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string;
  role: string | null;
  bio: string | null;
  region: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
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
