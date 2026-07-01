import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, DollarSign, Zap, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserProgress } from '@/lib/useUserProgress';
import { SHOP_ITEMS, getXpBoostRemaining, isXpBoostActive } from '@/lib/shopData';
import { getPendingChests, addBonusChest } from '@/lib/chestData';
import ChestModal from '@/components/ChestModal';
import { toast } from 'sonner';

export default function Shop() {
  const { progress, updateProgress } = useUserProgress();
  const [showChest, setShowChest] = useState(false);
  const [purchasing, setPurchasing] = useState(null);
  const coins = progress?.coins ?? 0;
  const boostMins = getXpBoostRemaining();

  async function buy(item) {
    if (purchasing) return;
    if (!item.canBuy(progress)) { toast.error(item.cantBuyReason ?? 'Cannot purchase'); return; }
    if (coins < item.price) { toast.error(`Need ${item.price} coins. You have ${coins}.`); return; }

    setPurchasing(item.id);
    try {
      const updates = item.onPurchase(progress);
      const openChest = updates._openChest;
      delete updates._openChest;

      await updateProgress({ coins: coins - item.price, ...updates });

      if (openChest) {
        addBonusChest();
        setShowChest(true);
      } else {
        toast.success(`${item.emoji} ${item.name} purchased!`);
      }
    } finally {
      setPurchasing(null);
    }
  }

  function handleChestReward(reward) {
    updateProgress({
      xp: (progress?.xp ?? 0) + reward.xp,
      coins: (progress?.coins ?? 0) + reward.coins,
    });
  }

  const categories = [
    { id: 'health', label: '❤️ Health', items: SHOP_ITEMS.filter(i => i.category === 'health') },
    { id: 'streak', label: '🔥 Streak', items: SHOP_ITEMS.filter(i => i.category === 'streak') },
    { id: 'boost',  label: '⚡ Boosts',  items: SHOP_ITEMS.filter(i => i.category === 'boost') },
    { id: 'reward', label: '📦 Rewards', items: SHOP_ITEMS.filter(i => i.category === 'reward') },
  ];

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 px-4 pt-12 pb-6">
        <Link to="/play" className="inline-flex items-center gap-1 text-white/80 text-sm font-bold mb-4 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Shop</h1>
            <p className="text-white/70 text-sm">Spend your hard-earned coins</p>
          </div>
          <div className="bg-white/20 rounded-2xl px-4 py-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-white" />
            <span className="text-white font-extrabold text-lg">{coins}</span>
          </div>
        </div>

        {/* Active boost indicator */}
        {boostMins > 0 && (
          <div className="mt-3 bg-white/20 rounded-xl px-3 py-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-300" />
            <span className="text-white text-sm font-bold">2× XP Boost active — {boostMins} min remaining</span>
          </div>
        )}
      </div>

      {/* Pending chests reminder */}
      {getPendingChests() > 0 && (
        <div className="mx-4 mt-4">
          <button onClick={() => setShowChest(true)}
            className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">📦</span>
              <span className="font-extrabold text-amber-900 dark:text-amber-300 text-sm">
                {getPendingChests()} chest{getPendingChests() > 1 ? 's' : ''} waiting!
              </span>
            </div>
            <span className="text-amber-700 dark:text-amber-400 text-sm font-bold">Open →</span>
          </button>
        </div>
      )}

      <div className="px-4 pt-5 space-y-6">
        {categories.map(cat => (
          <div key={cat.id}>
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-2">{cat.label}</p>
            <div className="space-y-2">
              {cat.items.map(item => {
                const canBuy = item.canBuy(progress);
                const affordable = coins >= item.price;
                const isActive = item.id === 'xp_boost_30' && isXpBoostActive();
                const freezeOwned = item.id === 'streak_freeze' && !canBuy;
                const isPurchasing = purchasing === item.id;

                return (
                  <motion.div
                    key={item.id}
                    className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4"
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-3xl shrink-0">{item.emoji}</span>
                    <div className="flex-1">
                      <p className="font-extrabold text-sm text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      {isActive && (
                        <p className="text-xs text-emerald-500 font-bold mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {boostMins}m remaining
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => buy(item)}
                      disabled={!canBuy || !affordable || isPurchasing}
                      className={`shrink-0 px-4 py-2 rounded-xl font-extrabold text-sm transition-all active:scale-95 ${
                        isActive || freezeOwned
                          ? 'bg-muted text-muted-foreground cursor-default'
                          : !affordable
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'bg-amber-400 text-white shadow active:shadow-sm'
                      }`}
                    >
                      {isActive ? 'Active' : freezeOwned ? 'Owned' : isPurchasing ? '...' : `💰 ${item.price}`}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* How to earn coins */}
        <div className="bg-muted rounded-2xl p-4">
          <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider mb-3">How to earn coins</p>
          <div className="space-y-2">
            {[
              { action: 'Complete a lesson', reward: '+$25' },
              { action: 'Pass the Daily Challenge', reward: '+$20' },
              { action: 'Finish Practice Quiz', reward: '+$10' },
              { action: 'Pass the Final Exam', reward: '+$150' },
              { action: 'Ace the Final Exam (90%+)', reward: '+$250' },
            ].map(e => (
              <div key={e.action} className="flex justify-between text-xs">
                <span className="text-foreground font-semibold">{e.action}</span>
                <span className="font-extrabold text-emerald-500">{e.reward}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showChest && (
          <ChestModal
            onClose={() => setShowChest(false)}
            onReward={handleChestReward}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
