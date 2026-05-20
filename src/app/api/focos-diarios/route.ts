import { NextResponse } from "next/server";
import Papa from "papaparse";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

const INPE_DIARIO_URL = "https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/diario/Brasil/";

interface FireHotspot {
  id: string;
  lat: number;
  lon: number;
  data_hora_gmt: string;
  satelite: string;
  municipio: string;
  estado: string;
  risco_fogo: number | null;
  bioma: string;
  frp: number | null;
}

interface CacheData {
  data: {
    success: boolean;
    count: number;
    file: string;
    lastUpdated: string;
    points: FireHotspot[];
  };
  timestamp: number;
}

let globalCache: CacheData | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos de cache local

function fixEncoding(str: string): string {
  if (!str) return "";
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    return str;
  }
}

export async function GET() {
  const now = Date.now();

  // Verifica cache em memória
  if (globalCache && now - globalCache.timestamp < CACHE_TTL) {
    return NextResponse.json(globalCache.data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "X-Cache": "HIT",
      },
    });
  }

  try {
    // 1. Pega HTML do diretório diário
    const pageRes = await fetch(INPE_DIARIO_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 600 },
    });

    if (!pageRes.ok) {
      throw new Error(`Falha ao obter diretório do INPE: ${pageRes.statusText}`);
    }

    const html = await pageRes.text();
    const $ = cheerio.load(html);
    const csvFiles: string[] = [];

    // Encontra todos os links de CSVs de focos diários no Brasil
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (href && href.endsWith(".csv") && href.includes("focos_diario_br")) {
        csvFiles.push(href);
      }
    });

    if (!csvFiles.length) {
      throw new Error("Nenhum arquivo CSV de focos diários encontrado.");
    }

    // Ordena de forma decrescente para pegar o mais recente
    const latestCsvFile = csvFiles.sort().reverse()[0];
    const csvUrl = `${INPE_DIARIO_URL}${latestCsvFile}`;

    // 2. Baixa o arquivo CSV
    const csvRes = await fetch(csvUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      next: { revalidate: 600 },
    });

    if (!csvRes.ok) {
      throw new Error(`Falha ao baixar arquivo CSV (${latestCsvFile}): ${csvRes.statusText}`);
    }

    // Decodifica usando UTF-8 para manter acentos e cedilhas
    const arrayBuffer = await csvRes.arrayBuffer();
    const csvText = new TextDecoder("utf-8").decode(arrayBuffer);

    // 3. Converte CSV para JSON com papaparse
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const points = parsed.data
      .map((row: any) => {
        const lat = Number(row.lat);
        const lon = Number(row.lon);
        const risco = row.risco_fogo ? Number(row.risco_fogo) : null;
        const frp = row.frp ? Number(row.frp) : null;

        return {
          id: row.id || "",
          lat: isNaN(lat) ? 0 : lat,
          lon: isNaN(lon) ? 0 : lon,
          data_hora_gmt: row.data_hora_gmt || "",
          satelite: row.satelite || "",
          municipio: fixEncoding(row.municipio || ""),
          estado: fixEncoding(row.estado || ""),
          risco_fogo: isNaN(risco as number) ? null : risco,
          bioma: fixEncoding(row.bioma || ""),
          frp: isNaN(frp as number) ? null : frp,
        };
      })
      .filter((p: any) => p.id && p.lat !== 0 && p.lon !== 0);

    const responseBody = {
      success: true,
      count: points.length,
      file: latestCsvFile,
      lastUpdated: new Date().toISOString(),
      points,
    };

    // Atualiza cache em memória
    globalCache = {
      data: responseBody,
      timestamp: now,
    };

    return NextResponse.json(responseBody, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "X-Cache": "MISS",
      },
    });
  } catch (error: any) {
    console.error("Erro ao processar dados de queimadas do INPE:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro desconhecido ao obter dados de queimadas",
      },
      { status: 500 }
    );
  }
}
