import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

export type PlanId = 'trial' | 'monthly' | 'yearly' | 'expired';

export interface Profile {
  id: string;
  email: string | null;
  plan: PlanId;
  trial_started_at: string | null;
  expires_at: string | null;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  accessStatus: 'trial' | 'active' | 'expired' | 'loading';
  trialDaysLeft: number;
  daysLeft: number;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(Ctx);

const DAY = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 20;

// Supabase OAuth redirect → app deep link
const MOBILE_REDIRECT = 'com.kepi.app://login-callback';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string, email?: string | null) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, plan, trial_started_at, expires_at')
      .eq('id', uid)
      .maybeSingle();
    if (error) return;
    if (!data) {
      const { data: created } = await supabase
        .from('profiles')
        .insert({ id: uid, email: email ?? null })
        .select('id, email, plan, trial_started_at, expires_at')
        .maybeSingle();
      if (created) setProfile(created as Profile);
      return;
    }
    setProfile(data as Profile);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id, data.session.user.email).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      (async () => {
        setSession(sess);
        if (sess?.user) {
          await loadProfile(sess.user.id, sess.user.email);
        } else {
          setProfile(null);
        }
      })();
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  // Mobile: handle OAuth deep link returned from browser
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleUrl = async (url: string) => {
      if (!url.startsWith('com.kepi.app://login-callback')) return;

      const urlObj = new URL(url.replace('com.kepi.app://', 'https://placeholder/'));
      const hashParams = new URLSearchParams(urlObj.hash.replace('#', ''));
      const searchParams = urlObj.searchParams;

      const accessToken = hashParams.get('access_token') ?? searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') ?? searchParams.get('refresh_token');

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }

      try {
        await Browser.close();
      } catch {
        // browser may already be closed
      }
    };

    const listener = App.addListener('appUrlOpen', ({ url }) => {
      handleUrl(url);
    });

    return () => { listener.then(l => l.remove()); };
  }, []);

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id, session.user.email);
  };

  const signInWithGoogle: AuthCtx['signInWithGoogle'] = async () => {
    const isMobile = Capacitor.isNativePlatform();

    if (isMobile) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: MOBILE_REDIRECT,
          skipBrowserRedirect: true,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) return { error: error.message };
      if (data?.url) {
        await Browser.open({ url: data.url, windowName: '_self' });
      }
      return { error: null };
    }

    // Web
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });

    if (error) return { error: error.message };
    if (data?.url) window.location.href = data.url;
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const now = Date.now();

  // Trial countdown — only meaningful while plan is 'trial'
  const trialStart = profile?.trial_started_at ? new Date(profile.trial_started_at).getTime() : now;
  const trialDaysLeft = Math.max(0, TRIAL_DAYS - Math.floor((now - trialStart) / DAY));

  // Paid plan countdown — days left until expires_at
  let daysLeft = 0;
  if (profile?.expires_at) {
    const exp = new Date(profile.expires_at).getTime();
    daysLeft = Math.max(0, Math.ceil((exp - now) / DAY));
  }

  let accessStatus: AuthCtx['accessStatus'] = 'loading';
  if (profile) {
    if (profile.plan === 'monthly' || profile.plan === 'yearly') {
      const exp = profile.expires_at ? new Date(profile.expires_at).getTime() : 0;
      accessStatus = exp > now ? 'active' : 'expired';
    } else if (profile.plan === 'trial') {
      accessStatus = trialDaysLeft > 0 ? 'trial' : 'expired';
    } else {
      accessStatus = 'expired';
    }
  }

  return (
    <Ctx.Provider value={{
      user: session?.user ?? null,
      session, profile, loading, accessStatus, trialDaysLeft, daysLeft,
      signInWithGoogle, signOut, refreshProfile,
    }}>
      {children}
    </Ctx.Provider>
  );
}
