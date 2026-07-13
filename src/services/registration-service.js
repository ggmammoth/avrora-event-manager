import { supabase, run } from './supabase.js';

export const getRegistrationForEvent = (eventId, userId) => run(supabase.from('registrations').select('*').eq('event_id', eventId).eq('user_id', userId).maybeSingle());
export const createRegistration = (values) => run(supabase.from('registrations').insert(values).select().single());
export const getMyRegistrations = (userId) => run(supabase.from('registrations').select('*, events(id, title, event_date, image_url)').eq('user_id', userId).order('created_at', { ascending: false }));
export const cancelRegistration = (id, userId) => run(supabase.from('registrations').delete().eq('id', id).eq('user_id', userId).eq('status', 'pending'));
