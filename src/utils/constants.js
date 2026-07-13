import defaultAvatarUrl from '../assets/default-avatar.svg?url';
import defaultEventUrl from '../assets/default-event.svg?url';

export const CHARACTER_CLASSES = [
  'Dark Wizard', 'Dark Knight', 'Fairy Elf', 'Magic Gladiator',
  'Dark Lord', 'Summoner', 'Rage Fighter',
];

export const REGISTRATION_STATUSES = ['pending', 'approved', 'rejected'];
export const USER_ROLES = ['user', 'admin'];
export const DEFAULT_AVATAR = defaultAvatarUrl;
export const DEFAULT_EVENT_IMAGE = defaultEventUrl;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_PDF_SIZE = 10 * 1024 * 1024;
