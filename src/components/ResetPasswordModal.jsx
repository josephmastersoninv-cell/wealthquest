import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';

export default function ResetPasswordModal() {
  const { passwordRecovery, updatePassword } = useAuth();
  const [password, setPassword]   = useState('');
  const [confirm,  setConfirm]    = useState('');
  const [showPw,   setShowPw]     = useState(false);
  const [busy,     setBusy]       = useState(false);
  const [err,      setErr]        = useState('');
  const [done,     setDone]       = useState(false);

  if (!passwordRecovery) return null;

  async function handleSubmit() {
    if (password.length < 6)      { setErr('Password must be at least 6 characters.'); return; }
    if (password !== confirm)     { setErr('Passwords do not match.'); return; }
    setBusy(true); setErr('');
    try {
      await updatePassword(password);
      setDone(true);
      toast.success('Password updated! You are now signed in.');
    } catch (e) {
      setErr(e.message ?? 'Failed to update password. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-6">
      <motion.div initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-2xl border border-border">

        {done ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">✅</div>
            <h2 className="text-2xl font-black text-foreground">Password updated!</h2>
            <p className="text-sm text-muted-foreground">You're signed in and good to go.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-center">
              <div className="text-5xl mb-2">🔐</div>
              <h2 className="text-2xl font-black text-foreground">Set new password</h2>
              <p className="text-sm text-muted-foreground mt-1">Choose something strong</p>
            </div>

            <div>
              <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">New Password</label>
              <div className="relative mt-1.5">
                <input value={password} onChange={e => { setPassword(e.target.value); setErr(''); }}
                  placeholder="Min 6 characters" type={showPw ? 'text' : 'password'} autoFocus
                  className="w-full h-12 px-4 pr-10 rounded-2xl border-2 border-border bg-muted text-foreground font-bold text-sm outline-none focus:border-primary transition-colors" />
                <button onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Confirm Password</label>
              <input value={confirm} onChange={e => { setConfirm(e.target.value); setErr(''); }}
                placeholder="Type it again" type="password"
                className="mt-1.5 w-full h-12 px-4 rounded-2xl border-2 border-border bg-muted text-foreground font-bold text-sm outline-none focus:border-primary transition-colors" />
            </div>

            {err && (
              <p className="text-xs text-rose-500 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{err}
              </p>
            )}

            <button onClick={handleSubmit} disabled={busy || !password || !confirm}
              className={`w-full h-14 rounded-2xl font-extrabold text-base transition-all ${!busy && password && confirm ? 'bg-primary text-white active:scale-95' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
              {busy
                ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Updating…</span>
                : 'Update Password →'}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
