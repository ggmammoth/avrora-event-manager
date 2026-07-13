import { initPage } from './common.js';
import { requireAuth } from '../utils/auth-guard.js';
import { getMyRegistrations, cancelRegistration } from '../services/registration-service.js';
import { showAlert } from '../components/alerts.js';
import { showLoading, showState } from '../components/loading.js';
import { formatDate, statusBadge } from '../utils/formatters.js';
import { DEFAULT_EVENT_IMAGE } from '../utils/constants.js';

await initPage(); const session = await requireAuth(); const list = document.querySelector('#registrationsList');
async function load() {
  showLoading(list, 'Loading your registrations…');
  try {
    const registrations = await getMyRegistrations(session.user.id); list.replaceChildren();
    if (!registrations.length) return showState(list, 'No registrations yet', 'Explore events and choose your next challenge.', 'bi-ticket-perforated');
    registrations.forEach((registration) => {
      const col = document.createElement('div'); col.className = 'col-12';
      const card = document.createElement('article'); card.className = 'card p-3';
      const row = document.createElement('div'); row.className = 'row align-items-center g-3';
      const imageCol = document.createElement('div'); imageCol.className = 'col-sm-3 col-lg-2'; const image = document.createElement('img'); image.className = 'img-fluid rounded'; image.src = registration.events?.image_url || DEFAULT_EVENT_IMAGE; image.alt = ''; imageCol.append(image);
      const info = document.createElement('div'); info.className = 'col-sm-6 col-lg-7'; const title = document.createElement('h2'); title.className = 'h5'; const link = document.createElement('a'); link.href = `/event-details.html?id=${registration.events?.id}`; link.textContent = registration.events?.title || 'Deleted event'; title.append(link);
      const meta = document.createElement('p'); meta.className = 'text-secondary mb-1'; meta.textContent = formatDate(registration.events?.event_date);
      const character = document.createElement('p'); character.className = 'mb-0'; character.textContent = `${registration.character_name} · ${registration.character_class}`; info.append(title, meta, character);
      const actions = document.createElement('div'); actions.className = 'col-sm-3 text-sm-end'; const badge = document.createElement('span'); badge.className = statusBadge(registration.status); badge.textContent = registration.status; actions.append(badge);
      if (registration.status === 'pending') { const cancel = document.createElement('button'); cancel.className = 'btn btn-sm btn-outline-danger d-block ms-sm-auto mt-2'; cancel.textContent = 'Cancel'; cancel.addEventListener('click', async () => { if (!confirm('Cancel this pending registration?')) return; try { await cancelRegistration(registration.id, session.user.id); await load(); } catch (error) { showAlert(document.querySelector('[data-page-alert]'), error.message); } }); actions.append(cancel); }
      row.append(imageCol, info, actions); card.append(row); col.append(card); list.append(col);
    });
  } catch (error) { showAlert(document.querySelector('[data-page-alert]'), error.message); showState(list, 'Unable to load registrations', 'Please try again later.', 'bi-exclamation-triangle'); }
}
if (session) await load();
