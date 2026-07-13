export function renderFooter() {
  const target = document.querySelector('[data-footer]');
  if (!target) return;
  target.innerHTML = `<footer class="site-footer mt-auto"><div class="container py-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2"><p class="mb-0">&copy; ${new Date().getFullYear()} AvroraMU Event Manager</p><p class="mb-0 small text-secondary">Forged for the MU Online community</p></div></footer>`;
}
