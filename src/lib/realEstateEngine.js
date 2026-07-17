// Real Estate engine — shared-world ownership (Supabase), mortgages, rent,
// and monthly settlement. Falls back to local-only ownership when signed out.
//
// Shared world: the `properties` table has asset_id as PRIMARY KEY, so a buy
// is an INSERT — if two players race, the second insert fails. Race-safe.

import { supabase, isConfigured } from './supabase';
import { getAssetById, assetPrice, monthlyRent, currentGameMonth, monthlyPayment, MIN_DOWN_PCT, MORTGAGE_RATES } from './realEstateData';
import { getPortfolio, savePortfolio, adjustCash, getLivePriceById } from './tradeActions';

const LOCAL_KEY = 'wealthquest_re_holdings';
const RENT_CAP_MONTHS = 3;
const MAX_STRIKES = 3;

// ── Ownership store ─────────────────────────────────────────────────────────

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}'); } catch { return {}; }
}
function writeLocal(map) { localStorage.setItem(LOCAL_KEY, JSON.stringify(map)); }

async function authUser() {
  if (!isConfigured || !supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// All ownership rows worldwide → { assetId: { ownerId, ownerName, mine, ... } }
export async function fetchWorldOwnership() {
  const local = readLocal();
  const world = {};
  Object.entries(local).forEach(([id, rec]) => { world[id] = { ...rec, mine: true, local: true }; });

  const user = await authUser();
  if (user) {
    const { data, error } = await supabase.from('properties').select('*, players:owner_id(country_code, avatar)');
    if (error) { window.__reTableMissing = true; return world; } // table not created yet → local mode
    window.__reTableMissing = false;
    (data ?? []).forEach(row => {
      world[row.asset_id] = {
        assetId: row.asset_id,
        ownerId: row.owner_id,
        ownerName: row.owner_name,
        ownerCountry: row.players?.country_code ?? null,
        ownerAvatar: row.players?.avatar ?? null,
        mine: row.owner_id === user.id,
        purchasePrice: Number(row.purchase_price),
        purchasedAt: row.purchased_at,
        mortgage: row.mortgage,
        lastCollectedMonth: row.last_collected_month,
        lastSettledMonth: row.last_settled_month,
      };
    });
  }
  return world;
}

// Count of player-owned assets per city (drives demand pricing)
export function ownedCountsByCity(world) {
  const counts = {};
  Object.keys(world).forEach(id => {
    const a = getAssetById(id);
    if (a) counts[a.cityId] = (counts[a.cityId] ?? 0) + 1;
  });
  return counts;
}

// ── Buying ──────────────────────────────────────────────────────────────────
// Buy with cash or mortgage. downPct >= MIN_DOWN_PCT; term in {60, 120}.
export async function buyProperty(assetId, { downPct = 1, term = 60 } = {}, ownedCounts = {}) {
  const asset = getAssetById(assetId);
  if (!asset) return { ok: false, error: 'Unknown property' };

  const price = assetPrice(asset, ownedCounts);
  const down = Math.round(price * Math.min(1, Math.max(MIN_DOWN_PCT, downPct)));
  const financed = price - down;
  const cash = getPortfolio().cash ?? 0;
  if (down > cash) return { ok: false, error: `Down payment is $${down.toLocaleString()} — you have $${Math.floor(cash).toLocaleString()}` };

  const mortgage = financed > 0 ? {
    principal: financed,
    remaining: financed,
    rate: MORTGAGE_RATES[term] ?? 0.065,
    term,
    payment: Math.round(monthlyPayment(financed, MORTGAGE_RATES[term] ?? 0.065, term)),
    strikes: 0,
  } : null;

  const month = currentGameMonth();
  const record = {
    assetId, purchasePrice: price, purchasedAt: new Date().toISOString(),
    mortgage, lastCollectedMonth: month, lastSettledMonth: month,
  };

  const user = await authUser();
  if (user && !window.__reTableMissing) {
    const name = JSON.parse(localStorage.getItem('wealthquest_player_data') ?? '{}')?.name ?? 'Investor';
    const { error } = await supabase.from('properties').insert({
      asset_id: assetId, owner_id: user.id, owner_name: name,
      purchased_at: record.purchasedAt, purchase_price: price,
      mortgage, last_collected_month: month, last_settled_month: month,
    });
    if (error) {
      if (String(error.code) === '23505') return { ok: false, error: 'Someone just bought this property!' };
      // Table missing or RLS issue → fall back to local ownership so the game still works
      window.__reTableMissing = true;
      const local = readLocal();
      if (local[assetId]) return { ok: false, error: 'You already own this' };
      local[assetId] = record;
      writeLocal(local);
    }
  } else {
    const local = readLocal();
    if (local[assetId]) return { ok: false, error: 'You already own this' };
    local[assetId] = record;
    writeLocal(local);
  }

  adjustCash(-down);
  return { ok: true, price, down, mortgage };
}

// ── Selling (back to market at current value, 5% fee, mortgage repaid) ──────
export async function sellProperty(assetId, world, ownedCounts = {}) {
  const rec = world[assetId];
  const asset = getAssetById(assetId);
  if (!rec?.mine || !asset) return { ok: false, error: 'Not yours to sell' };

  const price = assetPrice(asset, ownedCounts);
  const fee = Math.round(price * 0.05);
  const debt = rec.mortgage?.remaining ?? 0;
  const proceeds = price - fee - debt;

  const user = await authUser();
  if (user && !rec.local) {
    const { error } = await supabase.from('properties').delete().eq('asset_id', assetId).eq('owner_id', user.id);
    if (error) return { ok: false, error: 'Sale failed — try again' };
  } else {
    const local = readLocal();
    delete local[assetId];
    writeLocal(local);
  }

  adjustCash(proceeds);
  return { ok: true, price, fee, debt, proceeds };
}

// ── Upgrades & tenants (local per-player meta — only affects YOUR income) ───
const META_KEY = 'wealthquest_re_meta';
export const MAX_UPGRADE_LEVEL = 3;
export const UPGRADE_RENT_BOOST = 0.15; // +15% rent per level

export function getMeta() {
  try { return JSON.parse(localStorage.getItem(META_KEY) ?? '{}'); } catch { return {}; }
}
function setMeta(m) { localStorage.setItem(META_KEY, JSON.stringify(m)); }

export function propertyMeta(assetId) {
  const m = getMeta()[assetId] ?? {};
  return { level: m.level ?? 0, vacantUntil: m.vacantUntil ?? 0 };
}
export function isVacant(assetId) { return propertyMeta(assetId).vacantUntil > currentGameMonth(); }
export function rentMult(assetId) { return 1 + propertyMeta(assetId).level * UPGRADE_RENT_BOOST; }

export function upgradeCost(asset, ownedCounts = {}) {
  return Math.round(assetPrice(asset, ownedCounts) * 0.15);
}

// Renovate: 15% of value per level → +15% rent forever
export function upgradeProperty(assetId, ownedCounts = {}) {
  const asset = getAssetById(assetId);
  const meta = getMeta();
  const cur = meta[assetId]?.level ?? 0;
  if (cur >= MAX_UPGRADE_LEVEL) return { ok: false, error: 'Fully upgraded' };
  const cost = upgradeCost(asset, ownedCounts);
  if ((getPortfolio().cash ?? 0) < cost) return { ok: false, error: `Renovation costs $${cost.toLocaleString()} — not enough cash` };
  adjustCash(-cost);
  meta[assetId] = { ...(meta[assetId] ?? {}), level: cur + 1 };
  setMeta(meta);
  return { ok: true, level: cur + 1, cost };
}

// Fill a vacancy immediately by paying an agent fee (3% of value)
export function fillVacancy(assetId, ownedCounts = {}) {
  const asset = getAssetById(assetId);
  const fee = Math.round(assetPrice(asset, ownedCounts) * 0.03);
  if ((getPortfolio().cash ?? 0) < fee) return { ok: false, error: `Agent fee is $${fee.toLocaleString()} — not enough cash` };
  adjustCash(-fee);
  const meta = getMeta();
  meta[assetId] = { ...(meta[assetId] ?? {}), vacantUntil: 0 };
  setMeta(meta);
  return { ok: true, fee };
}

function hashStr2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  return h >>> 0;
}

// ── Rent collection (tap to collect, capped at 3 months) ───────────────────
export function pendingRent(rec, ownedCounts = {}) {
  const asset = getAssetById(rec.assetId);
  if (!asset) return 0;
  if (isVacant(rec.assetId)) return 0; // no tenant, no rent
  const months = Math.min(RENT_CAP_MONTHS, currentGameMonth() - (rec.lastCollectedMonth ?? currentGameMonth()));
  return Math.round(Math.max(0, months) * monthlyRent(asset, ownedCounts) * rentMult(rec.assetId));
}

export async function collectRent(assetId, world, ownedCounts = {}) {
  const rec = world[assetId];
  if (!rec?.mine) return { ok: false };
  const amount = pendingRent(rec, ownedCounts);
  if (amount <= 0) return { ok: false, error: 'No rent due yet — come back next month' };

  const month = currentGameMonth();
  const user = await authUser();
  if (user && !rec.local) {
    await supabase.from('properties').update({ last_collected_month: month }).eq('asset_id', assetId).eq('owner_id', user.id);
  } else {
    const local = readLocal();
    if (local[assetId]) { local[assetId].lastCollectedMonth = month; writeLocal(local); }
  }
  adjustCash(amount);
  return { ok: true, amount };
}

// ── Monthly settlement ──────────────────────────────────────────────────────
// For each of my properties: charge mortgage for every elapsed game month.
// Payment order: cash → liquidate stock holdings (collateral) → strike.
// 3 strikes → repossessed (deleted; back on the market).
export async function settleMyProperties(world) {
  const month = currentGameMonth();
  const events = [];

  for (const [assetId, rec] of Object.entries(world)) {
    if (!rec.mine) continue;

    // Tenant churn: each elapsed month has an 8% chance the tenant leaves
    // (deterministic per property+month). Vacancy = no rent for 2 months
    // unless the player pays an agent fee to refill it.
    {
      const from = rec.lastSettledMonth ?? month;
      const meta = getMeta();
      const pm = meta[assetId] ?? {};
      for (let m = from + 1; m <= month; m++) {
        if ((pm.vacantUntil ?? 0) > m) continue; // already vacant
        const roll = (hashStr2(assetId + ':' + m) % 1000) / 1000;
        if (roll < 0.08) {
          pm.vacantUntil = m + 2;
          meta[assetId] = pm;
          setMeta(meta);
          events.push({ type: 'vacancy', assetId, until: m + 2 });
          break;
        }
      }
      if (!rec.mortgage) {
        // still advance the settle clock for unmortgaged properties
        const user = await authUser();
        if (user && !rec.local) await supabase.from('properties').update({ last_settled_month: month }).eq('asset_id', assetId).eq('owner_id', user.id);
        else { const local = readLocal(); if (local[assetId]) { local[assetId].lastSettledMonth = month; writeLocal(local); } }
        world[assetId] = { ...rec, lastSettledMonth: month };
        continue;
      }
    }

    const owed = Math.max(0, month - (rec.lastSettledMonth ?? month));
    if (owed === 0) continue;

    const m = { ...rec.mortgage };
    let strikes = m.strikes ?? 0;
    let repossessed = false;

    for (let i = 0; i < owed && !repossessed; i++) {
      if (m.remaining <= 0) break;
      const pay = Math.min(m.payment, m.remaining + m.remaining * m.rate / 12);
      const interest = m.remaining * m.rate / 12;
      let cash = getPortfolio().cash ?? 0;

      if (cash < pay) {
        // Collateral call: liquidate stock holdings to cover the shortfall
        const p = getPortfolio();
        let need = pay - cash;
        for (const h of [...(p.holdings ?? [])]) {
          if (need <= 0) break;
          const price = getLivePriceById(h.assetId);
          if (!price) continue;
          const sellShares = Math.min(h.shares, need / price);
          h.shares -= sellShares;
          p.cash += sellShares * price;
          need -= sellShares * price;
          events.push({ type: 'liquidated', assetId, detail: `Sold $${Math.round(sellShares * price).toLocaleString()} of ${h.assetId} to cover the mortgage` });
        }
        p.holdings = (p.holdings ?? []).filter(h => h.shares > 0.0001);
        savePortfolio(p);
        cash = p.cash;
      }

      if (cash >= pay) {
        adjustCash(-pay);
        m.remaining = Math.max(0, m.remaining + interest - pay);
        strikes = 0;
        events.push({ type: 'paid', assetId, amount: Math.round(pay) });
      } else {
        strikes += 1;
        events.push({ type: 'strike', assetId, strikes });
        if (strikes >= MAX_STRIKES) {
          repossessed = true;
          events.push({ type: 'repossessed', assetId });
        }
      }
    }

    const user = await authUser();
    if (repossessed) {
      if (user && !rec.local) await supabase.from('properties').delete().eq('asset_id', assetId).eq('owner_id', user.id);
      else { const local = readLocal(); delete local[assetId]; writeLocal(local); }
      delete world[assetId];
      continue;
    }

    m.strikes = strikes;
    const update = { mortgage: m.remaining > 0 ? m : null, last_settled_month: month };
    if (user && !rec.local) {
      await supabase.from('properties').update(update).eq('asset_id', assetId).eq('owner_id', user.id);
    } else {
      const local = readLocal();
      if (local[assetId]) { local[assetId].mortgage = update.mortgage; local[assetId].lastSettledMonth = month; writeLocal(local); }
    }
    world[assetId] = { ...rec, mortgage: update.mortgage, lastSettledMonth: month };
  }

  return events;
}

// ── Portfolio integration ───────────────────────────────────────────────────
// Equity = current value − remaining debt, across everything I own.
export function myRealEstateEquity(world, ownedCounts = {}) {
  let equity = 0;
  Object.values(world).forEach(rec => {
    if (!rec.mine) return;
    const asset = getAssetById(rec.assetId);
    if (!asset) return;
    equity += assetPrice(asset, ownedCounts) - (rec.mortgage?.remaining ?? 0);
  });
  return Math.round(equity);
}
