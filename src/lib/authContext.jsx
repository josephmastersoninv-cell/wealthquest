import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isConfigured } from './supabase';
import { pullAndRestore } from './cloudSync';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,             setUser]            = useState(null);
  const [player,           setPlayer]          = useState(null);
  const [loading,          setLoading]         = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const fetchPlayer = useCallback(async (userId) => {
    if (!supabase || !userId) return null;
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('id', userId)
      .single();
    return data ?? null;
  }, []);

  const refreshPlayer = useCallback(async (userId) => {
    let p = await fetchPlayer(userId);
    // Country (and avatar/name) were chosen during sign-up and stored in auth
    // metadata. If the players row is missing them (email-confirmation flow
    // never got to save the profile), complete it silently — never ask twice.
    if (!p?.country_code) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const meta = authUser?.user_metadata ?? {};
      if (meta.country_code) {
        const { data } = await supabase
          .from('players')
          .upsert({
            id: userId,
            name: p?.name ?? meta.name ?? (authUser?.email?.split('@')[0] ?? 'Investor'),
            avatar: p?.avatar ?? meta.avatar ?? '🦁',
            country_code: meta.country_code,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (data) {
          p = data;
          localStorage.setItem('wealthquest_country', data.country_code);
        }
      }
    }
    setPlayer(p);
    return p;
  }, [fetchPlayer]);

  useEffect(() => {
    if (!isConfigured || !supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Restore full progress from cloud into localStorage on every page load
        await pullAndRestore(session.user.id);
        window.dispatchEvent(new CustomEvent('wq:progress_restored'));
        await refreshPlayer(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
        return;
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        // On fresh sign-in (not page refresh — that's handled by getSession above)
        if (_event === 'SIGNED_IN') {
          await pullAndRestore(session.user.id);
          window.dispatchEvent(new CustomEvent('wq:progress_restored'));
        }
        await refreshPlayer(session.user.id);
      } else {
        setPlayer(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshPlayer]);

  async function signUp({ email, password, name, avatar, countryCode }) {
    if (!supabase) throw new Error('Supabase not configured');
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out — check your connection and try again.')), 12000)
    );
    const request = supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, avatar, country_code: countryCode },
        emailRedirectTo: window.location.origin,
      },
    });
    const { data, error } = await Promise.race([request, timeout]);
    if (error) throw error;
    return data;
  }

  async function signIn({ email, password }) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signInWithGoogle() {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  async function resetPasswordEmail(email) {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }

  async function updatePassword(newPassword) {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setPasswordRecovery(false);
  }

  async function updatePlayer(updates) {
    if (!supabase || !user) return null;
    const { data } = await supabase
      .from('players')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    if (data) setPlayer(data);
    return data;
  }

  async function upsertPlayer(fields) {
    if (!supabase || !user) return null;
    const { data } = await supabase
      .from('players')
      .upsert({ id: user.id, ...fields, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (data) setPlayer(data);
    return data;
  }

  return (
    <AuthContext.Provider value={{
      user,
      player,
      loading,
      isAuthenticated: !!user,
      isConfigured,
      passwordRecovery,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      resetPasswordEmail,
      updatePassword,
      updatePlayer,
      upsertPlayer,
      refreshPlayer: () => user && refreshPlayer(user.id),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
