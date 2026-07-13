import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import '../styles/styles.css';
import { renderNavbar, watchNavbarAuth } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { isSupabaseConfigured } from '../services/supabase.js';
import { showAlert } from '../components/alerts.js';

export async function initPage() {
  renderFooter();
  await renderNavbar();
  watchNavbarAuth();
  if (!isSupabaseConfigured) {
    showAlert(document.querySelector('[data-config-alert]'), 'Supabase is not configured. Create a .env file from .env.example to enable live data and authentication.', 'warning');
  }
}
