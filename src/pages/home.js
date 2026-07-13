import { initPage } from './common.js';
import { getFeaturedEvents } from '../services/event-service.js';
import { createEventCard } from '../components/event-card.js';
import { showLoading, showState } from '../components/loading.js';
import { isSupabaseConfigured } from '../services/supabase.js';

await initPage();
const grid = document.querySelector('#featuredEvents');
if (!isSupabaseConfigured) {
  showState(grid, 'Connect Supabase to load events', 'Setup instructions are included in SETUP.md.', 'bi-database-gear');
} else {
  showLoading(grid, 'Summoning upcoming events…');
  try {
    const events = await getFeaturedEvents(); grid.replaceChildren();
    if (!events.length) showState(grid, 'No upcoming events', 'New challenges will appear here soon.');
    else events.forEach((event) => grid.append(createEventCard(event)));
  } catch (error) { showState(grid, 'Events could not be loaded', error.message, 'bi-exclamation-triangle'); }
}
