import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Shield, Zap, Flame, Heart, Trophy, Star, BookOpen, Target, ChevronRight, Check, Crown } from 'lucide-react';
import { useUserProgress } from '@/lib/useUserProgress';
import { useTheme } from '@/lib/themeContext';
import { getLevelForXp, getXpProgress, LEVELS } from '@/lib/levelData';
import { ACHIEVEMENTS } from '@/lib/achievementData';
import { DAILY_GOALS, getGoalConfig, setDailyGoal, getDailyGoal, hasStreakFreeze, setStreakFreeze, STREAK_FREEZE_COST, getTodayXp } from '@/lib/dailyGoal';
import { TOTAL_LESSONS } from '@/lib/unitData';
import { toast } from 'sonner';

const AVATARS = ['🦁', '🦊', '🐺', '🦅', '🐉', '🦋', '🐬', '🦄', '🐺', '🦈'];
const AVATAR_KEY = 'wealthquest_avatar';

function StatCard({ icon: Icon, label, value, color = 'text-primary' }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center text-center">
      <Icon className={`w-5 h-5 mb-1.5 ${color}`} />
      <p className="text-xl font-extrabold text-foreground">{value}</p>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  );
}

export default function Profile() {
  const { progress, updateProgress } = useUserProgress();
  const { dark, toggle: toggleTheme } = useTheme();
  const [goalId, setGoalIdState] = useState(getDailyGoal);
  const [freezeOwned, setFreezeOwned] = useState(hasStreakFreeze);
  const [avatar, setAvatar] = useState(() => localStorage.getItem(AVATAR_KEY) ?? '🦁');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  const xp = progress?.xp ?? 0;
  const coins = progress?.coins ?? 0;
  const streak = progress?.streak_days ?? 0;
  const hearts = progress?.hearts ?? 5;
  const completedLessons = (progress?.completed_lessons ?? []).length;
  const masteredTerms = (progress?.mastered_terms ?? []).length;
  const practiceCount = progress?.practice_sessions ?? 0;
  const achievements = progress?.achievements ?? [];
  const examBest = progress?.exam_best_score ?? 0;
  const todayXp = getTodayXp();
  const goalConfig = getGoalConfig();

  const { current: level, pct: xpPct, xpInLevel, xpNeeded } = getXpProgress(xp);

  function selectGoal(id) {
    setGoalIdState(id);
    setDailyGoal(id);
    toast.success('Daily goal updated!');
  }

  function buyStreakFreeze() {
    if (freezeOwned) { toast('You already have a streak freeze!'); return; }
    if (coins < STREAK_FREEZE_COST) { toast.error(`Need ${STREAK_FREEZE_COST} coins. You have ${coins}.`); return; }
    updateProgress({ coins: coins - STREAK_FREEZE_COST });
    setStreakFreeze(true);
    setFreezeOwned(true);
    toast.success('❄️ Streak Freeze purchased! Your next missed day is protected.');
  }

  function pickAvatar(emoji) {
    setAvatar(emoji);
    localStorage.setItem(AVATAR_KEY, emoji);
    setShowAvatarPicker(false);
    toast.success('Avatar updated!');
  }

  function resetPortfolio() {
    if (!confirm('Reset your portfolio to $10,000 starting cash? This cannot be undone.')) return;
    localStorage.removeItem('wealthquest_portfolio');
    toast.success('Portfolio reset to $10,000');
  }

  function resetProgress() {
    if (!confirm('Reset ALL progress? XP, coins, lessons, achievements — everything. This cannot be undone.')) return;
    localStorage.clear();
    window.location.reload();
  }

  const Section = ({ id, title, children }) => (
    <div className="mb-3">
      <button
        onClick={() => setActiveSection(activeSection === id ? null : id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border rounded-2xl text-left"
      >
        <span className="font-extrabold text-sm text-foreground">{title}</span>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${activeSection === id ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence>
        {activeSection === id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2 pb-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto">
      {/* Header hero */}
      <div className="bg-gradient-to-br from-primary via-violet-600 to-fuchsia-600 px-4 pt-14 pb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <button onClick={() => setShowAvatarPicker(true)}
              className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl shadow-lg active:scale-95 transition-all border-2 border-white/30">
              {avatar}
            </button>
            <div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-wide">Level {level.level}</p>
              <p className="text-white text-xl font-extrabold">{level.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-28 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${xpPct}%` }} />
                </div>
                <span className="text-white/70 text-xs">{xpInLevel}/{xpNeeded} XP</span>
              </div>
            </div>
          </div>
          {/* Dark mode toggle */}
          <button onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white active:scale-95">
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Quick stats row */}
        <div className="flex gap-3 mt-5">
          {[
            { emoji: '⚡', val: xp, label: 'XP' },
            { emoji: '💰', val: coins, label: 'Coins' },
            { emoji: '🔥', val: streak, label: 'Streak' },
          ].map(s => (
            <div key={s.label} className="flex-1 bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-white font-extrabold text-lg">{s.val.toLocaleString()}</p>
              <p className="text-white/70 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Avatar picker */}
      <AnimatePresence>
        {showAvatarPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center px-4 pb-8"
            onClick={e => e.target === e.currentTarget && setShowAvatarPicker(false)}>
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
              className="w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl">
              <p className="font-extrabold text-foreground mb-4 text-center">Choose your avatar</p>
              <div className="grid grid-cols-5 gap-3">
                {AVATARS.map(e => (
                  <button key={e} onClick={() => pickAvatar(e)}
                    className={`h-14 rounded-2xl text-3xl flex items-center justify-center transition-all active:scale-90 ${
                      avatar === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted'
                    }`}>
                    {e}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pt-5 space-y-1">

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatCard icon={BookOpen}  label="Lessons"  value={completedLessons} color="text-emerald-500" />
          <StatCard icon={Zap}       label="Terms"     value={masteredTerms}    color="text-primary" />
          <StatCard icon={Target}    label="Practice"  value={practiceCount}    color="text-violet-500" />
          <StatCard icon={Flame}     label="Streak"    value={`${streak}d`}     color="text-amber-500" />
          <StatCard icon={Star}      label="Exam Best" value={`${examBest}%`}   color="text-yellow-500" />
          <StatCard icon={Heart}     label="Hearts"    value={hearts}           color="text-rose-500" />
        </div>

        {/* Level path */}
        <Section id="levels" title="🏆 Level Progress">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            {LEVELS.map(lvl => {
              const done = xp >= lvl.maxXp;
              const active = level.level === lvl.level;
              return (
                <div key={lvl.level} className={`flex items-center gap-3 ${active ? '' : 'opacity-50'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold ${done || active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    {done ? <Check className="w-4 h-4" /> : lvl.level}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{lvl.title}</p>
                    <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all"
                        style={{ width: active ? `${xpPct}%` : done ? '100%' : '0%' }} />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{lvl.minXp} XP</span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Daily goal */}
        <Section id="goal" title="🎯 Daily Goal">
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-muted-foreground">Today's progress</p>
              <span className="text-xs font-extrabold text-primary">{todayXp} / {goalConfig.xp} XP</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-4">
              <motion.div className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (todayXp / goalConfig.xp) * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DAILY_GOALS.map(g => (
                <button key={g.id} onClick={() => selectGoal(g.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                    goalId === g.id ? 'border-primary bg-primary/10' : 'border-border bg-muted/50'
                  }`}>
                  <span className="text-lg">{g.emoji}</span>
                  <div>
                    <p className="text-xs font-extrabold text-foreground">{g.label}</p>
                    <p className="text-[10px] text-muted-foreground">{g.xp} XP · {g.desc}</p>
                  </div>
                  {goalId === g.id && <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Streak freeze */}
          <div className={`bg-card border rounded-2xl p-4 ${freezeOwned ? 'border-cyan-400/50 bg-cyan-50/5' : 'border-border'}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">❄️</span>
              <div className="flex-1">
                <p className="font-extrabold text-sm text-foreground">Streak Freeze</p>
                <p className="text-xs text-muted-foreground">
                  {freezeOwned ? 'Active — your streak is protected for one missed day' : 'Protect your streak from one missed day'}
                </p>
              </div>
              {freezeOwned ? (
                <span className="text-xs font-extrabold text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30 px-2 py-1 rounded-lg">Owned</span>
              ) : (
                <button onClick={buyStreakFreeze}
                  className="text-xs font-extrabold bg-primary text-white px-3 py-1.5 rounded-xl active:scale-95">
                  {STREAK_FREEZE_COST} 💰
                </button>
              )}
            </div>
          </div>
        </Section>

        {/* Achievements */}
        <Section id="achievements" title={`🏅 Achievements (${achievements.length}/${ACHIEVEMENTS.length})`}>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="grid grid-cols-4 gap-3">
              {ACHIEVEMENTS.map(a => {
                const unlocked = achievements.includes(a.id);
                return (
                  <div key={a.id} title={a.title} className={`flex flex-col items-center text-center gap-1 ${unlocked ? '' : 'opacity-30'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                      unlocked ? 'bg-gradient-to-br from-yellow-300 to-amber-400' : 'bg-muted'
                    }`}>
                      {a.icon}
                    </div>
                    <p className="text-[9px] font-bold text-foreground leading-tight">{a.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* Settings */}
        <Section id="settings" title="⚙️ Settings">
          <div className="bg-card border border-border rounded-2xl divide-y divide-border">
            <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
              <div className="flex items-center gap-3">
                {dark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                <span className="text-sm font-bold text-foreground">{dark ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors relative ${dark ? 'bg-primary' : 'bg-muted'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${dark ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </button>
            <button onClick={() => setShowAvatarPicker(true)} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
              <div className="flex items-center gap-3">
                <span className="text-base">{avatar}</span>
                <span className="text-sm font-bold text-foreground">Change Avatar</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={resetPortfolio} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
              <div className="flex items-center gap-3">
                <span className="text-base">💼</span>
                <span className="text-sm font-bold text-foreground">Reset Portfolio</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={resetProgress} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
              <div className="flex items-center gap-3">
                <span className="text-base">🔄</span>
                <span className="text-sm font-bold text-rose-500">Reset All Progress</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </Section>

      </div>
    </div>
  );
}
