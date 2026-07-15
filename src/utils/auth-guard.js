import { getSession } from '../services/auth-service.js';
import { showAlert } from '../components/alerts.js';

export async function requireAuth() {
  try {
    const session = await getSession();
    if (!session) {
      const next = encodeURIComponent(location.pathname + location.search + location.hash);
      location.replace(`/login.html?next=${next}`);
      return null;
    }
    return session;
  } catch (error) {
    showAlert(document.querySelector('[data-page-alert]'), error.message);
    return null;
  }
}
