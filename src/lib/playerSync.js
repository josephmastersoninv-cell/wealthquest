import { isConfigured, sbFetch } from './supabase';

const PLAYER_KEY = 'wealthquest_player_id';
const PLAYER_DATA_KEY = 'wealthquest_player_data';

export function getMyPlayerId() {
  return localStorage.getItem(PLAYER_KEY);
}

export function getMyPlayerData() {
  try { return JSON.parse(localStorage.getItem(PLAYER_DATA_KEY) ?? 'null'); } catch { return null; }
}

export async function checkUsernameAvailable(name) {
  if (!isConfigured) return true;
  try {
    const rows = await sbFetch(`/players?name=ilike.${encodeURIComponent(name)}&select=id&limit=1`);
    return rows.length === 0;
  } catch {
    return true; // if check fails, allow registration to proceed
  }
}

export async function checkEmailExists(email) {
  if (!isConfigured) return null;
  try {
    const rows = await sbFetch(`/players?email=ilike.${encodeURIComponent(email)}&select=id,name,avatar,country_code,portfolio_value,xp,email&limit=1`);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function loginWithEmail(email) {
  const player = await checkEmailExists(email);
  if (!player) return null;
  localStorage.setItem(PLAYER_KEY, player.id);
  localStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(player));
  localStorage.setItem('wealthquest_onboarded', '1');
  return player;
}

export async function registerPlayer({ name, email, avatar, countryCode }) {
  // Save a local fallback immediately so sign-up never loops on Supabase failure
  const localId = 'local_' + Math.random().toString(36).slice(2);
  const localData = { id: localId, name, email, avatar, country_code: countryCode, portfolio_value: 10000, xp: 0 };
  localStorage.setItem(PLAYER_KEY, localId);
  localStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(localData));

  if (!isConfigured) return localData;

  try {
    const [player] = await sbFetch('/players', {
      method: 'POST',
      body: JSON.stringify({ name, email: email || null, avatar, country_code: countryCode, portfolio_value: 10000, xp: 0 }),
    });
    localStorage.setItem(PLAYER_KEY, player.id);
    localStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(player));
    return player;
  } catch (e) {
    console.error('registerPlayer failed, keeping local fallback:', e);
    return localData;
  }
}

export async function syncPortfolioValue(portfolioValue, xp = 0) {
  const id = getMyPlayerId();
  if (!id || !isConfigured || id.startsWith('local_')) return;
  try {
    await sbFetch(`/players?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        portfolio_value: Math.round(portfolioValue * 100) / 100,
        xp,
        updated_at: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.error('syncPortfolioValue:', e);
  }
}

export async function fetchLeaderboard() {
  if (!isConfigured) return [];
  try {
    return await sbFetch('/players?order=portfolio_value.desc&limit=100&select=id,name,avatar,country_code,portfolio_value,xp');
  } catch (e) {
    console.error('fetchLeaderboard:', e);
    return [];
  }
}

export async function fetchCountryTotals() {
  if (!isConfigured) return null;
  try {
    const players = await sbFetch('/players?select=country_code,portfolio_value');
    const totals = {};
    players.forEach(p => {
      if (!totals[p.country_code]) totals[p.country_code] = { total: 0, count: 0 };
      totals[p.country_code].total += Number(p.portfolio_value);
      totals[p.country_code].count++;
    });
    return totals;
  } catch {
    return null;
  }
}

export async function fetchXpLeaderboard() {
  if (!isConfigured) return [];
  try {
    return await sbFetch('/players?order=xp.desc&limit=100&select=id,name,avatar,country_code,xp,portfolio_value');
  } catch {
    return [];
  }
}
