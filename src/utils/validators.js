import { MAX_IMAGE_SIZE, MAX_PDF_SIZE } from './constants.js';

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function validatePassword(value) {
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Password must include a letter and a number.';
  return '';
}

export function validateCharacterName(value) {
  const name = value.trim();
  if (!/^[A-Za-z0-9_-]{3,20}$/.test(name)) {
    return 'Character name must be 3–20 characters and use letters, numbers, _ or -.';
  }
  return '';
}

export function validateImage(file) {
  if (!file) return '';
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) return 'Use a JPG, PNG, WebP, or GIF image.';
  if (file.size > MAX_IMAGE_SIZE) return 'Image must be no larger than 5 MB.';
  return '';
}

export function validateEventImage(file) {
  if (!file) return '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Event image must be a JPG, PNG, or WebP file.';
  if (file.size > MAX_IMAGE_SIZE) return 'Event image must be no larger than 5 MB.';
  return '';
}

export function validatePdf(file) {
  if (!file) return '';
  if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) return 'Rules file must be a valid PDF.';
  if (file.size > MAX_PDF_SIZE) return 'PDF must be no larger than 10 MB.';
  return '';
}

export function setButtonLoading(button, loading, label = 'Please wait…') {
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>${label}`;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || 'Submit';
  }
}
