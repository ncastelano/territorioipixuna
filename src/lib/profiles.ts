// app/lib/profiles.ts

import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, type UserProfile } from "./supabase";

export type ProfileFormInput = {
  full_name: string;
  role: string;
  bio: string;
  region: string;
  image_url: string;
  username?: string | null; // novo campo
};

function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "Confirme seu email antes de entrar. (Verifique sua caixa de entrada)";
  }
  if (normalized.includes("email rate limit exceeded")) {
    return "Muitas tentativas de envio de email. Aguarde alguns minutos e tente novamente.";
  }
  if (normalized.includes("for security purposes")) {
    return "Por segurança, aguarde alguns segundos antes de tentar novamente.";
  }
  if (normalized.includes("invalid login credentials")) {
    return "Email ou senha inválidos.";
  }
  if (
    normalized.includes("user already registered") ||
    normalized.includes("already registered")
  ) {
    return "Este email já está cadastrado.";
  }
  return message;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(getAuthErrorMessage(error.message));
}

export async function signUp(
  email: string,
  password: string,
  fullName: string
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) throw new Error(getAuthErrorMessage(error.message));

  // Salva o perfil automaticamente (com valores padrão)
  if (data.user && data.session) {
    await saveProfile(
      data.user.id,
      {
        full_name: fullName,
        role: "Agente comunitário",
        bio: "",
        region: "AM", // será atualizado depois via geolocalização na página de perfil
        image_url: "",
        username: null,
      },
      data.user.email ?? email
    );
  } else if (data.user && !data.session) {
    throw new Error(
      "Sua conta foi criada, mas precisa ser confirmada via e-mail. Verifique sua caixa de entrada."
    );
  }
  return data;
}

export async function resendConfirmation(email: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) throw new Error(getAuthErrorMessage(error.message));
}

export async function signOut() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function fetchProfile(
  userId: string
): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as UserProfile | null;
}

export async function saveProfile(
  userId: string,
  input: ProfileFormInput,
  email?: string | null
): Promise<UserProfile> {
  const supabase = getSupabaseClient();
  const profile = {
    id: userId,
    email: email ?? null,
    full_name: input.full_name.trim() || "Usuário Ipixuna",
    role: input.role.trim() || null,
    bio: input.bio.trim() || null,
    region: input.region.trim() || "AM",
    image_url: input.image_url.trim() || null,
    username: input.username?.trim() || null, // salva username (pode ser null)
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "id" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as UserProfile;
}

export async function uploadProfileImage(
  userId: string,
  file: File
): Promise<string> {
  const supabase = getSupabaseClient();
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${extension.toLowerCase()}`;

  const { error } = await supabase.storage
    .from("profile-images")
    .upload(path, file, { cacheControl: "3600", upsert: true });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("profile-images").getPublicUrl(path);
  return data.publicUrl;
}

// Função utilitária para obter estado (UF) a partir de coordenadas
export async function getStateFromCoords(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=region`
    );
    const data = await response.json();
    const region = data?.features?.find((f: any) =>
      f.place_type.includes("region")
    );
    if (region && region.properties?.short_code) {
      // short_code ex: "BR-AM" -> "AM"
      return region.properties.short_code.split("-")[1];
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar estado:", error);
    return null;
  }
}
