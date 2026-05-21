// app/api/verify-team-location/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Variáveis do Supabase não definidas");
      return NextResponse.json(
        { success: false, error: "Erro de configuração do servidor" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { locationId, password } = await req.json();

    const { data, error } = await supabase
      .from("locations")
      .select("group_password_hash")
      .eq("id", locationId)
      .single();

    if (error || !data?.group_password_hash) {
      return NextResponse.json(
        { success: false, error: "Local não encontrado ou sem senha" },
        { status: 404 }
      );
    }

    const encoder = new TextEncoder();
    const inputHash = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(password)
    );
    const inputHashHex = Array.from(new Uint8Array(inputHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const isValid = inputHashHex === data.group_password_hash;
    return NextResponse.json({ success: isValid });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
