import { supabase, run } from './supabase.js';

const eventFields = '*, categories(id, name), registrations(count)';

export function getEvents({ search = '', category = '', includeInactive = false, limit = 100 } = {}) {
  let query = supabase.from('events').select(eventFields).order('event_date').limit(limit);
  if (!includeInactive) query = query.eq('is_active', true);
  if (search) query = query.ilike('title', `%${search}%`);
  if (category) query = query.eq('category_id', category);
  return run(query);
}

export const getFeaturedEvents = () => run(supabase.from('events').select(eventFields).eq('is_active', true).gte('event_date', new Date().toISOString()).order('event_date').limit(3));
export const getEvent = (id) => run(supabase.from('events').select(eventFields).eq('id', id).single());
export const getEventRegistrationCount = (id) => run(supabase.rpc('get_event_registration_count', { target_event_id: id }));
export const createEvent = (values) => run(supabase.from('events').insert(values).select().single());
export const updateEvent = (id, values) => run(supabase.from('events').update(values).eq('id', id).select().single());
export const deleteEvent = (id) => run(supabase.from('events').delete().eq('id', id));
