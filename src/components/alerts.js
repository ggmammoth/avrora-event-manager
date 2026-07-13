export function showAlert(container, message, type = 'danger') {
  if (!container) return;
  container.replaceChildren();
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.setAttribute('role', 'alert');
  alert.append(document.createTextNode(message));
  const close = document.createElement('button');
  close.type = 'button'; close.className = 'btn-close'; close.dataset.bsDismiss = 'alert'; close.setAttribute('aria-label', 'Close');
  alert.append(close); container.append(alert);
}

export const clearAlert = (container) => container?.replaceChildren();
