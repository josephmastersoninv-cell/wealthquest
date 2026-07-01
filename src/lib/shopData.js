export const SHOP_ITEMS = [
  {
    id: 'heart_refill',
    name: 'Heart Refill',
    description: 'Restore all 5 hearts instantly',
    emoji: '❤️',
    price: 50,
    category: 'health',
    onPurchase: (progress) => ({ hearts: 5 }),
    canBuy: (progress) => (progress?.hearts ?? 5) < 5,
    cantBuyReason: 'Hearts are already full',
  },
  {
    id: 'streak_freeze',
    name: 'Streak Freeze',
    description: 'Protect your streak for one missed day',
    emoji: '❄️',
    price: 200,
    category: 'streak',
    onPurchase: () => {
      localStorage.setItem('wealthquest_streak_freeze', '1');
      return {};
    },
    canBuy: () => localStorage.getItem('wealthquest_streak_freeze') !== '1',
    cantBuyReason: 'Streak freeze already active',
  },
  {
    id: 'xp_boost_30',
    name: 'XP Boost',
    description: '2× XP on all activities for 30 minutes',
    emoji: '⚡',
    price: 150,
    category: 'boost',
    onPurchase: () => {
      const expires = Date.now() + 30 * 60 * 1000;
      localStorage.setItem('wealthquest_xp_boost', String(expires));
      return {};
    },
    canBuy: () => !isXpBoostActive(),
    cantBuyReason: 'XP Boost already active',
  },
  {
    id: 'streak_shield',
    name: 'Streak Shield',
    description: 'Automatically protects your streak for one missed day — stronger than a Freeze',
    emoji: '🛡️',
    price: 150,
    category: 'streak',
    onPurchase: () => {
      localStorage.setItem('wealthquest_streak_shield', '1');
      return {};
    },
    canBuy: () => localStorage.getItem('wealthquest_streak_shield') !== '1',
    cantBuyReason: 'Streak shield already active',
  },
  {
    id: 'chest_key',
    name: 'Chest Key',
    description: 'Open a bonus reward chest immediately',
    emoji: '🗝️',
    price: 100,
    category: 'reward',
    onPurchase: () => ({ _openChest: true }),
    canBuy: () => true,
  },
];

export function isXpBoostActive() {
  const exp = parseInt(localStorage.getItem('wealthquest_xp_boost') ?? '0', 10);
  return exp > Date.now();
}

export function getXpBoostMultiplier() {
  return isXpBoostActive() ? 2 : 1;
}

export function getXpBoostRemaining() {
  const exp = parseInt(localStorage.getItem('wealthquest_xp_boost') ?? '0', 10);
  if (exp <= Date.now()) return 0;
  return Math.ceil((exp - Date.now()) / 60000); // minutes remaining
}
