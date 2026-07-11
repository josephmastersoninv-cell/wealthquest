import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { COUNTRIES, setMyCountry } from '@/lib/countryData';
import { useAuth } from '@/lib/authContext';
import { checkUsernameAvailable } from '@/lib/playerSync';
import { isConfigured } from '@/lib/supabase';
import { DAILY_GOALS, setDailyGoal } from '@/lib/dailyGoal';

const IS_LOCAL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const AVATARS  = ['🦁', '🐯', '🦊', '🐺', '🦅', '🐬', '🦋', '🐉', '🦄', '🤖', '👑', '⚡'];
// Canonical goals from dailyGoal.js — keyed by string id so selection actually persists.
const GOALS = DAILY_GOALS.map(g => ({ id: g.id, label: g.label, sub: `${g.xp} XP / day · ${g.desc}`, emoji: g.emoji }));

function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

export default function OnboardingModal() {
  const { user, player, loading, isAuthenticated, signUp, signIn, signInWithGoogle, upsertPlayer, resetPasswordEmail } = useAuth();

  // Show if not authenticated, or authenticated but missing country, or just finished sign-up
  const [signupComplete, setSignupComplete] = useState(false);
  const needsAuth    = !isAuthenticated;
  const needsProfile = isAuthenticated && player && !player.country_code;
  const show         = !loading && (needsAuth || needsProfile || signupComplete);

  const [tab, setTab]   = useState('signup');
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Collected across steps (account NOT created until step 4)
  const [avatar,   setAvatar]   = useState('🦁');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [country,  setCountry]  = useState(null);
  const [search,   setSearch]   = useState('');
  const [goal,     setGoal]     = useState('regular');
  const [nameStatus, setNameStatus] = useState('idle');
  const nameTimer = useRef(null);

  const [step, setStep] = useState(0);
  // 0 = avatar, 1 = credentials, 2 = country, 3 = goal, 4 = confirm

  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!name.trim() || name.trim().length < 2) { setNameStatus('idle'); return; }
    setNameStatus('checking');
    clearTimeout(nameTimer.current);
    nameTimer.current = setTimeout(async () => {
      const ok = await checkUsernameAvailable(name.trim());
      setNameStatus(ok ? 'available' : 'taken');
    }, 600);
    return () => clearTimeout(nameTimer.current);
  }, [name]);

  if (!show) return null;

  // Already authenticated but missing country → jump straight to country picker
  if (needsProfile && !needsAuth && !signupComplete) {
    return <ProfileCompleteModal player={player} upsertPlayer={upsertPlayer} setMyCountry={setMyCountry} />;
  }

  // ── Success screen (shown after account created + profile saved) ──────────────
  if (signupComplete) {
    return (
      <Backdrop>
        <div className="text-center space-y-5">
          <div className="text-6xl">🚀</div>
          <h2 className="text-2xl font-black text-foreground">You're in{name ? `, ${name}` : ''}!</h2>
          <p className="text-sm text-muted-foreground">Your account is ready. Time to start building wealth.</p>
          <div className="space-y-3 text-left">
            {[
              { emoji: '📚', title: '50 financial terms', sub: 'Learn through flashcards' },
              { emoji: '⚔️', title: 'Final Exam', sub: 'Prove your mastery' },
              { emoji: '🏆', title: 'League rankings', sub: 'Compete with real players worldwide' },
              { emoji: '💼', title: 'Live portfolio', sub: 'Trade with virtual money against the market' },
            ].map(f => (
              <div key={f.title} className="flex items-center gap-4 bg-card border border-border rounded-2xl p-3">
                <span className="text-2xl">{f.emoji}</span>
                <div>
                  <p className="font-extrabold text-sm text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setSignupComplete(false)}
            className="w-full h-14 rounded-2xl bg-primary text-white font-extrabold text-base active:scale-95 transition-all">
            Start Now →
          </button>
        </div>
      </Backdrop>
    );
  }

  // ── Awaiting email confirmation ────────────────────────────────────────────────
  if (awaitingConfirmation) {
    return (
      <Backdrop>
        <div className="text-center space-y-4">
          <div className="text-5xl">📧</div>
          <h2 className="text-2xl font-black text-foreground">Check your inbox</h2>
          <p className="text-sm text-muted-foreground">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
          <p className="text-xs text-muted-foreground">Once confirmed, come back and sign in.</p>
          <button onClick={() => { setAwaitingConfirmation(false); setTab('login'); }}
            className="w-full h-12 rounded-2xl bg-primary text-white font-extrabold text-sm active:scale-95 transition-all">
            Go to Sign In →
          </button>
        </div>
      </Backdrop>
    );
  }

  // ── Creates account + saves profile — called only at final step ───────────────
  async function handleCreateAccount() {
    if (!validateEmail(email)) { setErr('Enter a valid email address.'); return 'error'; }
    if (password.length < 6)   { setErr('Password must be at least 6 characters.'); return 'error'; }
    if (nameStatus === 'taken') { setErr('Username is already taken.'); return 'error'; }
    if (!country)              { setErr('Please pick a country first.'); return 'error'; }
    setDailyGoal(goal); // persist goal now so it survives email-confirmation flow
    setBusy(true); setErr('');
    try {
      const result = await signUp({
        email: email.trim(),
        password,
        name:        name.trim() || email.split('@')[0],
        avatar,
        countryCode: country,
      });
      const newUser  = result?.user;
      const hasSession = !!result?.session;

      // Email confirmation required
      if (!hasSession && newUser && !newUser.confirmed_at) {
        setAwaitingConfirmation(true);
        return 'awaiting';
      }

      // Session created immediately — save extra profile fields now
      setDailyGoal(goal);
      setMyCountry(country);
      // upsertPlayer uses the newly-signed-in user from authContext
      await upsertPlayer({
        name: name.trim() || email.split('@')[0] || 'Investor',
        avatar,
        country_code: country,
        xp: 0,
        portfolio_value: 10000,
      });
      setSignupComplete(true);
      return 'ok';
    } catch (e) {
      setErr(e.message ?? 'Sign up failed. Try again.');
      return 'error';
    } finally {
      setBusy(false);
    }
  }

  async function handleSignIn() {
    if (!validateEmail(email)) { setErr('Enter a valid email address.'); return; }
    if (!password)             { setErr('Enter your password.'); return; }
    setBusy(true); setErr('');
    try {
      await signIn({ email: email.trim(), password });
    } catch (e) {
      setErr(e.message ?? 'Sign in failed. Check your credentials.');
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    if (!validateEmail(email)) { setErr('Enter the email you signed up with.'); return; }
    setBusy(true); setErr('');
    try {
      await resetPasswordEmail(email.trim());
      setForgotSent(true);
    } catch (e) {
      setErr(e.message ?? 'Could not send reset email.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true); setErr('');
    try {
      await signInWithGoogle();
    } catch (e) {
      setErr(e.message ?? 'Google sign in failed.');
      setBusy(false);
    }
  }

  // ── Sign-up steps (account created at step 4) ─────────────────────────────────
  const signUpSteps = [
    // Step 0: avatar
    <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
      <div className="text-center">
        <div className="text-6xl mb-2">{avatar}</div>
        <h2 className="text-2xl font-black text-foreground">Pick your avatar</h2>
        <p className="text-sm text-muted-foreground mt-1">Who are you on the leaderboard?</p>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {AVATARS.map(a => (
          <button key={a} onClick={() => setAvatar(a)}
            className={`h-11 rounded-2xl text-2xl flex items-center justify-center transition-all ${avatar === a ? 'bg-primary shadow-lg scale-110' : 'bg-muted hover:bg-muted/80'}`}>
            {a}
          </button>
        ))}
      </div>
    </motion.div>,

    // Step 1: credentials
    <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
      <div className="text-center">
        <div className="text-5xl mb-2">{avatar}</div>
        <h2 className="text-2xl font-black text-foreground">Create your account</h2>
        <p className="text-sm text-muted-foreground mt-1">Compete with players worldwide</p>
      </div>

      {isConfigured && !IS_LOCAL && (
        <button onClick={handleGoogle} disabled={busy}
          className="w-full h-12 rounded-2xl border-2 border-border bg-card flex items-center justify-center gap-3 font-extrabold text-sm text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-50">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.7 2.4 30.2 0 24 0 14.7 0 6.7 5.4 2.8 13.3l7.9 6.1C12.5 13.2 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.4 5.5-5 7.2l7.8 6c4.5-4.2 7-10.4 7-17.2z"/><path fill="#FBBC05" d="M10.7 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.7-4.6L2.3 13.3A24 24 0 0 0 0 24c0 3.8.9 7.4 2.4 10.6l8.3-6z"/><path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.8-6c-2 1.4-4.7 2.2-7.4 2.2-6.2 0-11.5-4.2-13.3-9.9l-8.3 6C6.7 42.6 14.7 48 24 48z"/></svg>
          Continue with Google
        </button>
      )}
      {isConfigured && !IS_LOCAL && <Divider />}

      {/* Username */}
      <div>
        <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Username</label>
        <div className="relative mt-1.5">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Pick a username…"
            className={`w-full h-12 px-4 pr-10 rounded-2xl border-2 bg-muted text-foreground font-bold text-sm outline-none transition-colors ${nameStatus === 'taken' ? 'border-rose-500' : nameStatus === 'available' ? 'border-emerald-500' : 'border-border focus:border-primary'}`} />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {nameStatus === 'checking'  && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            {nameStatus === 'available' && <Check className="w-4 h-4 text-emerald-500" />}
            {nameStatus === 'taken'     && <AlertCircle className="w-4 h-4 text-rose-500" />}
          </div>
        </div>
        {nameStatus === 'taken'     && <p className="text-xs text-rose-500 mt-1 font-bold">Username taken.</p>}
        {nameStatus === 'available' && <p className="text-xs text-emerald-500 mt-1 font-bold">Available ✓</p>}
      </div>

      {/* Email */}
      <div>
        <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email"
          className="mt-1.5 w-full h-12 px-4 rounded-2xl border-2 border-border bg-muted text-foreground font-bold text-sm outline-none focus:border-primary transition-colors" />
      </div>

      {/* Password */}
      <div>
        <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Password</label>
        <div className="relative mt-1.5">
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" type={showPw ? 'text' : 'password'}
            className="w-full h-12 px-4 pr-10 rounded-2xl border-2 border-border bg-muted text-foreground font-bold text-sm outline-none focus:border-primary transition-colors" />
          <button onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.div>,

    // Step 2: country
    <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
      <div className="text-center">
        <div className="text-5xl mb-2">🌍</div>
        <h2 className="text-xl font-black text-foreground">Where are you from?</h2>
        <p className="text-sm text-muted-foreground mt-1">Your portfolio counts toward your country's total</p>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search countries…"
        className="w-full h-10 px-4 rounded-2xl border border-border bg-muted text-foreground text-sm outline-none focus:border-primary transition-colors" />
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
    </motion.div>,

    // Step 3: daily goal
    <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
      <div className="text-center">
        <div className="text-5xl mb-2">🎯</div>
        <h2 className="text-xl font-black text-foreground">Set your daily goal</h2>
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

    // Step 4: confirm + create account
    <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
      <div className="text-center">
        <div className="text-5xl mb-2">{avatar}</div>
        <h2 className="text-xl font-black text-foreground">Ready to go{name ? `, ${name}` : ''}?</h2>
        <p className="text-sm text-muted-foreground mt-1">Everything looks good — let's create your account</p>
      </div>
      <div className="space-y-2">
        {[
          { label: 'Avatar',   value: avatar },
          { label: 'Username', value: name || email.split('@')[0] || '—' },
          { label: 'Country',  value: country ? (COUNTRIES.find(c => c.code === country)?.flag ?? '') + ' ' + (COUNTRIES.find(c => c.code === country)?.name ?? country) : '—' },
          { label: 'Goal',     value: (GOALS.find(g => g.id === goal)?.emoji ?? '') + ' ' + (GOALS.find(g => g.id === goal)?.label ?? '') },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between bg-muted rounded-2xl px-4 py-3">
            <span className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{row.label}</span>
            <span className="text-sm font-extrabold text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </motion.div>,
  ];

  const isLastStep  = step === signUpSteps.length - 1;
  const canStep1Next = validateEmail(email) && password.length >= 6 && nameStatus !== 'taken' && nameStatus !== 'checking';
  const canStepNext = step === 1 ? canStep1Next : step === 2 ? country !== null : true;

  async function advance() {
    if (isLastStep) {
      await handleCreateAccount();
    } else {
      setStep(s => s + 1);
    }
  }

  return (
    <Backdrop>
      {/* Tab switcher (only on step 0 / 1 of sign-up) */}
      {step <= 1 && (
        <div className="flex bg-muted rounded-2xl p-1 mb-5">
          {['signup', 'login'].map(t => (
            <button key={t} onClick={() => { setTab(t); setErr(''); }}
              className={`flex-1 py-2 rounded-xl text-sm font-extrabold transition-all ${tab === t ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}>
              {t === 'signup' ? 'Sign Up' : 'Sign In'}
            </button>
          ))}
        </div>
      )}

      {tab === 'login' ? (
        <LoginView
          email={email} setEmail={setEmail}
          password={password} setPassword={setPassword}
          showPw={showPw} setShowPw={setShowPw}
          busy={busy} err={err} setErr={setErr}
          onSubmit={handleSignIn}
          onGoogle={handleGoogle}
          isConfigured={isConfigured}
          forgotMode={forgotMode} setForgotMode={m => { setForgotMode(m); setErr(''); setForgotSent(false); }}
          forgotSent={forgotSent}
          onForgotPassword={handleForgotPassword}
        />
      ) : (
        <>
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-5">
            {signUpSteps.map((_, i) => (
              <div key={i} className={`rounded-full transition-all ${i === step ? 'w-6 h-2 bg-primary' : i < step ? 'w-2 h-2 bg-primary/50' : 'w-2 h-2 bg-muted'}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">{signUpSteps[step]}</AnimatePresence>

          {err && (
            <div className="mt-3 flex items-center gap-2 text-xs text-rose-500 font-bold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{err}
            </div>
          )}

          <div className="mt-5 space-y-2">
            <button onClick={advance} disabled={!canStepNext || busy}
              className={`w-full h-14 rounded-2xl font-extrabold text-base transition-all ${canStepNext && !busy ? 'bg-primary text-white active:scale-95' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
              {busy
                ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{isLastStep ? 'Creating account…' : 'Saving…'}</span>
                : isLastStep ? 'Create Account 🚀' : 'Continue →'}
            </button>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="w-full text-center text-xs text-muted-foreground py-2">← Back</button>
            )}
          </div>
        </>
      )}
    </Backdrop>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Backdrop({ children }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-6">
      <motion.div initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }}
        className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-2xl border border-border max-h-[92vh] overflow-y-auto">
        {children}
      </motion.div>
    </motion.div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-bold">OR</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function LoginView({ email, setEmail, password, setPassword, showPw, setShowPw, busy, err, setErr, onSubmit, onGoogle, isConfigured, forgotMode, setForgotMode, forgotSent, onForgotPassword }) {
  // ── Forgot password screen ──
  if (forgotMode) {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <div className="text-5xl mb-2">🔑</div>
          <h2 className="text-2xl font-black text-foreground">Reset password</h2>
          <p className="text-sm text-muted-foreground mt-1">We'll send a reset link to your email</p>
        </div>

        {forgotSent ? (
          <div className="space-y-4 text-center">
            <div className="text-5xl">📧</div>
            <p className="text-sm text-foreground font-bold">Reset link sent to <span className="text-primary">{email}</span></p>
            <p className="text-xs text-muted-foreground">Click the link in the email to set a new password. Check your spam folder if you don't see it.</p>
            <button onClick={() => setForgotMode(false)}
              className="w-full h-12 rounded-2xl bg-primary text-white font-extrabold text-sm active:scale-95 transition-all">
              ← Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Email</label>
              <input value={email} onChange={e => { setEmail(e.target.value); setErr(''); }} placeholder="you@example.com" type="email" autoFocus
                className="mt-1.5 w-full h-12 px-4 rounded-2xl border-2 border-border bg-muted text-foreground font-bold text-sm outline-none focus:border-primary transition-colors" />
            </div>
            {err && <p className="text-xs text-rose-500 font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{err}</p>}
            <button onClick={onForgotPassword} disabled={busy || !email}
              className={`w-full h-14 rounded-2xl font-extrabold text-base transition-all ${!busy && email ? 'bg-primary text-white active:scale-95' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
              {busy ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Sending…</span> : 'Send Reset Link →'}
            </button>
            <button onClick={() => setForgotMode(false)} className="w-full text-center text-xs text-muted-foreground py-1">← Back to Sign In</button>
          </>
        )}
      </div>
    );
  }

  // ── Normal sign-in screen ──
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-5xl mb-2">👋</div>
        <h2 className="text-2xl font-black text-foreground">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">Sign in to restore your progress</p>
      </div>

      {isConfigured && !IS_LOCAL && (
        <button onClick={onGoogle} disabled={busy}
          className="w-full h-12 rounded-2xl border-2 border-border bg-card flex items-center justify-center gap-3 font-extrabold text-sm text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-50">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.7 2.4 30.2 0 24 0 14.7 0 6.7 5.4 2.8 13.3l7.9 6.1C12.5 13.2 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.4 5.5-5 7.2l7.8 6c4.5-4.2 7-10.4 7-17.2z"/><path fill="#FBBC05" d="M10.7 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.7-4.6L2.3 13.3A24 24 0 0 0 0 24c0 3.8.9 7.4 2.4 10.6l8.3-6z"/><path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.8-6c-2 1.4-4.7 2.2-7.4 2.2-6.2 0-11.5-4.2-13.3-9.9l-8.3 6C6.7 42.6 14.7 48 24 48z"/></svg>
          Continue with Google
        </button>
      )}
      {isConfigured && !IS_LOCAL && <Divider />}

      <div>
        <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Email</label>
        <input value={email} onChange={e => { setEmail(e.target.value); setErr(''); }} placeholder="you@example.com" type="email"
          className="mt-1.5 w-full h-12 px-4 rounded-2xl border-2 border-border bg-muted text-foreground font-bold text-sm outline-none focus:border-primary transition-colors" />
      </div>
      <div>
        <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Password</label>
        <div className="relative mt-1.5">
          <input value={password} onChange={e => { setPassword(e.target.value); setErr(''); }} placeholder="Your password" type={showPw ? 'text' : 'password'}
            className="w-full h-12 px-4 pr-10 rounded-2xl border-2 border-border bg-muted text-foreground font-bold text-sm outline-none focus:border-primary transition-colors" />
          <button onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button onClick={() => setForgotMode(true)} className="mt-1.5 text-xs text-primary font-bold float-right">
          Forgot password?
        </button>
      </div>

      {err && <p className="text-xs text-rose-500 font-bold flex items-center gap-1 clear-both"><AlertCircle className="w-3.5 h-3.5" />{err}</p>}

      <button onClick={onSubmit} disabled={busy || !email || !password}
        className={`w-full h-14 rounded-2xl font-extrabold text-base transition-all ${!busy && email && password ? 'bg-primary text-white active:scale-95' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
        {busy ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Signing in…</span> : 'Sign In →'}
      </button>
    </div>
  );
}

function ProfileCompleteModal({ player, upsertPlayer, setMyCountry }) {
  const [country, setCountry] = useState(null);
  const [search,  setSearch]  = useState('');
  const [busy,    setBusy]    = useState(false);

  const filtered = COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  async function save() {
    if (!country) return;
    setBusy(true);
    setMyCountry(country);
    await upsertPlayer({ country_code: country });
    setBusy(false);
  }

  return (
    <Backdrop>
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-5xl mb-2">🌍</div>
          <h2 className="text-xl font-black text-foreground">One last thing</h2>
          <p className="text-sm text-muted-foreground mt-1">Which country are you representing?</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search countries…"
          className="w-full h-10 px-4 rounded-2xl border border-border bg-muted text-foreground text-sm outline-none focus:border-primary transition-colors" />
        <div className="max-h-56 overflow-y-auto rounded-2xl border border-border divide-y divide-border/50">
          {filtered.map(c => (
            <button key={c.code} onClick={() => setCountry(c.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${country === c.code ? 'bg-primary/10' : 'hover:bg-muted/50'}`}>
              <span className="text-lg">{c.flag}</span>
              <span className={`text-sm font-bold flex-1 ${country === c.code ? 'text-primary' : 'text-foreground'}`}>{c.name}</span>
              {country === c.code && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
        <button onClick={save} disabled={!country || busy}
          className={`w-full h-14 rounded-2xl font-extrabold text-base transition-all ${country && !busy ? 'bg-primary text-white active:scale-95' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
          {busy ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Saving…</span> : "Let's Go! 🚀"}
        </button>
      </div>
    </Backdrop>
  );
}
