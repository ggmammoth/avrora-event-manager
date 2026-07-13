import { initPage } from './common.js';
import { requireAuth } from '../utils/auth-guard.js';
import { getProfile, updateProfile } from '../services/profile-service.js';
import { uploadAvatar } from '../services/storage-service.js';
import { logout } from '../services/auth-service.js';
import { showAlert, clearAlert } from '../components/alerts.js';
import { validateImage, setButtonLoading } from '../utils/validators.js';
import { DEFAULT_AVATAR } from '../utils/constants.js';

await initPage();
const session = await requireAuth();
if (session) {
  const content = document.querySelector('#profileContent'); const form = document.querySelector('#profileForm'); const alertBox = document.querySelector('[data-page-alert]'); let profile;
  try {
    profile = await getProfile(session.user.id);
    document.querySelector('#avatarPreview').src = profile.avatar_url || DEFAULT_AVATAR;
    document.querySelector('#profileName').textContent = profile.full_name || 'Adventurer';
    document.querySelector('#profileRole').textContent = profile.role;
    form.fullName.value = profile.full_name || ''; document.querySelector('#email').value = session.user.email; content.classList.remove('d-none');
  } catch (error) { showAlert(alertBox, error.message); }
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); clearAlert(alertBox); const name = form.fullName.value.trim(); const file = form.avatar.files[0];
    if (name.length < 2) return showAlert(alertBox, 'Full name must contain at least 2 characters.');
    const fileError = validateImage(file); if (fileError) return showAlert(alertBox, fileError);
    const button = form.querySelector('button[type="submit"]'); setButtonLoading(button, true, 'Saving…');
    try {
      let avatarUrl = profile.avatar_url; if (file) avatarUrl = await uploadAvatar(session.user.id, file);
      profile = await updateProfile(session.user.id, { full_name: name, avatar_url: avatarUrl });
      document.querySelector('#avatarPreview').src = avatarUrl || DEFAULT_AVATAR; document.querySelector('#profileName').textContent = name; form.avatar.value = '';
      showAlert(alertBox, 'Profile updated successfully.', 'success');
    } catch (error) { showAlert(alertBox, error.message); } finally { setButtonLoading(button, false); }
  });
  document.querySelector('#logoutButton').addEventListener('click', async () => { await logout(); location.replace('/index.html'); });
}
