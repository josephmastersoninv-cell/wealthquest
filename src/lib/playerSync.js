import { isConfigured, sbFetch } from './supabase';

const PLAYER_KEY = 'wealthquest_player_id';
const PLAYER_DATA_KEY = 'wealthquest_player_data';

export function getMyPlayerId() {
  return localStorage.getItem(PLAYER_KEY);
}

export function getMyPlayerData() {
  try { return JSON.parse(localStorage.getItem(PLAYER_DATA_KEY) ?? 'null'); } catch { return null; }
}

export async function registerPlayer({ name, avatar, countryCode }) {
  if (!isConfigured) {
    const id = Math.random().toString(36).slice(2);
    const data = { id, name, avatar, country_code: countryCode, portfolio_value: 10000, xp: 0 };
    localStorage.setItem(PLAYER_KEY, id);
    localStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(data));
    return data;
  }
  try {
    const [player] = await sbFetch('/players', {
      method: 'POST',
      body: JSON.stringify({ name, avatar, country_code: countryCode, portfolio_value: 10000, xp: 0 }),
    });
    localStorage.setItem(PLAYER_KEY, player.id);
    localStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(player));
    return player;
  } catch (e) {
    console.error('registerPlayer:', e);
    return null;
  }
}

export async function syncPortfolioValue(portfolioValue, xp = 0) {
  const id = getMyPlayerId();
  if (!id || !isConfigured) return;
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
