// 1v1 portfolio duels — challenge a player by username; 7 real days;
// biggest % portfolio gain wins. Winner takes $500 cash.
// Backed by the `duels` table (see supabase/duels.sql); hidden if missing.

import { supabase, isConfigured } from './supabase';
import { adjustCash } from './tradeActions';

export const DUEL_DAYS = 7;
export const DUEL_PRIZE = 500;

async function me() {
  if (!isConfigured || !supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function myPlayerRow(uid) {
  const { data } = await supabase.from('players').select('id, name, portfolio_value').eq('id', uid).single();
  return data;
}

export async function fetchMyDuels() {
  const user = await me();
  if (!user) return { duels: [], unavailable: true };
  const { data, error } = await supabase.from('duels')
    .select('*')
    .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) return { duels: [], unavailable: true };
  return { duels: data ?? [], uid: user.id };
}

export async function challengePlayer(name) {
  const user = await me();
  if (!user) return { ok: false, error: 'Sign in to duel' };
  const { data: opp } = await supabase.from('players')
    .select('id, name, portfolio_value').ilike('name', name.trim()).limit(1).maybeSingle();
  if (!opp) return { ok: false, error: `No player called "${name.trim()}"` };
  if (opp.id === user.id) return { ok: false, error: "You can't duel yourself" };
  const mine = await myPlayerRow(user.id);
  const { error } = await supabase.from('duels').insert({
    challenger_id: user.id, challenger_name: mine?.name ?? 'Investor',
    opponent_id: opp.id, opponent_name: opp.name,
    start_value_challenger: mine?.portfolio_value ?? 10000,
    status: 'pending',
  });
  if (error) return { ok: false, error: 'Challenge failed — try again' };
  return { ok: true, opponent: opp.name };
}

export async function respondToDuel(duel, accept) {
  const user = await me();
  if (!user) return { ok: false };
  if (!accept) {
    await supabase.from('duels').update({ status: 'declined' }).eq('id', duel.id).eq('status', 'pending');
    return { ok: true };
  }
  const mine = await myPlayerRow(user.id);
  const now = new Date();
  const ends = new Date(now.getTime() + DUEL_DAYS * 24 * 3600 * 1000);
  const { error } = await supabase.from('duels').update({
    status: 'active',
    start_value_opponent: mine?.portfolio_value ?? 10000,
    start_at: now.toISOString(),
    ends_at: ends.toISOString(),
  }).eq('id', duel.id).eq('status', 'pending');
  return { ok: !error };
}

// Live % gain for both sides of an active duel
export function duelGains(duel, players) {
  const val = id => players?.find(p => p.id === id)?.portfolio_value;
  const g = (cur, start) => (cur != null && start > 0) ? ((cur - start) / start) * 100 : null;
  return {
    challenger: g(val(duel.challenger_id), Number(duel.start_value_challenger)),
    opponent:   g(val(duel.opponent_id),   Number(duel.start_value_opponent)),
  };
}

// Settle an expired duel (first client to notice wins the race; guarded by status)
export async function settleDuelIfDue(duel) {
  if (duel.status !== 'active' || !duel.ends_at || new Date(duel.ends_at) > new Date()) return null;
  const { data: rows } = await supabase.from('players')
    .select('id, portfolio_value').in('id', [duel.challenger_id, duel.opponent_id]);
  const val = id => Number(rows?.find(p => p.id === id)?.portfolio_value ?? 0);
  const gC = (val(duel.challenger_id) - Number(duel.start_value_challenger)) / Math.max(1, Number(duel.start_value_challenger));
  const gO = (val(duel.opponent_id) - Number(duel.start_value_opponent)) / Math.max(1, Number(duel.start_value_opponent));
  const winner = gC === gO ? null : (gC > gO ? duel.challenger_id : duel.opponent_id);
  const { data, error } = await supabase.from('duels')
    .update({ status: 'settled', winner_id: winner })
    .eq('id', duel.id).eq('status', 'active').select();
  if (error || !data?.length) return null; // someone else settled it
  const user = await me();
  if (user && winner === user.id) {
    adjustCash(DUEL_PRIZE);
    return { won: true };
  }
  return { won: false, draw: winner === null };
}
