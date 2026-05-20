import type { User } from '@supabase/supabase-js';
import { getSupabaseClient, type UserProfile } from './supabase';

export type ProfileFormInput = {
  full_name: string;
  role: string;
  bio: string;
  region: string;
  image_url: string;
};

function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes('email not confirmed')) {
    return 'Confirme seu email antes de entrar.';
  }

  if (normalized.includes('email rate limit exceeded')) {
    return 'Limite de envio de email excedido. Aguarde alguns minutos antes de tentar novamente.';
  }

  if (normalized.includes('for security purposes')) {
    return 'Aguarde alguns segundos antes de tentar novamente.';
  }

  if (normalized.includes('invalid login credentials')) {
    return 'Email ou senha inválidos.';
  }

  if (normalized.includes('user already registered') || normalized.includes('already registered')) {
    return 'Este email já está cadastrado.';
  }

  return message;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(getAuthErrorMessage(error.message));
  }
}

export async function signUp(email: string, password: string, fullName: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    throw new Error(getAuthErrorMessage(error.message));
  }

  if (data.user && data.session) {
    await saveProfile(data.user.id, {
      full_name: fullName,
      role: 'Agente comunitário',
      bio: '',
      region: 'AM',
      image_url: '',
    }, data.user.email ?? email);
  }

  return data;
}

export async function resendConfirmation(email: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    throw new Error(getAuthErrorMessage(error.message));
  }
}

export async function signOut() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as UserProfile | null;
}

export async function saveProfile(userId: string, input: ProfileFormInput, email?: string | null): Promise<UserProfile> {
  const supabase = getSupabaseClient();
  const profile = {
    id: userId,
    email: email ?? null,
    full_name: input.full_name.trim() || 'Usuário Ipixuna',
    role: input.role.trim() || null,
    bio: input.bio.trim() || null,
    region: input.region.trim() || null,
    image_url: input.image_url.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as UserProfile;
}

export async function uploadProfileImage(userId: string, file: File): Promise<string> {
  const supabase = getSupabaseClient();
  const extension = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${Date.now()}.${extension.toLowerCase()}`;

  const { error } = await supabase.storage
    .from('profile-images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from('profile-images').getPublicUrl(path);
  return data.publicUrl;
}
