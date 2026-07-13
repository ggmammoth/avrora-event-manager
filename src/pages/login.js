import { initPage } from './common.js';
import { getSession, login } from '../services/auth-service.js';
import { getProfile } from '../services/profile-service.js';
import { showAlert, clearAlert } from '../components/alerts.js';
import { isValidEmail, setButtonLoading } from '../utils/validators.js';
import { isSupabaseConfigured } from '../services/supabase.js';

await initPage();
const form = document.querySelector('#loginForm'); const alertBox = document.querySelector('#authAlert');
if (isSupabaseConfigured) {
  try { const session = await getSession(); if (session) location.replace('/profile.html'); } catch { /* form displays errors on submit */ }
}
form.addEventListener('submit', async (event) => {
  event.preventDefault(); clearAlert(alertBox);
  const email = form.email.value.trim(); const password = form.password.value; const button = form.querySelector('button[type="submit"]');
  if (!isValidEmail(email)) return showAlert(alertBox, 'Enter a valid email address.');
  if (!password) return showAlert(alertBox, 'Enter your password.');
  setButtonLoading(button, true, 'Entering…');
  try {
    const { user } = await login(email, password);
    const next = new URLSearchParams(location.search).get('next');
    let destination = next?.startsWith('/') && !next.startsWith('//') ? next : '/profile.html';
    if (!next) { const profile = await getProfile(user.id); if (profile.role === 'admin') destination = '/admin.html'; }
    showAlert(alertBox, 'Login successful. Redirecting…', 'success'); location.replace(destination);
  } catch (error) { showAlert(alertBox, error.message); setButtonLoading(button, false); }
});
