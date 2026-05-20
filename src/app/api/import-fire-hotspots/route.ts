import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase environment variables are required.");
  }
  return createClient(url, key);
}

const BASE_URL =
  "https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/10min/";

export async function GET() {
  try {
    const supabase = getSupabase();
    // 1. PEGA HTML DA PASTA
    const page = await fetch(BASE_URL);
    const html = await page.text();

    // 2. PROCURA CSV MAIS RECENTE
    const $ = cheerio.load(html);

    const csvFiles: string[] = [];

    $("a").each((_, el) => {
      const href = $(el).attr("href");

      if (href?.endsWith(".csv")) {
        csvFiles.push(href);
      }
    });

    if (!csvFiles.length) {
      return Response.json(
        {
          error: "Nenhum CSV encontrado",
        },
        { status: 500 }
      );
    }

    // 3. PEGA ÚLTIMO CSV
    const latestCsv = csvFiles.sort().reverse()[0];

    const csvUrl = BASE_URL + latestCsv;

    // 4. BAIXA CSV
    const csvResponse = await fetch(csvUrl);
    const csvText = await csvResponse.text();

    // 5. CONVERTE CSV
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data
      .map((row: any) => ({
        latitude: Number(row.lat),
        longitude: Number(row.lon),
        satellite: row.satelite,
        detected_at: row.data,
      }))
      .filter((r: any) => !isNaN(r.latitude) && !isNaN(r.longitude));

    if (!rows.length) {
      return Response.json(
        {
          error: "CSV vazio",
        },
        { status: 500 }
      );
    }

    // 6. INSERT SUPABASE
    const { error } = await supabase.from("fire_hotspots").upsert(rows, {
      onConflict: "latitude,longitude,detected_at",
    });

    if (error) {
      return Response.json(error, { status: 500 });
    }

    return Response.json({
      success: true,
      imported: rows.length,
      file: latestCsv,
    });
  } catch (err: any) {
    return Response.json(
      {
        error: err.message,
      },
      { status: 500 }
    );
  }
}
