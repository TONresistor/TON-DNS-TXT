const STORAGE_KEY = 'dns-text-keys';

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

/** Save a keyString → hash mapping so it can be displayed later. */
export function saveKeyName(keyHash: string, keyName: string): void {
  const store = load();
  store[keyHash] = keyName;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/** Retrieve the original key string for a given hash, or null if unknown. */
export function getKeyName(keyHash: string): string | null {
  return load()[keyHash] ?? null;
}
