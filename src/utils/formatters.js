export function formatDate(value, options = {}) {
  if (!value) return 'Not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium', timeStyle: 'short', ...options,
  }).format(date);
}

export function formatDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function statusBadge(status) {
  const styles = { approved: 'success', rejected: 'danger', pending: 'warning' };
  return `badge text-bg-${styles[status] || 'secondary'}`;
}

export function truncate(value = '', length = 140) {
  return value.length > length ? `${value.slice(0, length).trim()}…` : value;
}
