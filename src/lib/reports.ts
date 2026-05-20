import { getSupabaseClient, MarkerReport } from './supabase';

const REPORTS_PAGE_SIZE = 1000;

export async function fetchReports(): Promise<MarkerReport[]> {
  const supabase = getSupabaseClient();
  const reports: MarkerReport[] = [];
  let page = 0;

  while (true) {
    const from = page * REPORTS_PAGE_SIZE;
    const to = from + REPORTS_PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Erro ao buscar reports no Supabase:', error.message);
      return reports;
    }

    reports.push(...((data ?? []) as MarkerReport[]));

    if (!data || data.length < REPORTS_PAGE_SIZE) {
      return reports;
    }

    page += 1;
  }
}

export async function fetchReportsByUser(userId: string): Promise<MarkerReport[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar reports do usuário no Supabase:', error.message);
    return [];
  }

  return (data ?? []) as MarkerReport[];
}

export async function saveReport(report: Omit<MarkerReport, 'id' | 'created_at'>): Promise<MarkerReport> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('reports')
    .insert([report])
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao salvar report no Supabase: ${error.message}`);
  }

  return data as MarkerReport;
}
