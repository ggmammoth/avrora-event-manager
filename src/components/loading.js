export function showLoading(container, text = 'Loading…') {
  container.replaceChildren();
  const wrapper = document.createElement('div');
  wrapper.className = 'loading-state text-center py-5';
  wrapper.innerHTML = `<div class="spinner-border text-gold" role="status"><span class="visually-hidden">Loading</span></div><p class="mt-3 text-secondary">${text}</p>`;
  container.append(wrapper);
}

export function showState(container, title, message, icon = 'bi-inbox') {
  container.replaceChildren();
  const state = document.createElement('div'); state.className = 'empty-state text-center py-5';
  const iconEl = document.createElement('i'); iconEl.className = `bi ${icon} display-4 text-gold`; iconEl.setAttribute('aria-hidden', 'true');
  const heading = document.createElement('h3'); heading.className = 'h5 mt-3'; heading.textContent = title;
  const paragraph = document.createElement('p'); paragraph.className = 'text-secondary mb-0'; paragraph.textContent = message;
  state.append(iconEl, heading, paragraph); container.append(state);
}
