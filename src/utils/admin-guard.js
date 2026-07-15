import { getSession } from '../services/auth-service.js';
import { getCurrentUserProfile as loadCurrentUserProfile } from '../services/profile-service.js';
import { showAlert } from '../components/alerts.js';

const redirectAfterMessage = (url) => window.setTimeout(() => location.replace(url), 1200);

export async function getCurrentUserProfile() {
  return loadCurrentUserProfile();
}

export async function isCurrentUserAdmin() {
  try {
    const profile = await getCurrentUserProfile();
    return profile?.role === 'admin';
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  const alertBox = document.querySelector('[data-page-alert]');
  try {
    const session = await getSession();
    if (!session) {
      showAlert(alertBox, 'Please log in with an administrator account to continue.', 'warning');
      const next = encodeURIComponent(location.pathname + location.search + location.hash);
      redirectAfterMessage(`/login.html?next=${next}`);
      return null;
    }
    const profile = await getCurrentUserProfile();
    if (!profile) {
      showAlert(alertBox, 'Your account profile is missing. Contact the project administrator.');
      redirectAfterMessage('/index.html');
      return null;
    }
    if (profile.role !== 'admin') {
      showAlert(alertBox, 'Access denied. This page is available only to administrators.', 'danger');
      redirectAfterMessage('/index.html');
      return null;
    }
    return { session, profile };
  } catch (error) {
    showAlert(alertBox, `Administrator check failed: ${error.message}`);
    return null;
  }
}
