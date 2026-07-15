import { formatDate, truncate } from '../utils/formatters.js';
import { DEFAULT_EVENT_IMAGE } from '../utils/constants.js';

export function createEventCard(event) {
  const column = document.createElement('div'); column.className = 'col-md-6 col-xl-4';
  const article = document.createElement('article'); article.className = 'card event-card h-100 border-0';
  const image = document.createElement('img'); image.className = 'card-img-top event-card-image'; image.src = event.image_url || DEFAULT_EVENT_IMAGE; image.alt = `${event.title} event`; image.loading = 'lazy';
  image.addEventListener('error', () => { image.src = DEFAULT_EVENT_IMAGE; }, { once: true });
  const body = document.createElement('div'); body.className = 'card-body d-flex flex-column';
  const category = document.createElement('span'); category.className = 'badge category-badge align-self-start mb-3'; category.textContent = event.categories?.name || 'Uncategorized';
  const title = document.createElement('h3'); title.className = 'h5 card-title'; title.textContent = event.title;
  const date = document.createElement('p'); date.className = 'small text-gold mb-2'; date.innerHTML = `<i class="bi bi-calendar-event me-2" aria-hidden="true"></i>${formatDate(event.event_date)}`;
  const description = document.createElement('p'); description.className = 'card-text text-secondary flex-grow-1'; description.textContent = truncate(event.short_description || event.description);
  const link = document.createElement('a'); link.className = 'btn btn-outline-gold stretched-link'; link.href = `/event-details.html?id=${encodeURIComponent(event.id)}`; link.textContent = 'View details';
  body.append(category, title, date, description, link); article.append(image, body); column.append(article); return column;
}
