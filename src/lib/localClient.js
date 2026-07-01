// Drop-in replacement for the Base44 SDK client used by useUserProgress.js.
// Mimics the shape of `base44.entities.UserProgress.{list,create,update}`
// but persists everything to localStorage — no network, no account needed.

const STORAGE_KEY = 'wealthquest_user_progress';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function makeId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Simulates network latency so loading states behave like the real thing.
function delay(value, ms = 120) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const base44 = {
  entities: {
    UserProgress: {
      // list(sortField, limit) — sortField like '-created_date' is accepted but
      // since there's only ever one active local user record, sorting is a no-op.
      async list(_sortField, limit = 10) {
        const records = readAll();
        return delay(records.slice(0, limit));
      },
      async create(data) {
        const record = {
          id: makeId(),
          created_date: new Date().toISOString(),
          hearts: 5,
          hearts_last_refill: new Date().toISOString().split('T')[0],
          exam_attempts: 0,
          exam_best_score: null,
          ...data,
        };
        const records = readAll();
        records.push(record);
        writeAll(records);
        return delay(record);
      },
      async update(id, updates) {
        const records = readAll();
        const idx = records.findIndex((r) => r.id === id);
        if (idx === -1) throw new Error(`UserProgress record ${id} not found`);
        records[idx] = { ...records[idx], ...updates };
        writeAll(records);
        return delay(records[idx]);
      },
      // Handy for a "reset progress" button — not part of the original API.
      async _resetAll() {
        writeAll([]);
        return delay(true);
      },
    },
  },
};
