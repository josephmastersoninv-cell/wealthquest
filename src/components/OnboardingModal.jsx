import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { COUNTRIES, setMyCountry } from '@/lib/countryData';
import { registerPlayer, loginWithEmail, checkUsernameAvailable, checkEmailExists, getMyPlayerId } from '@/lib/playerSync';

const STORAGE_KEY = 'wealthquest_onboarded';
const NAME_KEY = 'wealthquest_display_name';
const AVATAR_KEY = 'wealthquest_avatar';
const GOAL_KEY = 'wealthquest_daily_goal';

const AVATARS = ['🦁', '🐯', '🦊', '🐺', '🦅', '🐬', '🦋', '🐉', '🦄', '🤖', '👑', '⚡'];
const GOALS = [
  { id: 10,  label: 'Casual',  sub: '10 XP / day',  emoji: '🌱' },
  { id: 20,  label: 'Regular', sub: '20 XP / day',  emoji: '🔥' },
  { id: 50,  label: 'Serious', sub: '50 XP / day',  emoji: '⚡' },
  { id: 100, label: 'Intense', sub: '100 XP / day', emoji: '💎' },
];

export default function OnboardingModal() {
  const alreadyDone = !!localStorage.getItem(STORAGE_KEY) && !!getMyPlayerId();
  const [show, setShow] = useState(!alreadyDone);
  const [tab, setTab] = useState('signup'); // 'signup' | 'login'
  const [step, setStep] = useState(0);

  // Sign-up fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('🦁');
  const [goal, setGoal] = useState(20);
  const [country, setCountry] = useState(null);
  const [search, setSearch] = useState('');

  // Validation state
  const [nameStatus, setNameStatus] = useState('idle'); // idle | checking | taken | available
  const [emailError, setEmailError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');

  const nameTimer = useRef(null);

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Debounced username check
  useEffect(() => {
    if (!name.trim() || name.trim().length < 2) { setNameStatus('idle'); return; }
    setNameStatus('checking');
    clearTimeout(nameTimer.current);
    nameTimer.current = setTimeout(async () => {
      const available = await checkUsernameAvailable(name.trim());
      setNameStatus(available ? 'available' : 'taken');
    }, 600);
  }, [name]);

  function validateEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  const canNextStep0 = name.trim().length >= 2 && nameStatus !== 'taken' && nameStatus !== 'checking'
    && validateEmail(email);

  const canNext =
    step === 0 ? canNextStep0 :
    step === 2 ? country !== null :
    true;

  async function finish() {
    setBusy(true);
    setError('');
    localStorage.setItem(STORAGE_KEY, '1');
    if (name.trim()) localStorage.setItem(NAME_KEY, name.trim());
    localStorage.setItem(AVATAR_KEY, avatar);
    localStorage.setItem(GOAL_KEY, String(goal));
    if (country) setMyCountry(country);

    if (!getMyPlayerId()) {
      const result = await registerPlayer({
        name: name.trim() || 'Investor',
        email: email.trim() || null,
        avatar,
        countryCode: country ?? 'US',
      });
      if (!result) {
        setError('Something went wrong. Please try again.');
        setBusy(false);
        return;
      }
    }

    setBusy(false);
    setShow(false);
  }

  async function handleLogin() {
    if (!validateEmail(loginEmail)) { setLoginError('Enter a valid email address.'); return; }
    setLoginBusy(true);
    setLoginError('');
    const player = await loginWithEmail(loginEmail.trim());
    if (!player) {
      setLoginError('No account found with that email. Sign up instead.');
      setLoginBusy(false);
      return;
    }
    if (player.name) localStorage.setItem(NAME_KEY, player.name);
    if (player.avatar) localStorage.setItem(AVATAR_KEY, player.avatar);
    setLoginBusy(false);
    setShow(false);
  }

  const steps = [
    // Step 0 — Name + Email + Avatar
    <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
      <div className="text-center">
        <div className="text-5xl mb-2">{avatar}</div>
        <h2 className="text-2xl font-black text-foreground">Join WealthQuest</h2>
        <p className="text-sm text-muted-foreground mt-1">Compete with players worldwide</p>
      </div>

      {/* Username */}
      <div>
        <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Username</label>
        <div className="relative mt-1.5">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Pick a unique username..."
            className={`w-full h-12 px-4 pr-10 rounded-2xl border-2 bg-muted text-foreground font-bold text-sm outline-none transition-colors ${
              nameStatus === 'taken' ? 'border-rose-500' :
              nameStatus === 'available' ? 'border-emerald-500' :
              'border-border focus:border-primary'
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {nameStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            {nameStatus === 'available' && <Check className="w-4 h-4 text-emerald-500" />}
            {nameStatus === 'taken' && <AlertCircle className="w-4 h-4 text-rose-500" />}
          </div>
        </div>
        {nameStatus === 'taken' && <p className="text-xs text-rose-500 mt-1 font-bold">That username is already taken.</p>}
        {nameStatus === 'available' && <p className="text-xs text-emerald-500 mt-1 font-bold">Username available ✓</p>}
      </div>

      {/* Email */}
      <div>
        <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Email</label>
        <input
          value={email}
          onChange={e => { setEmail(e.target.value); setEmailError(''); }}
          onBlur={() => email && !validateEmail(email) && setEmailError('Enter a valid email.')}
          placeholder="you@example.com"
          type="email"
          className={`mt-1.5 w-full h-12 px-4 rounded-2xl border-2 bg-muted text-foreground font-bold text-sm outline-none transition-colors ${
            emailError ? 'border-rose-500' : 'border-border focus:border-primary'
          }`}
        />
        {emailError && <p className="text-xs text-rose-500 mt-1 font-bold">{emailError}</p>}
        <p className="text-[11px] text-muted-foreground mt-1">Used to log back in if you switch devices</p>
      </div>

      {/* Avatar */}
      <div>
        <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground mb-2 block">Pick your avatar</label>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map(a => (
            <button key={a} onClick={() => setAvatar(a)}
              className={`h-11 rounded-2xl text-2xl flex items-center justify-center transition-all ${avatar === a ? 'bg-primary shadow-lg scale-110' : 'bg-muted hover:bg-muted/80'}`}>
              {a}
            </button>
          ))}
        </div>
      </div>
    </motion.div>,

    // Step 1 — Daily goal
    <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
      <div className="text-center">
        <div className="text-5xl mb-3">🎯</div>
        <h2 className="text-2xl font-black text-foreground">Set your daily goal</h2>
        <p className="text-sm text-muted-foreground mt-1">How much do you want to learn each day?</p>
      </div>
      <div className="space-y-2">
        {GOALS.map(g => (
          <button key={g.id} onClick={() => setGoal(g.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${goal === g.id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
            <span className="text-2xl">{g.emoji}</span>
            <div className="text-left flex-1">
              <p className="font-extrabold text-sm text-foreground">{g.label}</p>
              <p className="text-xs text-muted-foreground">{g.sub}</p>
            </div>
            {goal === g.id && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}
          </button>
        ))}
      </div>
    </motion.div>,

    // Step 2 — Country (required)
    <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
      <div className="text-center">
        <div className="text-5xl mb-3">🌍</div>
        <h2 className="text-2xl font-black text-foreground">Where are you from?</h2>
        <p className="text-sm text-muted-foreground mt-1">Your portfolio counts toward your country's ranking</p>
      </div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search countries..."
        className="w-full h-10 px-4 rounded-2xl border border-border bg-muted text-foreground text-sm outline-none focus:border-primary transition-colors"
      />
      <div className="max-h-48 overflow-y-auto rounded-2xl border border-border divide-y divide-border/50">
        {filteredCountries.map(c => (
          <button key={c.code} onClick={() => setCountry(c.code)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${country === c.code ? 'bg-primary/10' : 'hover:bg-muted/50'}`}>
            <span className="text-lg">{c.flag}</span>
            <span className={`text-sm font-bold flex-1 ${country === c.code ? 'text-primary' : 'text-foreground'}`}>{c.name}</span>
            {country === c.code && <Check className="w-4 h-4 text-primary" />}
          </button>
        ))}
      </div>
      {country && (
        <p className="text-center text-xs font-bold text-primary">
          Representing {COUNTRIES.find(c => c.code === country)?.flag} {COUNTRIES.find(c => c.code === country)?.name}
        </p>
      )}
    </motion.div>,

    // Step 3 — Ready
    <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
      <div className="text-center">
        <div className="text-5xl mb-3">🚀</div>
        <h2 className="text-2xl font-black text-foreground">You're in{name ? `, ${name}` : ''}!</h2>
        <p className="text-sm text-muted-foreground mt-1">Here's what awaits you</p>
      </div>
      <div className="space-y-3">
        {[
          { emoji: '📚', title: '26 lessons', sub: 'From budgeting basics to derivatives' },
          { emoji: '⚔️', title: 'Boss Battles', sub: 'Timed challenges at the end of every unit' },
          { emoji: '🏆', title: 'League rankings', sub: 'Compete with learners worldwide' },
          { emoji: '💼', title: 'Live portfolio', sub: 'Trade real stocks with virtual money' },
        ].map(f => (
          <div key={f.title} className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4">
            <span className="text-2xl">{f.emoji}</span>
            <div>
              <p className="font-extrabold text-sm text-foreground">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>,
  ];

  if (!show) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-6">
      <motion.div initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }}
        className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-2xl border border-border max-h-[92vh] overflow-y-auto">

        {/* Tab switcher — only on first screen */}
        {step === 0 && (
          <div className="flex bg-muted rounded-2xl p-1 mb-5">
            {['signup', 'login'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); setLoginError(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-extrabold transition-all ${tab === t ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}>
                {t === 'signup' ? 'Sign Up' : 'Log In'}
              </button>
            ))}
          </div>
        )}

        {tab === 'login' ? (
          /* ── Login view ── */
          <div className="space-y-5">
            <div className="text-center">
              <div className="text-5xl mb-3">👋</div>
              <h2 className="text-2xl font-black text-foreground">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-1">Enter your email to restore your account</p>
            </div>
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Email</label>
              <input
                value={loginEmail}
                onChange={e => { setLoginEmail(e.target.value); setLoginError(''); }}
                placeholder="you@example.com"
                type="email"
                className="mt-1.5 w-full h-12 px-4 rounded-2xl border-2 border-border bg-muted text-foreground font-bold text-sm outline-none focus:border-primary transition-colors"
              />
              {loginError && <p className="text-xs text-rose-500 mt-1.5 font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{loginError}</p>}
            </div>
            <button
              onClick={handleLogin}
              disabled={loginBusy || !loginEmail.trim()}
              className={`w-full h-14 rounded-2xl font-extrabold text-base transition-all ${!loginBusy && loginEmail.trim() ? 'bg-primary text-white active:scale-95' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
              {loginBusy ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Logging in…</span> : 'Log In →'}
            </button>
          </div>
        ) : (
          /* ── Sign-up view ── */
          <>
            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mb-5">
              {steps.map((_, i) => (
                <div key={i} className={`rounded-full transition-all ${i === step ? 'w-6 h-2 bg-primary' : i < step ? 'w-2 h-2 bg-primary/50' : 'w-2 h-2 bg-muted'}`} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {steps[step]}
            </AnimatePresence>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-xs text-rose-500 font-bold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
              </div>
            )}

            <div className="mt-5 space-y-2">
              <button
                onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : finish()}
                disabled={!canNext || busy}
                className={`w-full h-14 rounded-2xl font-extrabold text-base transition-all ${canNext && !busy ? 'bg-primary text-white active:scale-95' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
                {busy
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating profile…</span>
                  : step < steps.length - 1 ? 'Continue →' : "Let's Go! 🚀"}
              </button>
              {step < steps.length - 1 && step !== 2 && (
                <button onClick={finish} className="w-full text-center text-xs text-muted-foreground py-2">
                  Skip setup
                </button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
