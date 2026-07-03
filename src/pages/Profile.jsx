import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Shield, Zap, Flame, Heart, Trophy, Star, BookOpen, Target, ChevronRight, Check, Crown, Share2, Globe, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserProgress } from '@/lib/useUserProgress';
import { useTheme } from '@/lib/themeContext';
import { getLevelForXp, getXpProgress, LEVELS } from '@/lib/levelData';
import { ACHIEVEMENTS, RARITY_COLOR, RARITY_LABEL } from '@/lib/achievementData';
import { DAILY_GOALS, getGoalConfig, setDailyGoal, getDailyGoal, hasStreakFreeze, setStreakFreeze, STREAK_FREEZE_COST, getTodayXp } from '@/lib/dailyGoal';
import { TOTAL_LESSONS } from '@/lib/unitData';
import { getMultiplierLabel } from '@/lib/streakMultiplier';
import { COUNTRIES, getMyCountry, setMyCountry, getCountryByCode } from '@/lib/countryData';
import { toast } from 'sonner';
import { useAuth } from '@/lib/authContext';

const AVATARS = ['🦁', '🦊', '🐺', '🦅', '🐉', '🦋', '🐬', '🦄', '🐻', '🦈', '🐯', '🦉', '🐸', '🦝', '🐼'];
const AVATAR_KEY = 'wealthquest_avatar';

// ── League config (mirrors League.jsx) ───────────────────────────────────────
const LEAGUES = [
  { name: 'Bronze',   minXp: 0,    icon: '🥉', color: 'from-amber-800 to-amber-500',   text: 'text-amber-400'   },
  { name: 'Silver',   minXp: 300,  icon: '🥈', color: 'from-slate-600 to-slate-300',   text: 'text-slate-300'   },
  { name: 'Gold',     minXp: 800,  icon: '🥇', color: 'from-yellow-600 to-amber-300',  text: 'text-yellow-300'  },
  { name: 'Platinum', minXp: 1500, icon: '💠', color: 'from-cyan-700 to-teal-300',     text: 'text-cyan-300'    },
  { name: 'Diamond',  minXp: 3000, icon: '💎', color: 'from-violet-700 to-fuchsia-400',text: 'text-violet-300'  },
  { name: 'Legend',   minXp: 6000, icon: '👑', color: 'from-rose-600 to-amber-300',    text: 'text-amber-200'   },
];
function getLeague(xp) { for (let i = LEAGUES.length - 1; i >= 0; i--) { if (xp >= LEAGUES[i].minXp) return LEAGUES[i]; } return LEAGUES[0]; }

// Rarity glow configs
const RARITY_GLOW = {
  common:    { ring: 'ring-slate-400/50',    glow: '',                        bg: 'from-slate-700 to-slate-500'       },
  rare:      { ring: 'ring-blue-400/60',     glow: 'shadow-blue-400/40',      bg: 'from-blue-700 to-blue-400'         },
  epic:      { ring: 'ring-violet-400/70',   glow: 'shadow-violet-400/50',    bg: 'from-violet-700 to-violet-400'     },
  legendary: { ring: 'ring-amber-400/80',    glow: 'shadow-amber-300/60',     bg: 'from-amber-600 to-yellow-300'      },
};

// ── Country Picker ────────────────────────────────────────────────────────────
function CountryPicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-4" onClick={onClose}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        className="w-full max-w-sm bg-card rounded-3xl overflow-hidden shadow-2xl max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="font-extrabold text-foreground">Select Your Country</p>
            <button onClick={onClose} className="text-muted-foreground text-xl">×</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search countries..." autoFocus
            className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.map(c => (
            <button key={c.code} onClick={() => { onSelect(c.code); onClose(); }}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/50 active:bg-muted transition-colors text-left border-b border-border/50 last:border-0">
              <span className="text-2xl">{c.flag}</span>
              <span className="font-bold text-sm text-foreground">{c.name}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Profile() {
  const { progress, updateProgress } = useUserProgress();
  const { dark, toggle: toggleTheme } = useTheme();
  const { user, player, signOut, updatePlayer, isAuthenticated } = useAuth();
  const [goalId, setGoalIdState] = useState(getDailyGoal);
  const [freezeOwned, setFreezeOwned] = useState(hasStreakFreeze);
  const [avatar, setAvatar] = useState(() => player?.avatar ?? localStorage.getItem(AVATAR_KEY) ?? '🦁');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [myCountry, setMyCountryState] = useState(() => player?.country_code ?? getMyCountry());
  const [showPicker, setShowPicker] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const xp            = progress?.xp ?? 0;
  const coins         = progress?.coins ?? 0;
  const streak        = progress?.streak_days ?? 0;
  const hearts        = progress?.hearts ?? 5;
  const completedLessons = (progress?.completed_lessons ?? []).length;
  const masteredTerms = (progress?.mastered_terms ?? []).length;
  const practiceCount = progress?.practice_sessions ?? 0;
  const achievements  = progress?.achievements ?? [];
  const examBest      = progress?.exam_best_score ?? 0;
  const todayXp       = getTodayXp();
  const goalConfig    = getGoalConfig();

  const { current: level, pct: xpPct, xpInLevel, xpNeeded } = getXpProgress(xp);
  const league        = getLeague(xp);
  const multiplierLabel = getMultiplierLabel(streak);
  const myCountryData = myCountry ? getCountryByCode(myCountry) : null;

  function selectGoal(id) { setGoalIdState(id); setDailyGoal(id); toast.success('Daily goal updated!'); }

  function buyStreakFreeze() {
    if (freezeOwned) { toast('You already have a streak freeze!'); return; }
    if (coins < STREAK_FREEZE_COST) { toast.error(`Need ${STREAK_FREEZE_COST} coins. You have ${coins}.`); return; }
    updateProgress({ coins: coins - STREAK_FREEZE_COST });
    setStreakFreeze(true); setFreezeOwned(true);
    toast.success('❄️ Streak Freeze purchased!');
  }

  function pickAvatar(emoji) {
    setAvatar(emoji);
    localStorage.setItem(AVATAR_KEY, emoji);
    if (isAuthenticated) updatePlayer({ avatar: emoji });
    setShowAvatarPicker(false);
    toast.success('Avatar updated!');
  }

  function handleSelectCountry(code) {
    setMyCountry(code);
    setMyCountryState(code);
    if (isAuthenticated) updatePlayer({ country_code: code });
    toast.success(`${getCountryByCode(code)?.flag} Representing ${getCountryByCode(code)?.name}!`);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    toast.success('Signed out.');
  }

  function resetPortfolio() {
    if (!confirm('Reset your portfolio to $10,000 starting cash? This cannot be undone.')) return;
    localStorage.removeItem('wealthquest_portfolio'); toast.success('Portfolio reset to $10,000');
  }

  function resetProgress() {
    if (!confirm('Reset ALL progress? XP, coins, lessons, achievements — everything. This cannot be undone.')) return;
    localStorage.clear(); window.location.reload();
  }

  function shareReferral() {
    const name = localStorage.getItem('wealthquest_display_name') ?? 'A friend';
    const url = 'https://monelingo.vercel.app';
    const text = `${name} challenged you to learn finance on WealthQuest! 🏆\nJoin: ${url}`;
    if (navigator.share) { navigator.share({ title: 'WealthQuest', text, url }); }
    else { navigator.clipboard.writeText(text); toast.success('Referral link copied!'); }
  }

  // Group achievements by rarity
  const RARITY_ORDER = ['legendary', 'epic', 'rare', 'common'];
  const grouped = RARITY_ORDER.map(r => ({ rarity: r, items: ACHIEVEMENTS.filter(a => (a.rarity ?? 'common') === r) }));

  const Section = ({ id, title, children }) => (
    <div className="mb-3">
      <button onClick={() => setActiveSection(activeSection === id ? null : id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border rounded-2xl text-left">
        <span className="font-extrabold text-sm text-foreground">{title}</span>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${activeSection === id ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence>
        {activeSection === id && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mt-2 space-y-2 pb-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto">

      {/* ── Hero header ── */}
      <div className="bg-gradient-to-br from-primary via-violet-600 to-fuchsia-600 px-4 pt-14 pb-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative">
          <div className="flex items-start justify-between mb-5">
            {/* Left: avatar + name + level */}
            <div className="flex items-center gap-4">
              <button onClick={() => setShowAvatarPicker(true)}
                className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl shadow-lg active:scale-95 transition-all border-2 border-white/30 relative">
                {avatar}
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-card rounded-full flex items-center justify-center text-[10px] border border-border">
                  ✏️
                </div>
              </button>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-sm font-extrabold bg-gradient-to-r ${league.color} bg-clip-text text-transparent`}>
                    {league.icon} {league.name}
                  </span>
                </div>
                {player?.name && (
                  <p className="text-white font-extrabold text-base leading-tight">{player.name}</p>
                )}
                <p className="text-white/70 text-sm font-bold">{level.emoji} {level.title}</p>
                <p className="text-white/50 text-xs">Level {level.level}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-28 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: `${xpPct}%` }} />
                  </div>
                  <span className="text-white/70 text-xs">{xpInLevel}/{xpNeeded}</span>
                </div>
              </div>
            </div>
            <button onClick={toggleTheme} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white active:scale-95">
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          {/* Country selector */}
          <button onClick={() => setShowPicker(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 mb-4 active:scale-95 transition-all w-fit">
            {myCountryData ? (
              <>
                <span className="text-base">{myCountryData.flag}</span>
                <span className="text-white/80 text-xs font-bold">{myCountryData.name}</span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 text-white/60" />
                <span className="text-white/60 text-xs font-bold">Set your country →</span>
              </>
            )}
          </button>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { emoji: '⚡', val: xp.toLocaleString(), label: 'XP' },
              { emoji: '💰', val: coins.toLocaleString(), label: 'Coins' },
              { emoji: '🔥', val: `${streak}d${multiplierLabel ? ` ${multiplierLabel}` : ''}`, label: 'Streak' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-lg mb-0.5">{s.emoji}</p>
                <p className="text-white font-extrabold text-sm">{s.val}</p>
                <p className="text-white/60 text-[10px]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Link to="/pro" className="flex-1">
              <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl py-2.5 active:scale-95">
                <Crown className="w-4 h-4 text-white" />
                <span className="text-white font-extrabold text-sm">Upgrade Pro</span>
              </div>
            </Link>
            <button onClick={shareReferral} className="flex items-center gap-2 bg-white/20 rounded-2xl px-4 py-2.5 active:scale-95">
              <Share2 className="w-4 h-4 text-white" />
              <span className="text-white font-extrabold text-sm">Invite</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Rank badge strip ── */}
      <div className={`bg-gradient-to-r ${league.color} px-5 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{league.icon}</span>
          <div>
            <p className="text-white font-extrabold text-sm">{league.name} League</p>
            <p className="text-white/70 text-xs">
              {LEAGUES.findIndex(l => l.name === league.name) < LEAGUES.length - 1
                ? `${(LEAGUES[LEAGUES.findIndex(l => l.name === league.name) + 1].minXp - xp).toLocaleString()} XP to ${LEAGUES[LEAGUES.findIndex(l => l.name === league.name) + 1].name}`
                : 'Max league reached 🏆'}
            </p>
          </div>
        </div>
        <Link to="/league" className="bg-white/20 rounded-xl px-3 py-1.5 active:scale-95">
          <span className="text-white text-xs font-extrabold">Leaderboard →</span>
        </Link>
      </div>

      <div className="px-4 pt-5 space-y-1">

        {/* ── Quick stats ── */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { emoji: '📚', label: 'Lessons', value: completedLessons, color: 'text-emerald-500' },
            { emoji: '🧠', label: 'Terms', value: masteredTerms, color: 'text-primary' },
            { emoji: '⚔️', label: 'Practice', value: practiceCount, color: 'text-violet-500' },
            { emoji: '🔥', label: 'Streak', value: `${streak}d`, color: 'text-amber-500' },
            { emoji: '🎓', label: 'Exam', value: `${examBest}%`, color: 'text-yellow-500' },
            { emoji: '❤️', label: 'Hearts', value: hearts, color: 'text-rose-500' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center text-center">
              <p className="text-xl mb-0.5">{s.emoji}</p>
              <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Achievements ── */}
        <Section id="achievements" title={`🏅 Achievements (${achievements.length}/${ACHIEVEMENTS.length})`}>
          {grouped.map(({ rarity, items }) => {
            const cfg = RARITY_GLOW[rarity];
            const label = RARITY_LABEL?.[rarity] ?? rarity;
            return (
              <div key={rarity} className="bg-card border border-border rounded-2xl p-4">
                <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-3 ${
                  rarity === 'legendary' ? 'text-amber-400' :
                  rarity === 'epic'      ? 'text-violet-400' :
                  rarity === 'rare'      ? 'text-blue-400' : 'text-muted-foreground'
                }`}>{label} · {items.filter(a => achievements.includes(a.id)).length}/{items.length}</p>
                <div className="grid grid-cols-4 gap-3">
                  {items.map(a => {
                    const unlocked = achievements.includes(a.id);
                    return (
                      <div key={a.id} className="flex flex-col items-center text-center gap-1.5">
                        <div className={`w-13 h-13 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                          unlocked
                            ? `bg-gradient-to-br ${cfg.bg} ring-2 ${cfg.ring} shadow-lg ${cfg.glow}`
                            : 'bg-muted opacity-25'
                        }`}>
                          {a.icon}
                        </div>
                        <p className={`text-[9px] font-bold leading-tight ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>{a.title}</p>
                        {unlocked && rarity !== 'common' && (
                          <span className={`text-[8px] font-extrabold px-1 py-0.5 rounded-full ${
                            rarity === 'legendary' ? 'bg-amber-500/20 text-amber-400' :
                            rarity === 'epic'      ? 'bg-violet-500/20 text-violet-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>{label}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </Section>

        {/* ── Level path ── */}
        <Section id="levels" title="🏆 Level Progress">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            {LEVELS.map(lvl => {
              const done   = xp >= lvl.maxXp;
              const active = level.level === lvl.level;
              return (
                <div key={lvl.level} className={`flex items-center gap-3 ${!done && !active ? 'opacity-40' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 ${
                    done ? 'bg-emerald-500 text-white' : active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}>{done ? '✓' : lvl.emoji ?? lvl.level}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{lvl.title}</p>
                    <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all"
                        style={{ width: active ? `${xpPct}%` : done ? '100%' : '0%' }} />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{lvl.minXp.toLocaleString()} XP</span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── Daily goal ── */}
        <Section id="goal" title="🎯 Daily Goal">
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-muted-foreground">Today</p>
              <span className="text-xs font-extrabold text-primary">{todayXp} / {goalConfig.xp} XP</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-4">
              <motion.div className="h-full bg-primary rounded-full"
                initial={{ width: 0 }} animate={{ width: `${Math.min(100, (todayXp / goalConfig.xp) * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }} />
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
                    <p className="text-[10px] text-muted-foreground">{g.xp} XP</p>
                  </div>
                  {goalId === g.id && <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          <div className={`bg-card border rounded-2xl p-4 ${freezeOwned ? 'border-cyan-400/50' : 'border-border'}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">❄️</span>
              <div className="flex-1">
                <p className="font-extrabold text-sm text-foreground">Streak Freeze</p>
                <p className="text-xs text-muted-foreground">{freezeOwned ? 'Active — streak protected' : 'Protect streak from one missed day'}</p>
              </div>
              {freezeOwned
                ? <span className="text-xs font-extrabold text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded-lg">Owned</span>
                : <button onClick={buyStreakFreeze} className="text-xs font-extrabold bg-primary text-primary-foreground px-3 py-1.5 rounded-xl active:scale-95">{STREAK_FREEZE_COST} 💰</button>}
            </div>
          </div>
        </Section>

        {/* ── Settings ── */}
        <Section id="settings" title="⚙️ Settings">
          <div className="bg-card border border-border rounded-2xl divide-y divide-border">
            <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
              <div className="flex items-center gap-3">
                {dark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                <span className="text-sm font-bold text-foreground">{dark ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <div className={`w-11 h-6 rounded-full relative transition-colors ${dark ? 'bg-primary' : 'bg-muted'}`}>
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
            <button onClick={() => setShowPicker(true)} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
              <div className="flex items-center gap-3">
                <span className="text-base">{myCountryData?.flag ?? '🌍'}</span>
                <span className="text-sm font-bold text-foreground">{myCountryData ? myCountryData.name : 'Set Country'}</span>
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
            {isAuthenticated && (
              <button onClick={handleSignOut} disabled={signingOut}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left disabled:opacity-50">
                <div className="flex items-center gap-3">
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span className="text-sm font-bold text-rose-500">
                    {signingOut ? 'Signing out…' : `Sign Out${user?.email ? ` (${user.email})` : ''}`}
                  </span>
                </div>
              </button>
            )}
          </div>
        </Section>

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
                    }`}>{e}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Country picker */}
      <AnimatePresence>
        {showPicker && <CountryPicker onSelect={handleSelectCountry} onClose={() => setShowPicker(false)} />}
      </AnimatePresence>
    </div>
  );
}
