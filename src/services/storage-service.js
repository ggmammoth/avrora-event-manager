import { supabase, requireConfiguration } from './supabase.js';
import { getUser } from './auth-service.js';

function sanitizeFilename(filename) {
  const parts = filename.toLowerCase().split('.');
  const extension = (parts.pop() || 'bin').replace(/[^a-z0-9]/g, '');
  const basename = parts.join('.').normalize('NFKD').replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'file';
  return `${basename}.${extension}`;
}

function uniquePath(folder, userId, file) {
  return `${folder}/${userId}-${Date.now()}-${sanitizeFilename(file.name)}`;
}

export async function uploadPublicFile(bucket, folder, userId, file) {
  requireConfiguration();
  const path = uniquePath(folder, userId, file);
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600', contentType: file.type, upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  if (!publicData?.publicUrl) throw new Error('Upload completed, but no public URL was returned.');
  return publicData.publicUrl;
}

export const uploadAvatar = (userId, file) => uploadPublicFile('avatars', userId, userId, file);

async function uploadAdminFile(bucket, folder, file) {
  const user = await getUser();
  if (!user) throw new Error('You must be authenticated to upload files.');
  return uploadPublicFile(bucket, folder, user.id, file);
}

export const uploadEventImage = (file) => uploadAdminFile('event-images', 'events', file);
export const uploadRulesPdf = (file) => uploadAdminFile('event-files', 'rules', file);
