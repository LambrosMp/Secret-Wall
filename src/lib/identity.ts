/**
 * Anonymous Identity Generator and Storage Helper
 */

export interface UserIdentity {
  token: string;
  name: string;
  avatar: string;
}

const ADJECTIVES = [
  'Neon',
  'Ghost',
  'Cosmic',
  'Shadow',
  'Silent',
  'Cyber',
  'Pixel',
  'Quantum',
  'Mystic',
  'Retro',
  'Velvet',
  'Midnight',
  'Solar',
  'Lunar',
  'Iron',
  'Echo',
  'Astral',
  'Hyper',
  'Glitch',
];

const NOUNS = [
  'Fox',
  'Coder',
  'Owl',
  'Wolf',
  'Panda',
  'Cat',
  'Ranger',
  'Hacker',
  'Falcon',
  'Specter',
  'Viper',
  'Tiger',
  'Raven',
  'Nomad',
  'Phantom',
  'Knight',
  'Pilot',
  'Sage',
  'Wanderer',
];

const AVATARS = [
  '🦊',
  '👻',
  '🦉',
  '🐺',
  '🐱',
  '🐼',
  '🦅',
  '🐯',
  '⚡',
  '🌙',
  '🎭',
  '🚀',
  '🔮',
  '🦄',
  '🐙',
  '👾',
  '🔥',
  '🛡️',
  '🦁',
  '🐸',
];

const STORAGE_KEY = 'secret_wall_identity_v1';

/**
 * Creates a unique random UUID string
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'usr_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

/**
 * Generates a brand new random identity
 */
export function generateIdentity(): UserIdentity {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  const padNum = num < 10 ? `0${num}` : `${num}`;

  return {
    token: generateUUID(),
    name: `${adj}${noun} #${padNum}`,
    avatar,
  };
}

/**
 * Generates random name and avatar suggestion
 */
export function getRandomSuggestedIdentity(): { name: string; avatar: string } {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  const padNum = num < 10 ? `0${num}` : `${num}`;

  return {
    name: `${adj}${noun} #${padNum}`,
    avatar,
  };
}

/**
 * Reads stored identity from sessionStorage (returns null if user has not onboarded yet)
 */
export function getStoredIdentity(): UserIdentity | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.token && parsed.name && parsed.avatar) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading identity from sessionStorage:', e);
  }

  return null;
}

/**
 * Creates and persists a new identity with custom or suggested name to sessionStorage
 */
export function saveIdentity(name: string, customAvatar?: string): UserIdentity {
  const avatar = customAvatar || AVATARS[Math.floor(Math.random() * AVATARS.length)];
  const token = generateUUID();

  const identity: UserIdentity = {
    token,
    name: name.trim(),
    avatar,
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch (e) {
    console.warn('Error saving identity to sessionStorage:', e);
  }

  return identity;
}

/**
 * Clears user identity and session data completely from sessionStorage
 */
export function clearIdentity(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('secret_wall_likes');
    // Also remove legacy keys from localStorage if any exist
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('secret_wall_likes');
  } catch (e) {
    console.warn('Error clearing identity:', e);
  }
}

/**
 * Fallback backward-compatible helper
 */
export function getOrCreateIdentity(): UserIdentity {
  const existing = getStoredIdentity();
  if (existing) return existing;

  const suggestion = getRandomSuggestedIdentity();
  return saveIdentity(suggestion.name, suggestion.avatar);
}

