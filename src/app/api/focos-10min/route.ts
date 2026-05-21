import { NextResponse } from "next/server";
import Papa from "papaparse";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

const INPE_10MIN_URL =
  "https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/10min/";

interface FireHotspot {
  lat: number;
  lon: number;
  data_hora_gmt: string;
  satelite: string;
}

type FileMeta = {
  name: string;
  date: number;
};

let cache: any = null;
const TTL = 5 * 60 * 1000;

/* -------------------- UTILS -------------------- */

function extractDate(file: string): number {
  const match = file.match(/(\d{8})_(\d{4})/);
  if (!match) return 0;

  const date = match[1];
  const time = match[2];

  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6)) - 1;
  const day = Number(date.slice(6, 8));

  const hour = Number(time.slice(0, 2));
  const min = Number(time.slice(2, 4));

  return new Date(year, month, day, hour, min).getTime();
}

async function fileExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* -------------------- MAIN -------------------- */

export async function GET() {
  const now = Date.now();

  // CACHE
  if (cache && now - cache.timestamp < TTL) {
    return NextResponse.json(cache.data, {
      headers: { "X-Cache": "HIT" },
    });
  }

  try {
    /* 1. pega lista do diretório */
    const pageRes = await fetch(INPE_10MIN_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!pageRes.ok) {
      throw new Error("Falha ao acessar INPE 10min");
    }

    const html = await pageRes.text();
    const $ = cheerio.load(html);

    const files: FileMeta[] = [];

    $("a").each((_, el) => {
      const href = $(el).attr("href");

      if (!href) return;

      if (href.includes("focos_10min_") && href.endsWith(".csv")) {
        files.push({
          name: href,
          date: extractDate(href),
        });
      }
    });

    if (!files.length) {
      throw new Error("Nenhum arquivo encontrado no INPE");
    }

    /* 2. ordenar por mais recente */
    files.sort((a, b) => b.date - a.date);

    /* 3. pegar últimos candidatos */
    const candidates = files.slice(0, 5);

    let latestValid: string | null = null;

    for (const file of candidates) {
      const url = `${INPE_10MIN_URL}${file.name}`;

      if (await fileExists(url)) {
        latestValid = file.name;
        break;
      }
    }

    if (!latestValid) {
      throw new Error("Nenhum arquivo válido disponível no INPE");
    }

    const csvUrl = `${INPE_10MIN_URL}${latestValid}`;

    /* 4. baixar CSV */
    const csvRes = await fetch(csvUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!csvRes.ok) {
      throw new Error(`Erro ao baixar CSV: ${latestValid}`);
    }

    const buffer = await csvRes.arrayBuffer();
    const csvText = new TextDecoder("utf-8").decode(buffer);

    // valida CSV vazio
    if (!csvText.includes("lat") || !csvText.includes("lon")) {
      throw new Error("CSV inválido ou vazio");
    }

    /* 5. parse CSV */
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const points: FireHotspot[] = (parsed.data as any[])
      .map((row) => {
        const lat = Number(String(row.lat).trim());
        const lon = Number(String(row.lon).trim());

        return {
          lat: isNaN(lat) ? 0 : lat,
          lon: isNaN(lon) ? 0 : lon,
          data_hora_gmt: row.data || "",
          satelite: row.satelite || "",
        };
      })
      .filter((p) => p.lat !== 0 && p.lon !== 0);

    const response = {
      success: true,
      count: points.length,
      file: latestValid,
      lastUpdated: new Date().toISOString(),
      source: "INPE - 10 minutos",
      points,
    };

    cache = {
      data: response,
      timestamp: now,
    };

    return NextResponse.json(response, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (err: any) {
    console.error("INPE ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}
