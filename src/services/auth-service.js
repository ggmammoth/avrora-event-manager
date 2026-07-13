import { supabase, requireConfiguration } from './supabase.js';

export async function getSession() {
  requireConfiguration();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function register({ fullName, email, password }) {
  requireConfiguration();
  const { data, error } = await supabase.auth.signUp({
    email, password, options: { data: { full_name: fullName.trim() } },
  });
  if (error) throw error;
  return data;
}

export async function login(email, password) {
  requireConfiguration();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
