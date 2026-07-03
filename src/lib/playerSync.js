import { supabase, isConfigured } from './supabase';

// ── Real-time subscription ─────────────────────────────────────────────────────
// Returns an unsubscribe function. `onUpdate` is called with { players, countryTotals }
// whenever any player row changes.
export function subscribeToLeaderboard(onUpdate) {
  if (!isConfigured || !supabase) return () => {};

  async function refresh() {
    const [players, totals] = await Promise.all([
      fetchXpLeaderboard(),
      fetchCountryTotals(),
    ]);
    onUpdate({ players, countryTotals: totals });
  }

  const channel = supabase
    .channel('players-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
      refresh();
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ── Leaderboard queries ────────────────────────────────────────────────────────

export async function fetchLeaderboard() {
  if (!isConfigured || !supabase) return [];
  const { data } = await supabase
    .from('players')
    .select('id, name, avatar, country_code, portfolio_value, xp')
    .order('portfolio_value', { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function fetchXpLeaderboard() {
  if (!isConfigured || !supabase) return [];
  const { data } = await supabase
    .from('players')
    .select('id, name, avatar, country_code, xp, portfolio_value')
    .order('xp', { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function fetchCountryTotals() {
  if (!isConfigured || !supabase) return null;
  const { data } = await supabase
    .from('players')
    .select('country_code, portfolio_value');
  if (!data) return null;
  const totals = {};
  data.forEach(p => {
    if (!p.country_code) return;
    if (!totals[p.country_code]) totals[p.country_code] = { total: 0, count: 0 };
    totals[p.country_code].total  += Number(p.portfolio_value ?? 0);
    totals[p.country_code].count  += 1;
  });
  return totals;
}

// ── Portfolio sync (called after every trade / significant change) ─────────────

export async function syncPortfolioValue(portfolioValue, xp = 0) {
  if (!isConfigured || !supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('players')
    .update({
      portfolio_value: Math.round(portfolioValue * 100) / 100,
      xp,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);
}

// ── Username availability check ────────────────────────────────────────────────

export async function checkUsernameAvailable(name) {
  if (!isConfigured || !supabase) return true;
  const { data } = await supabase
    .from('players')
    .select('id')
    .ilike('name', name)
    .limit(1);
  return !data || data.length === 0;
}

// ── Legacy helpers kept for any existing callers ───────────────────────────────

export function getMyPlayerId() {
  return localStorage.getItem('wealthquest_player_id');
}

export function getMyPlayerData() {
  try { return JSON.parse(localStorage.getItem('wealthquest_player_data') ?? 'null'); }
  catch { return null; }
}
