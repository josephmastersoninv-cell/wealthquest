// Squad mechanic — recruit investors, earn passive XP daily

const SQUAD_KEY = 'wealthquest_squad';
const PASSIVE_KEY = 'wealthquest_passive_claimed';

export const SQUAD_MAX = 4;

export const RECRUIT_TIERS = [
  { tier: 'Analyst',    emoji: '📊', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   costRange: [40,  80],  xpPerDay: [5,  10] },
  { tier: 'Trader',     emoji: '📈', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', costRange: [80,  150], xpPerDay: [10, 18] },
  { tier: 'Strategist', emoji: '🧠', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30', costRange: [150, 280], xpPerDay: [18, 30] },
  { tier: 'Mogul',      emoji: '👑', color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  costRange: [280, 500], xpPerDay: [30, 50] },
];

// Seeded RNG
function seededRand(seed) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    return (s >>> 0) / 0xffffffff;
  };
}

const FIRST = ['Alpha','Bull','Value','Market','Delta','Yield','Index','Sharp','Macro','Quant','Pivot','Beta','Sigma','Omega','Prime'];
const LAST  = ['Hedge','Runner','Vault','Maven','Flow','Yoda','Pro','Sam','Max','Fox','Bear','Wolf','Hawk','Ace','King'];
const AVATARS = ['👨‍💼','👩‍💼','🧑‍💻','👨‍🎓','👩‍🎓','🧑‍🚀','👨‍🔬','👩‍🔬','🎯','🦁'];

export function generateRecruitPool(weekSeed) {
  const rand = seededRand(weekSeed * 997 + 13);
  return Array.from({ length: 12 }, (_, i) => {
    const tierIdx = Math.min(3, Math.floor(rand() * 4));
    const tier = RECRUIT_TIERS[tierIdx];
    const cost = Math.round(tier.costRange[0] + rand() * (tier.costRange[1] - tier.costRange[0]));
    const xpDay = Math.round(tier.xpPerDay[0] + rand() * (tier.xpPerDay[1] - tier.xpPerDay[0]));
    const name = FIRST[Math.floor(rand() * FIRST.length)] + ' ' + LAST[Math.floor(rand() * LAST.length)];
    const avatar = AVATARS[Math.floor(rand() * AVATARS.length)];
    const winRate = Math.round(40 + rand() * 50);
    return { id: `recruit-${weekSeed}-${i}`, name, avatar, tier: tier.tier, tierIdx, cost, xpDay, winRate };
  });
}

export function getSquad() {
  try { return JSON.parse(localStorage.getItem(SQUAD_KEY) ?? '[]'); } catch { return []; }
}

export function recruitPlayer(player) {
  const squad = getSquad();
  if (squad.length >= SQUAD_MAX) return false;
  if (squad.find(m => m.id === player.id)) return false;
  squad.push({ ...player, recruitedAt: Date.now() });
  localStorage.setItem(SQUAD_KEY, JSON.stringify(squad));
  return true;
}

export function dismissPlayer(id) {
  const squad = getSquad().filter(m => m.id !== id);
  localStorage.setItem(SQUAD_KEY, JSON.stringify(squad));
}

export function getPassiveXpToday() {
  const today = new Date().toISOString().slice(0, 10);
  const claimed = localStorage.getItem(PASSIVE_KEY);
  if (claimed === today) return 0;
  return getSquad().reduce((sum, m) => sum + (m.xpDay ?? 0), 0);
}

export function claimPassiveXp() {
  const today = new Date().toISOString().slice(0, 10);
  const xp = getPassiveXpToday();
  localStorage.setItem(PASSIVE_KEY, today);
  return xp;
}

export function getWeekSeed() {
  return Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
}
