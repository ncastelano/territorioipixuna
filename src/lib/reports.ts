import { supabase, MarkerReport } from './supabase';
import { MOCK_REPORTS } from './mockData';

const LOCAL_STORAGE_KEY = 'ipixuna_local_reports';

export async function fetchReports(): Promise<MarkerReport[]> {
  let dbReports: MarkerReport[] = [];
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn("Erro ao ler Supabase. Usando armazenamento local/mock.", error.message);
    } else if (data && data.length > 0) {
      dbReports = data as MarkerReport[];
    }
  } catch (err) {
    console.warn("Falha de conexão com Supabase. Usando fallback.", err);
  }

  // Get local reports from localStorage (added by user offline or without Supabase table setup)
  let localReports: MarkerReport[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        localReports = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Erro ao ler localStorage:", e);
    }
  }

  // Combine database reports, local reports, and mock reports
  const allReports = [...dbReports, ...localReports];
  
  // If we have nothing, seed with MOCK_REPORTS
  if (allReports.length === 0) {
    return MOCK_REPORTS;
  }

  // Return unique reports by ID
  const uniqueReportsMap = new Map<string, MarkerReport>();
  MOCK_REPORTS.forEach(r => uniqueReportsMap.set(r.id, r));
  allReports.forEach(r => uniqueReportsMap.set(r.id, r));

  return Array.from(uniqueReportsMap.values());
}

export async function saveReport(report: Omit<MarkerReport, 'id' | 'created_at'>): Promise<MarkerReport> {
  const newReport: MarkerReport = {
    ...report,
    id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
    created_at: new Date().toISOString(),
  };

  // Try saving to Supabase
  let savedToSupabase = false;
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert([newReport])
      .select();

    if (!error && data && data.length > 0) {
      console.log("Salvo no Supabase com sucesso!");
      savedToSupabase = true;
      return data[0] as MarkerReport;
    } else {
      console.warn("Erro ao salvar no Supabase, salvando localmente:", error?.message);
    }
  } catch (err) {
    console.warn("Falha de rede ao conectar com Supabase, salvando localmente:", err);
  }

  // Fallback: save to localStorage if Supabase fails
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      const reports = stored ? JSON.parse(stored) : [];
      reports.unshift(newReport);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
    } catch (e) {
      console.error("Erro ao salvar no localStorage:", e);
    }
  }

  return newReport;
}
