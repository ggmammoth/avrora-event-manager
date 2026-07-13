import { supabase, run } from './supabase.js';

export const getProfile = (id) => run(supabase.from('profiles').select('*').eq('id', id).single());
export const getCurrentUserProfile = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) return null;
  return run(supabase.from('profiles').select('*').eq('id', user.id).maybeSingle());
};
export const updateProfile = (id, values) => run(supabase.from('profiles').update(values).eq('id', id).select().single());
