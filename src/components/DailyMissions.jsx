import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getMissionsProgress, claimMissionReward } from '@/lib/missionsData';
import { useUserProgress } from '@/lib/useUserProgress';
import { toast } from 'sonner';

export default function DailyMissions() {
  const { progress, updateProgress } = useUserProgress();
  const [open, setOpen] = useState(true);
  const [missions, setMissions] = useState(() => getMissionsProgress());

  function handleClaim(mission) {
    const xp = claimMissionReward(mission.id);
    if (!xp) return;
    updateProgress({ xp: (progress?.xp ?? 0) + xp, coins: (progress?.coins ?? 0) + 10 });
    toast.success(`🎯 Mission complete! +${xp} XP · +10 coins`);
    setMissions(getMissionsProgress());
  }

  const completed = missions.filter(m => m.completed).length;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎯</span>
          <div className="text-left">
            <p className="font-extrabold text-sm text-foreground">Daily Missions</p>
            <p className="text-xs text-muted-foreground">{completed}/3 complete</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {missions.map((m, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${m.claimed ? 'bg-emerald-500' : m.completed ? 'bg-amber-400' : 'bg-muted'}`} />
            ))}
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="border-t border-border divide-y divide-border">
              {missions.map(m => {
                const pct = Math.min(100, Math.round(((m.progress ?? 0) / m.target) * 100));
                return (
                  <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-xl shrink-0">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${m.claimed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {m.label}
                      </p>
                      {!m.claimed && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                            {m.progress ?? 0}/{m.target}
                          </span>
                        </div>
                      )}
                    </div>
                    {m.claimed ? (
                      <span className="text-[10px] font-extrabold text-emerald-500 shrink-0">✓ Done</span>
                    ) : m.completed ? (
                      <button onClick={() => handleClaim(m)}
                        className="shrink-0 bg-amber-400 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl active:scale-95">
                        +{m.xp} XP
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground shrink-0">+{m.xp} XP</span>
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
