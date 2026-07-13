import { supabase, run } from './supabase.js';

export const getComments = (eventId) => run(supabase.from('comments').select('*, profiles(id, full_name, avatar_url, role)').eq('event_id', eventId).order('created_at', { ascending: false }));
export const addComment = (values) => run(supabase.from('comments').insert(values).select().single());
export const deleteComment = (id) => run(supabase.from('comments').delete().eq('id', id));
