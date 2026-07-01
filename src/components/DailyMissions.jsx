import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { getMissionsProgress, claimMissionReward } from '@/lib/missionsData';
import { useUserProgress } from '@/lib/useUserProgress';
import { toast } from 'sonner';

export default function DailyMissions() {
  const { progress, updateProgress } = useUserProgress();
  const [open, setOpen] = useState(false);
  const [missions, setMissions] = useState(() => getMissionsProgress(progress));

  function handleClaim(mission) {
    const reward = claimMissionReward(mission.id);
    if (!reward) return;
    updateProgress({
      xp: (progress?.xp ?? 0) + reward.xp,
      coins: (progress?.coins ?? 0) + reward.coins,
    });
    toast.success(`🎯 +${reward.xp} XP · +${reward.coins} coins!`);
    setMissions(getMissionsProgress(progress));
  }

  const completed = missions.filter(m => m.completed).length;
  const unclaimed = missions.filter(m => m.completed && !m.claimed).length;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
      {/* Header row — always visible, compact */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3">
        <span className="text-base">🎯</span>
        <span className="font-extrabold text-sm text-foreground flex-1 text-left">Daily Missions</span>
        {/* Mini progress pips */}
        <div className="flex gap-1 mr-2">
          {missions.map((m, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
              m.claimed ? 'bg-emerald-500' : m.completed ? 'bg-amber-400 animate-pulse' : 'bg-muted'
            }`} />
          ))}
        </div>
        {unclaimed > 0 && (
          <span className="bg-amber-400 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center mr-1">
            {unclaimed}
          </span>
        )}
        <span className="text-xs font-bold text-muted-foreground mr-1">{completed}/3</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <div className="border-t border-border">
              {missions.map((m, i) => {
                const pct = Math.min(100, Math.round(((m.progress ?? 0) / m.target) * 100));
                return (
                  <div key={m.id} className={`flex items-center gap-3 px-4 py-2.5 ${i < missions.length - 1 ? 'border-b border-border/50' : ''}`}>
                    <span className="text-lg shrink-0">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold leading-tight ${m.claimed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {m.label}
                      </p>
                      {!m.claimed && m.target > 1 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-bold">{m.progress ?? 0}/{m.target}</span>
                        </div>
                      )}
                    </div>
                    {m.claimed ? (
                      <span className="text-[10px] font-extrabold text-emerald-500 shrink-0">✓</span>
                    ) : m.completed ? (
                      <button onClick={() => handleClaim(m)}
                        className="shrink-0 bg-amber-400 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg active:scale-95">
                        Claim
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground shrink-0">+{m.xp}XP</span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
