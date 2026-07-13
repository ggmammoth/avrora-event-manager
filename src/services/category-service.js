import { supabase, run } from './supabase.js';

export const getCategories = () => run(supabase.from('categories').select('*').order('name'));
export const createCategory = (values) => run(supabase.from('categories').insert(values).select().single());
export const updateCategory = (id, values) => run(supabase.from('categories').update(values).eq('id', id).select().single());
export const deleteCategory = (id) => run(supabase.from('categories').delete().eq('id', id));
