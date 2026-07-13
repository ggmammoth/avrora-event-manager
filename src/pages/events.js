import { initPage } from './common.js';
import { getEvents } from '../services/event-service.js';
import { getCategories } from '../services/category-service.js';
import { createEventCard } from '../components/event-card.js';
import { showAlert } from '../components/alerts.js';
import { showLoading, showState } from '../components/loading.js';
import { isSupabaseConfigured } from '../services/supabase.js';

await initPage();
const grid = document.querySelector('#eventsGrid');
const form = document.querySelector('#eventFilters');
const categorySelect = document.querySelector('#categoryFilter');

async function loadEvents() {
  showLoading(grid, 'Searching the realm…');
  try {
    const data = new FormData(form);
    const events = await getEvents({ search: data.get('search').trim(), category: data.get('category') });
    grid.replaceChildren();
    if (!events.length) showState(grid, 'No events found', 'Try a different title or category.', 'bi-search');
    else events.forEach((event) => grid.append(createEventCard(event)));
  } catch (error) { showAlert(document.querySelector('[data-page-alert]'), error.message); showState(grid, 'Unable to load events', 'Check the configuration and try again.', 'bi-exclamation-triangle'); }
}

if (isSupabaseConfigured) {
  try {
    const categories = await getCategories();
    categories.forEach((category) => categorySelect.add(new Option(category.name, category.id)));
    const params = new URLSearchParams(location.search);
    form.elements.search.value = params.get('search') || '';
    categorySelect.value = params.get('category') || '';
    await loadEvents();
  } catch (error) { showAlert(document.querySelector('[data-page-alert]'), error.message); }
} else showState(grid, 'Supabase configuration required', 'Add your credentials to .env to browse events.', 'bi-database-gear');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const params = new URLSearchParams();
  if (form.elements.search.value.trim()) params.set('search', form.elements.search.value.trim());
  if (categorySelect.value) params.set('category', categorySelect.value);
  history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}`);
  await loadEvents();
});
