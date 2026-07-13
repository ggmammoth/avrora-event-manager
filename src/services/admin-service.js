import { supabase, run } from './supabase.js';

export async function getDashboardStats() {
  const queries = {
    users: supabase.from('profiles').select('id', { count: 'exact', head: true }),
    events: supabase.from('events').select('id', { count: 'exact', head: true }),
    registrations: supabase.from('registrations').select('id', { count: 'exact', head: true }),
    comments: supabase.from('comments').select('id', { count: 'exact', head: true }),
    activeEvents: supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_active', true),
    pendingRegistrations: supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  };
  const entries = await Promise.all(Object.entries(queries).map(async ([key, query]) => {
    const result = await run(query);
    return [key, result.count ?? 0];
  }));
  return Object.fromEntries(entries);
}

export const getAllRegistrations = () => run(supabase.rpc('get_admin_registrations'));
export const updateRegistrationStatus = (id, status) => run(supabase.from('registrations').update({ status }).eq('id', id).select().single());
export const deleteRegistration = (id) => run(supabase.from('registrations').delete().eq('id', id));
export const getUsers = () => run(supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200));
export const updateUserRole = (id, role) => run(supabase.rpc('admin_set_user_role', { target_user_id: id, new_role: role }));
