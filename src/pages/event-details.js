import { initPage } from './common.js';
import { getEvent, getEventRegistrationCount } from '../services/event-service.js';
import { getSession } from '../services/auth-service.js';
import { getProfile } from '../services/profile-service.js';
import { getRegistrationForEvent, createRegistration } from '../services/registration-service.js';
import { getComments, addComment, deleteComment } from '../services/comment-service.js';
import { showAlert, clearAlert } from '../components/alerts.js';
import { showLoading, showState } from '../components/loading.js';
import { CHARACTER_CLASSES, DEFAULT_AVATAR, DEFAULT_EVENT_IMAGE } from '../utils/constants.js';
import { formatDate, statusBadge } from '../utils/formatters.js';
import { validateCharacterName, setButtonLoading } from '../utils/validators.js';
import { isSupabaseConfigured } from '../services/supabase.js';

await initPage();
const id = Number(new URLSearchParams(location.search).get('id'));
const details = document.querySelector('#eventDetails'); const actions = document.querySelector('#eventActions');
let eventData; let session; let profile;

function registrationCount(event) { return Number(event.registration_count ?? event.registrations?.[0]?.count ?? 0); }

function renderDetails(event) {
  details.replaceChildren(); document.title = `${event.title} | AvroraMU`;
  const row = document.createElement('div'); row.className = 'row g-5 align-items-start';
  const media = document.createElement('div'); media.className = 'col-lg-7'; const image = document.createElement('img'); image.className = 'event-hero-image'; image.src = event.image_url || DEFAULT_EVENT_IMAGE; image.alt = `${event.title} event`; image.addEventListener('error', () => { image.src = DEFAULT_EVENT_IMAGE; }, { once: true }); media.append(image);
  const info = document.createElement('div'); info.className = 'col-lg-5';
  const category = document.createElement('span'); category.className = 'badge category-badge mb-3'; category.textContent = event.categories?.name || 'Uncategorized';
  const title = document.createElement('h1'); title.textContent = event.title; const date = document.createElement('p'); date.className = 'lead text-gold'; date.innerHTML = `<i class="bi bi-calendar-event me-2"></i>${formatDate(event.event_date)}`;
  const location = document.createElement('p'); location.className = 'text-secondary'; location.innerHTML = '<i class="bi bi-geo-alt me-2"></i>'; location.append(document.createTextNode(event.location || 'Online'));
  const description = document.createElement('p'); description.className = 'text-secondary preserve-lines'; description.textContent = event.description;
  const registered = registrationCount(event); const maximum = event.max_participants; const participants = document.createElement('div'); participants.className = 'mt-4';
  const label = document.createElement('div'); label.className = 'd-flex justify-content-between small mb-2'; const labelText = document.createElement('span'); labelText.textContent = 'Registered participants'; const amount = document.createElement('span'); amount.textContent = maximum ? `${registered} / ${maximum}` : `${registered} / Unlimited`; label.append(labelText, amount); participants.append(label);
  if (maximum) { const progress = document.createElement('div'); progress.className = 'progress'; const bar = document.createElement('div'); bar.className = 'progress-bar'; bar.style.width = `${Math.min(100, (registered / maximum) * 100)}%`; bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuenow', registered); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', maximum); progress.append(bar); participants.append(progress); }
  info.append(category, title, date, location, description, participants);
  if (event.rules_file_url) { const rules = document.createElement('a'); rules.className = 'btn btn-outline-gold mt-4'; rules.href = event.rules_file_url; rules.target = '_blank'; rules.rel = 'noopener'; rules.setAttribute('download', ''); rules.innerHTML = '<i class="bi bi-file-earmark-pdf me-2"></i>Download event rules'; info.append(rules); }
  row.append(media, info); details.append(row);
}

async function loadRegistration() {
  const form = document.querySelector('#registrationForm'); const status = document.querySelector('#registrationStatus');
  CHARACTER_CLASSES.forEach((name) => form.characterClass.add(new Option(name, name)));
  if (!session) { form.classList.add('d-none'); status.innerHTML = '<p class="text-secondary">Please <a href="/login.html">login</a> to register.</p>'; return; }
  const existing = await getRegistrationForEvent(id, session.user.id);
  if (existing) { form.classList.add('d-none'); const badge = document.createElement('span'); badge.className = statusBadge(existing.status); badge.textContent = existing.status; const text = document.createElement('p'); text.append('You registered ', badge, ` as ${existing.character_name} (${existing.character_class}).`); status.append(text); return; }
  const count = registrationCount(eventData); const expired = new Date(eventData.event_date) <= new Date(); const full = eventData.max_participants && count >= eventData.max_participants;
  if (expired || full || !eventData.is_active) { form.classList.add('d-none'); status.textContent = expired ? 'Registration has closed because this event has started.' : full ? 'This event is full.' : 'Registration is currently unavailable.'; return; }
  form.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault(); const alertBox = document.querySelector('#registrationAlert'); clearAlert(alertBox); const name = form.characterName.value.trim(); const characterClass = form.characterClass.value; const validationError = validateCharacterName(name);
    if (validationError) return showAlert(alertBox, validationError); if (!CHARACTER_CLASSES.includes(characterClass)) return showAlert(alertBox, 'Choose a valid character class.');
    const button = form.querySelector('button[type="submit"]'); setButtonLoading(button, true, 'Registering…');
    try { await createRegistration({ event_id: id, user_id: session.user.id, character_name: name, character_class: characterClass }); showAlert(alertBox, 'Registration submitted for approval.', 'success'); form.classList.add('d-none'); status.textContent = `Pending registration for ${name} (${characterClass}).`; }
    catch (error) { showAlert(alertBox, error.code === '23505' ? 'You are already registered for this event.' : error.message); setButtonLoading(button, false); }
  });
}

async function loadComments() {
  const list = document.querySelector('#commentsList'); showLoading(list, 'Loading comments…');
  try {
    const comments = await getComments(id); list.replaceChildren();
    if (!comments.length) return showState(list, 'No comments yet', 'Be the first to start the conversation.', 'bi-chat');
    comments.forEach((comment) => {
      const article = document.createElement('article'); article.className = 'comment p-3 mb-3'; const header = document.createElement('div'); header.className = 'd-flex align-items-center gap-2 mb-2';
      const avatar = document.createElement('img'); avatar.className = 'avatar'; avatar.src = comment.profiles?.avatar_url || DEFAULT_AVATAR; avatar.alt = '';
      const meta = document.createElement('div'); const name = document.createElement('strong'); name.textContent = comment.profiles?.full_name || 'AvroraMU player'; const date = document.createElement('div'); date.className = 'small text-secondary'; date.textContent = formatDate(comment.created_at); meta.append(name, date); header.append(avatar, meta);
      if (session && (comment.user_id === session.user.id || profile?.role === 'admin')) { const remove = document.createElement('button'); remove.className = 'btn btn-sm btn-outline-danger ms-auto'; remove.type = 'button'; remove.setAttribute('aria-label', 'Delete comment'); remove.innerHTML = '<i class="bi bi-trash"></i>'; remove.addEventListener('click', async () => { if (!confirm('Delete this comment?')) return; try { await deleteComment(comment.id); await loadComments(); } catch (error) { showAlert(document.querySelector('#commentAlert'), error.message); } }); header.append(remove); }
      const content = document.createElement('p'); content.className = 'mb-0 preserve-lines'; content.textContent = comment.content; article.append(header, content); list.append(article);
    });
  } catch (error) { showState(list, 'Comments could not be loaded', error.message, 'bi-exclamation-triangle'); }
}

function setupCommentForm() {
  const form = document.querySelector('#commentForm');
  if (!session) { form.innerHTML = '<p class="text-secondary">Please <a href="/login.html">login</a> to add a comment.</p>'; return; }
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); const alertBox = document.querySelector('#commentAlert'); clearAlert(alertBox); const content = form.content.value.trim(); if (!content) return showAlert(alertBox, 'Comment cannot be empty.');
    const button = form.querySelector('button[type="submit"]'); setButtonLoading(button, true, 'Posting…');
    try { await addComment({ event_id: id, user_id: session.user.id, content }); form.reset(); showAlert(alertBox, 'Comment posted.', 'success'); await loadComments(); }
    catch (error) { showAlert(alertBox, error.message); } finally { setButtonLoading(button, false); }
  });
}

if (!id || !Number.isInteger(id) || id < 1) showState(details, 'Invalid event', 'Open an event from the events page.', 'bi-exclamation-triangle');
else if (!isSupabaseConfigured) showState(details, 'Supabase configuration required', 'Add your project credentials to .env.', 'bi-database-gear');
else {
  showLoading(details, 'Loading event details…');
  try {
    let exactCount;
    [eventData, session, exactCount] = await Promise.all([getEvent(id), getSession(), getEventRegistrationCount(id)]);
    eventData.registration_count = exactCount;
    if (session) profile = await getProfile(session.user.id);
    renderDetails(eventData); actions.classList.remove('d-none'); await Promise.all([loadRegistration(), loadComments()]); setupCommentForm();
  } catch (error) { showAlert(document.querySelector('[data-page-alert]'), error.message); showState(details, 'Event not found', 'It may have been removed or is no longer available.', 'bi-calendar-x'); }
}
