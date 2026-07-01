// Chest system — earn a chest every 3 completed lessons
// Chests contain randomised XP + coins + occasional bonus items

const KEY = 'wealthquest_chests';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{"earned":0,"opened":0}'); }
  catch { return { earned: 0, opened: 0 }; }
}
function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }

export function getChestState() { return load(); }

export function syncChestsFromLessons(completedCount) {
  const data = load();
  const earned = Math.floor(completedCount / 3);
  if (earned > data.earned) {
    data.earned = earned;
    save(data);
    return true; // new chest available
  }
  return false;
}

export function getPendingChests() {
  const d = load();
  return Math.max(0, d.earned - d.opened);
}

export function openChest() {
  const data = load();
  if (data.opened >= data.earned) return null;
  data.opened += 1;
  save(data);
  return rollRewards();
}

export function addBonusChest() {
  const data = load();
  data.earned += 1;
  save(data);
}

// Reward tiers — weighted random
const REWARD_TABLE = [
  { weight: 40, xp: 30,  coins: 20,  label: 'Common',    color: 'from-slate-400 to-slate-600',       emoji: '📦' },
  { weight: 30, xp: 60,  coins: 40,  label: 'Uncommon',  color: 'from-emerald-400 to-teal-600',      emoji: '💚' },
  { weight: 20, xp: 100, coins: 75,  label: 'Rare',      color: 'from-blue-400 to-violet-600',       emoji: '💙' },
  { weight: 8,  xp: 200, coins: 150, label: 'Epic',      color: 'from-violet-400 to-fuchsia-600',    emoji: '💜' },
  { weight: 2,  xp: 500, coins: 300, label: 'Legendary', color: 'from-yellow-400 to-amber-600',      emoji: '⭐' },
];

function rollRewards() {
  const total = REWARD_TABLE.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const tier of REWARD_TABLE) {
    roll -= tier.weight;
    if (roll <= 0) {
      // Add ±20% variance
      const variance = () => 0.8 + Math.random() * 0.4;
      return {
        ...tier,
        xp: Math.round(tier.xp * variance()),
        coins: Math.round(tier.coins * variance()),
      };
    }
  }
  return REWARD_TABLE[0];
}
