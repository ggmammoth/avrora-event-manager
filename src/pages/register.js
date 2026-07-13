import { initPage } from './common.js';
import { getSession, register } from '../services/auth-service.js';
import { showAlert, clearAlert } from '../components/alerts.js';
import { isValidEmail, validatePassword, setButtonLoading } from '../utils/validators.js';
import { isSupabaseConfigured } from '../services/supabase.js';

await initPage();
const form = document.querySelector('#registerForm'); const alertBox = document.querySelector('#authAlert');
if (isSupabaseConfigured) { try { if (await getSession()) location.replace('/profile.html'); } catch { /* handled on submit */ } }
form.addEventListener('submit', async (event) => {
  event.preventDefault(); clearAlert(alertBox);
  const fullName = form.fullName.value.trim(); const email = form.email.value.trim(); const password = form.password.value; const confirmPassword = form.confirmPassword.value;
  if (fullName.length < 2) return showAlert(alertBox, 'Full name must contain at least 2 characters.');
  if (!isValidEmail(email)) return showAlert(alertBox, 'Enter a valid email address.');
  const passwordError = validatePassword(password); if (passwordError) return showAlert(alertBox, passwordError);
  if (password !== confirmPassword) return showAlert(alertBox, 'Passwords do not match.');
  const button = form.querySelector('button[type="submit"]'); setButtonLoading(button, true, 'Creating account…');
  try {
    const { session } = await register({ fullName, email, password });
    if (session) { showAlert(alertBox, 'Account created. Redirecting to your profile…', 'success'); setTimeout(() => location.replace('/profile.html'), 900); }
    else { showAlert(alertBox, 'Account created. Check your email to confirm the account, then log in.', 'success'); form.reset(); setButtonLoading(button, false); }
  } catch (error) { showAlert(alertBox, error.message); setButtonLoading(button, false); }
});
