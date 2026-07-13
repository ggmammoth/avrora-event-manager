import { Modal } from 'bootstrap';
import { initPage } from './common.js';
import { requireAdmin } from '../utils/admin-guard.js';
import {
  deleteRegistration,
  getAllRegistrations,
  getDashboardStats,
  getUsers,
  updateRegistrationStatus,
  updateUserRole,
} from '../services/admin-service.js';
import { createEvent, deleteEvent, getEvents, updateEvent } from '../services/event-service.js';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../services/category-service.js';
import { uploadEventImage, uploadRulesPdf } from '../services/storage-service.js';
import { clearAlert, showAlert } from '../components/alerts.js';
import { formatDate, formatDateInput } from '../utils/formatters.js';
import { DEFAULT_AVATAR, REGISTRATION_STATUSES, USER_ROLES } from '../utils/constants.js';
import { setButtonLoading, validateEventImage, validatePdf } from '../utils/validators.js';

await initPage();
const auth = await requireAdmin();

if (auth) {
  const pageAlert = document.querySelector('[data-page-alert]');
  const content = document.querySelector('#adminContent');
  const statsGrid = document.querySelector('#statsGrid');
  const eventsTable = document.querySelector('#eventsTable');
  const categoriesTable = document.querySelector('#categoriesTable');
  const registrationsTable = document.querySelector('#registrationsTable');
  const usersTable = document.querySelector('#usersTable');
  const eventForm = document.querySelector('#eventForm');
  const categoryForm = document.querySelector('#categoryForm');
  const eventModal = new Modal(document.querySelector('#eventModal'));
  const categoryModal = new Modal(document.querySelector('#categoryModal'));
  let events = [];
  let categories = [];

  content.classList.remove('d-none');

  function showSuccess(message) {
    showAlert(pageAlert, message, 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function actionButton(label, icon, style = 'outline-light') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn btn-sm btn-${style}`;
    button.innerHTML = `<i class="bi bi-${icon} me-1" aria-hidden="true"></i>${label}`;
    return button;
  }

  function renderTableState(tbody, colspan, message, loading = false) {
    tbody.replaceChildren();
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = colspan;
    cell.className = 'text-center text-secondary py-4';
    if (loading) {
      const spinner = document.createElement('span');
      spinner.className = 'spinner-border spinner-border-sm text-gold me-2';
      spinner.setAttribute('aria-hidden', 'true');
      cell.append(spinner);
    }
    cell.append(document.createTextNode(message));
    row.append(cell);
    tbody.append(row);
  }

  function friendlyError(error, context = '') {
    if (error?.code === '23505') return `${context} already exists.`;
    if (error?.code === '23503') return 'This category cannot be deleted because one or more events use it.';
    return error?.message || 'An unexpected administrator operation error occurred.';
  }

  async function loadStats() {
    statsGrid.replaceChildren();
    for (let index = 0; index < 6; index += 1) {
      const placeholder = document.createElement('div');
      placeholder.className = 'col-6 col-lg-4';
      placeholder.innerHTML = '<div class="card p-4 h-100 text-center"><span class="spinner-border spinner-border-sm text-gold mx-auto" aria-label="Loading statistic"></span></div>';
      statsGrid.append(placeholder);
    }
    try {
      const stats = await getDashboardStats();
      const items = [
        ['Total users', stats.users, 'people'],
        ['Total events', stats.events, 'calendar-event'],
        ['Registrations', stats.registrations, 'ticket-perforated'],
        ['Comments', stats.comments, 'chat-square-text'],
        ['Active events', stats.activeEvents, 'calendar-check'],
        ['Pending entries', stats.pendingRegistrations, 'hourglass-split'],
      ];
      statsGrid.replaceChildren();
      items.forEach(([label, count, icon]) => {
        const column = document.createElement('div');
        column.className = 'col-6 col-lg-4';
        const card = document.createElement('article');
        card.className = 'card stat-card p-3 p-md-4 h-100';
        card.innerHTML = `<i class="bi bi-${icon} text-gold fs-4" aria-hidden="true"></i><div class="stat-number">${Number(count) || 0}</div><div class="text-secondary">${label}</div>`;
        column.append(card);
        statsGrid.append(column);
      });
    } catch (error) {
      statsGrid.replaceChildren();
      const state = document.createElement('div');
      state.className = 'col-12 alert alert-danger';
      state.textContent = `Dashboard statistics could not be loaded: ${error.message}`;
      statsGrid.append(state);
    }
  }

  function populateCategoryOptions(selectedValue = '') {
    const select = eventForm.elements.category_id;
    select.replaceChildren(new Option('Choose category', ''));
    categories.forEach((category) => select.add(new Option(category.name, category.id)));
    select.value = selectedValue;
  }

  function createAssetLink(url, label, icon) {
    const link = document.createElement('a');
    link.className = 'btn btn-sm btn-outline-gold me-1';
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.innerHTML = `<i class="bi bi-${icon} me-1" aria-hidden="true"></i>${label}`;
    return link;
  }

  function renderEvents() {
    eventsTable.replaceChildren();
    if (!events.length) return renderTableState(eventsTable, 6, 'No events have been created.');
    events.forEach((item) => {
      const row = document.createElement('tr');
      const title = document.createElement('td');
      const titleText = document.createElement('strong');
      titleText.textContent = item.title;
      title.append(titleText);
      const date = document.createElement('td');
      date.textContent = formatDate(item.event_date);
      const category = document.createElement('td');
      category.textContent = item.categories?.name || 'Uncategorized';
      const assets = document.createElement('td');
      if (item.image_url) assets.append(createAssetLink(item.image_url, 'Image', 'image'));
      if (item.rules_file_url) assets.append(createAssetLink(item.rules_file_url, 'Rules', 'file-earmark-pdf'));
      if (!item.image_url && !item.rules_file_url) assets.textContent = '—';
      const state = document.createElement('td');
      const stateBadge = document.createElement('span');
      stateBadge.className = `badge text-bg-${item.is_active ? 'success' : 'secondary'}`;
      stateBadge.textContent = item.is_active ? 'active' : 'inactive';
      state.append(stateBadge);
      const actions = document.createElement('td');
      actions.className = 'text-end text-nowrap';
      const toggle = actionButton(item.is_active ? 'Deactivate' : 'Activate', item.is_active ? 'pause-circle' : 'play-circle', 'outline-warning');
      const edit = actionButton('Edit', 'pencil');
      const remove = actionButton('Delete', 'trash', 'outline-danger');
      toggle.classList.add('me-2');
      edit.classList.add('me-2');
      toggle.addEventListener('click', async () => {
        toggle.disabled = true;
        try {
          await updateEvent(item.id, { is_active: !item.is_active });
          await Promise.all([loadEvents(), loadStats()]);
          showSuccess(`Event ${item.is_active ? 'deactivated' : 'activated'} successfully.`);
        } catch (error) {
          showAlert(pageAlert, friendlyError(error));
          toggle.disabled = false;
        }
      });
      edit.addEventListener('click', () => openEvent(item));
      remove.addEventListener('click', async () => {
        if (!confirm(`Delete “${item.title}” and all related registrations and comments?`)) return;
        remove.disabled = true;
        try {
          await deleteEvent(item.id);
          await Promise.all([loadEvents(), loadRegistrations(), loadStats()]);
          showSuccess('Event deleted successfully.');
        } catch (error) {
          showAlert(pageAlert, friendlyError(error));
          remove.disabled = false;
        }
      });
      actions.append(toggle, edit, remove);
      row.append(title, date, category, assets, state, actions);
      eventsTable.append(row);
    });
  }

  async function loadEvents() {
    renderTableState(eventsTable, 6, 'Loading events…', true);
    try {
      events = await getEvents({ includeInactive: true, limit: 200 });
      renderEvents();
    } catch (error) {
      renderTableState(eventsTable, 6, `Events could not be loaded: ${error.message}`);
    }
  }

  function renderCategories() {
    categoriesTable.replaceChildren();
    if (!categories.length) return renderTableState(categoriesTable, 3, 'No categories have been created.');
    categories.forEach((item) => {
      const row = document.createElement('tr');
      const name = document.createElement('td');
      name.textContent = item.name;
      const description = document.createElement('td');
      description.textContent = item.description || '—';
      const actions = document.createElement('td');
      actions.className = 'text-end text-nowrap';
      const edit = actionButton('Edit', 'pencil');
      const remove = actionButton('Delete', 'trash', 'outline-danger');
      edit.classList.add('me-2');
      edit.addEventListener('click', () => openCategory(item));
      remove.addEventListener('click', async () => {
        if (!confirm(`Delete category “${item.name}”?`)) return;
        remove.disabled = true;
        try {
          await deleteCategory(item.id);
          await Promise.all([loadCategories(), loadEvents(), loadStats()]);
          showSuccess('Category deleted successfully.');
        } catch (error) {
          showAlert(pageAlert, friendlyError(error));
          remove.disabled = false;
        }
      });
      actions.append(edit, remove);
      row.append(name, description, actions);
      categoriesTable.append(row);
    });
  }

  async function loadCategories() {
    renderTableState(categoriesTable, 3, 'Loading categories…', true);
    try {
      categories = await getCategories();
      populateCategoryOptions(eventForm.elements.category_id.value);
      renderCategories();
    } catch (error) {
      renderTableState(categoriesTable, 3, `Categories could not be loaded: ${error.message}`);
    }
  }

  async function loadRegistrations() {
    renderTableState(registrationsTable, 6, 'Loading registrations…', true);
    try {
      const registrations = await getAllRegistrations();
      registrationsTable.replaceChildren();
      if (!registrations.length) return renderTableState(registrationsTable, 6, 'No registrations yet.');
      registrations.forEach((item) => {
        const row = document.createElement('tr');
        const player = document.createElement('td');
        const playerName = document.createElement('div');
        playerName.textContent = item.player_full_name || 'Unknown player';
        const email = document.createElement('small');
        email.className = 'text-secondary';
        email.textContent = item.player_email || 'Email unavailable';
        player.append(playerName, email);
        const event = document.createElement('td');
        event.textContent = item.event_title || 'Deleted event';
        const character = document.createElement('td');
        character.append(document.createTextNode(item.character_name));
        const characterClass = document.createElement('small');
        characterClass.className = 'd-block text-secondary';
        characterClass.textContent = item.character_class;
        character.append(characterClass);
        const registered = document.createElement('td');
        registered.textContent = formatDate(item.created_at);
        const status = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `badge text-bg-${item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'} mb-2`;
        badge.textContent = item.status;
        const select = document.createElement('select');
        select.className = 'form-select form-select-sm';
        select.setAttribute('aria-label', `Status for ${item.character_name}`);
        REGISTRATION_STATUSES.forEach((value) => select.add(new Option(value, value)));
        select.value = item.status;
        select.addEventListener('change', async () => {
          const oldStatus = item.status;
          select.disabled = true;
          try {
            await updateRegistrationStatus(item.registration_id, select.value);
            await Promise.all([loadRegistrations(), loadStats()]);
            showSuccess('Registration status updated.');
          } catch (error) {
            select.value = oldStatus;
            select.disabled = false;
            showAlert(pageAlert, friendlyError(error));
          }
        });
        status.append(badge, select);
        const actions = document.createElement('td');
        actions.className = 'text-end';
        const remove = actionButton('Delete', 'trash', 'outline-danger');
        remove.addEventListener('click', async () => {
          if (!confirm(`Delete the registration for ${item.character_name}?`)) return;
          remove.disabled = true;
          try {
            await deleteRegistration(item.registration_id);
            await Promise.all([loadRegistrations(), loadStats()]);
            showSuccess('Registration deleted successfully.');
          } catch (error) {
            showAlert(pageAlert, friendlyError(error));
            remove.disabled = false;
          }
        });
        actions.append(remove);
        row.append(player, event, character, registered, status, actions);
        registrationsTable.append(row);
      });
    } catch (error) {
      renderTableState(registrationsTable, 6, `Registrations could not be loaded: ${error.message}`);
    }
  }

  async function loadUsers() {
    renderTableState(usersTable, 3, 'Loading users…', true);
    try {
      const users = await getUsers();
      usersTable.replaceChildren();
      if (!users.length) return renderTableState(usersTable, 3, 'No user profiles found.');
      users.forEach((item) => {
        const row = document.createElement('tr');
        const userCell = document.createElement('td');
        const userWrap = document.createElement('div');
        userWrap.className = 'd-flex align-items-center gap-2';
        const avatar = document.createElement('img');
        avatar.className = 'avatar';
        avatar.src = item.avatar_url || DEFAULT_AVATAR;
        avatar.alt = '';
        avatar.addEventListener('error', () => { avatar.src = DEFAULT_AVATAR; }, { once: true });
        const name = document.createElement('span');
        name.textContent = item.full_name || 'Unnamed user';
        userWrap.append(avatar, name);
        if (item.id === auth.session.user.id) {
          const you = document.createElement('span');
          you.className = 'badge category-badge';
          you.textContent = 'you';
          userWrap.append(you);
        }
        userCell.append(userWrap);
        const joined = document.createElement('td');
        joined.textContent = formatDate(item.created_at);
        const role = document.createElement('td');
        const roleWrap = document.createElement('div');
        roleWrap.className = 'd-flex align-items-center gap-2';
        const select = document.createElement('select');
        select.className = 'form-select form-select-sm admin-role-select';
        select.setAttribute('aria-label', `Role for ${item.full_name || 'user'}`);
        USER_ROLES.forEach((value) => select.add(new Option(value, value)));
        select.value = item.role;
        if (item.id === auth.session.user.id) {
          select.disabled = true;
          select.title = 'Your own administrator role is protected.';
          const protectedBadge = document.createElement('span');
          protectedBadge.className = 'badge text-bg-warning';
          protectedBadge.textContent = 'protected';
          roleWrap.append(select, protectedBadge);
        } else {
          select.addEventListener('change', async () => {
            const oldRole = item.role;
            const newRole = select.value;
            if (!confirm(`Change ${item.full_name || 'this user'} from ${oldRole} to ${newRole}?`)) {
              select.value = oldRole;
              return;
            }
            select.disabled = true;
            try {
              await updateUserRole(item.id, newRole);
              await loadUsers();
              showSuccess('User role updated successfully.');
            } catch (error) {
              select.value = oldRole;
              select.disabled = false;
              showAlert(pageAlert, friendlyError(error));
            }
          });
          roleWrap.append(select);
        }
        role.append(roleWrap);
        row.append(userCell, joined, role);
        usersTable.append(row);
      });
    } catch (error) {
      renderTableState(usersTable, 3, `Users could not be loaded: ${error.message}`);
    }
  }

  function renderExistingAssets(item) {
    const wrapper = document.querySelector('#existingAssets');
    const links = document.querySelector('#existingAssetLinks');
    links.replaceChildren();
    if (item?.image_url) links.append(createAssetLink(item.image_url, 'Image', 'image'));
    if (item?.rules_file_url) links.append(createAssetLink(item.rules_file_url, 'Rules', 'file-earmark-pdf'));
    wrapper.classList.toggle('d-none', !links.childElementCount);
  }

  function openEvent(item = null) {
    eventForm.reset();
    clearAlert(document.querySelector('#eventFormAlert'));
    eventForm.elements.id.value = item?.id || '';
    document.querySelector('#eventModalTitle').textContent = item ? 'Edit event' : 'Create event';
    populateCategoryOptions(item?.category_id ? String(item.category_id) : '');
    if (item) {
      ['title', 'short_description', 'description', 'location', 'max_participants'].forEach((field) => {
        eventForm.elements[field].value = item[field] ?? '';
      });
      eventForm.elements.event_date.value = formatDateInput(item.event_date);
      eventForm.elements.is_active.checked = item.is_active;
    } else {
      eventForm.elements.is_active.checked = true;
    }
    renderExistingAssets(item);
    eventModal.show();
  }

  function openCategory(item = null) {
    categoryForm.reset();
    clearAlert(document.querySelector('#categoryFormAlert'));
    categoryForm.elements.id.value = item?.id || '';
    categoryForm.elements.name.value = item?.name || '';
    categoryForm.elements.description.value = item?.description || '';
    document.querySelector('#categoryModalTitle').textContent = item ? 'Edit category' : 'Create category';
    categoryModal.show();
  }

  document.querySelector('#refreshDashboardButton').addEventListener('click', loadStats);
  document.querySelector('#newEventButton').addEventListener('click', () => openEvent());
  document.querySelector('#newCategoryButton').addEventListener('click', () => openCategory());

  eventForm.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    const alertBox = document.querySelector('#eventFormAlert');
    clearAlert(alertBox);
    const data = new FormData(eventForm);
    const id = String(data.get('id') || '');
    const image = data.get('image');
    const rules = data.get('rules');
    const imageError = image?.size ? validateEventImage(image) : '';
    const pdfError = rules?.size ? validatePdf(rules) : '';
    if (imageError || pdfError) return showAlert(alertBox, imageError || pdfError);
    const title = String(data.get('title') || '').trim();
    const description = String(data.get('description') || '').trim();
    const categoryId = Number(data.get('category_id'));
    const eventDate = new Date(String(data.get('event_date') || ''));
    const maximum = Number(data.get('max_participants'));
    if (title.length < 2 || !description || !categoryId || Number.isNaN(eventDate.getTime())) return showAlert(alertBox, 'Complete all required event fields.');
    if (!Number.isInteger(maximum) || maximum <= 0) return showAlert(alertBox, 'Maximum participants must be a positive whole number.');
    if (!id && eventDate <= new Date()) return showAlert(alertBox, 'A new event must have a future date and time.');
    const button = eventForm.querySelector('button[type="submit"]');
    setButtonLoading(button, true, 'Saving…');
    try {
      const existing = events.find((item) => String(item.id) === id);
      let imageUrl = existing?.image_url || null;
      let rulesUrl = existing?.rules_file_url || null;
      if (image?.size) imageUrl = await uploadEventImage(image);
      if (rules?.size) rulesUrl = await uploadRulesPdf(rules);
      const values = {
        title,
        category_id: categoryId,
        short_description: String(data.get('short_description') || '').trim() || null,
        description,
        event_date: eventDate.toISOString(),
        location: String(data.get('location') || '').trim() || null,
        max_participants: maximum,
        is_active: data.get('is_active') === 'on',
        image_url: imageUrl,
        rules_file_url: rulesUrl,
      };
      if (id) await updateEvent(id, values);
      else await createEvent({ ...values, created_by: auth.session.user.id });
      eventModal.hide();
      await Promise.all([loadEvents(), loadStats()]);
      showSuccess(`Event ${id ? 'updated' : 'created'} successfully.`);
    } catch (error) {
      showAlert(alertBox, friendlyError(error, 'Event'));
    } finally {
      setButtonLoading(button, false);
    }
  });

  categoryForm.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    const alertBox = document.querySelector('#categoryFormAlert');
    clearAlert(alertBox);
    const data = new FormData(categoryForm);
    const id = String(data.get('id') || '');
    const name = String(data.get('name') || '').trim();
    const duplicate = categories.some((item) => item.name.toLowerCase() === name.toLowerCase() && String(item.id) !== id);
    if (name.length < 2) return showAlert(alertBox, 'Category name is required and must contain at least two characters.');
    if (duplicate) return showAlert(alertBox, 'A category with this name already exists.');
    const button = categoryForm.querySelector('button[type="submit"]');
    setButtonLoading(button, true, 'Saving…');
    try {
      const values = { name, description: String(data.get('description') || '').trim() || null };
      if (id) await updateCategory(id, values);
      else await createCategory(values);
      categoryModal.hide();
      await Promise.all([loadCategories(), loadEvents(), loadStats()]);
      showSuccess(`Category ${id ? 'updated' : 'created'} successfully.`);
    } catch (error) {
      showAlert(alertBox, friendlyError(error, 'Category'));
    } finally {
      setButtonLoading(button, false);
    }
  });

  renderTableState(eventsTable, 6, 'Loading events…', true);
  renderTableState(categoriesTable, 3, 'Loading categories…', true);
  renderTableState(registrationsTable, 6, 'Loading registrations…', true);
  renderTableState(usersTable, 3, 'Loading users…', true);
  await Promise.all([loadStats(), loadCategories(), loadEvents(), loadRegistrations(), loadUsers()]);
}
