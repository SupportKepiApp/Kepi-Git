import { useState } from 'react';
import { useAuth } from './lib/auth';
import { useTheme } from './theme';
import KepiLogo from './assets/kepi-logo.jpg';
import { LegalModal } from './LegalModal';

export function AuthScreen() {
  const { signInWithGoogle } = useAuth();
  const { theme, toggle } = useTheme();
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    const { error } = await signInWithGoogle();
    setBusy(false);
    if (error) setError(error);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface-0 px-6 py-10">
      <button
        onClick={toggle}
        className="absolute right-5 top-14 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-1 text-content-dim ring-1 ring-border transition-all hover:text-brand hover:ring-brand/40 active:scale-90"
        aria-label="Tema değiştir"
      >
        {theme === 'dark' ? (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </button>

      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}

      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-10 text-center">
          <img src={KepiLogo} alt="Kepi Logo" className="mx-auto mb-4 h-20 w-20 rounded-2xl object-cover ring-1 ring-border shadow-card-lg" />
          <h1 className="text-2xl font-bold text-content">Kepi</h1>
          <p className="mt-1.5 text-xs text-content-dim">
            E-ticaret kâr hesaplamada akıllı asistanın
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-center text-[11px] leading-relaxed text-content-dim/70 px-2">
            Devam etmek için Google hesabınız ile giriş yapın
          </p>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3.5 text-sm font-semibold text-gray-700 ring-1 ring-border transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {busy ? 'Lütfen bekleyin…' : 'Google ile Giriş Yap'}
          </button>

          {error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger ring-1 ring-danger/30">{error}</p>
          )}
        </div>

        <p className="mt-10 px-2 text-center text-[10px] leading-relaxed text-content-dim/60">
          Giriş yaparak{' '}
          <button
            onClick={() => setLegalModal('terms')}
            className="font-medium text-content-dim underline underline-offset-2 transition-colors hover:text-brand"
          >Kullanım Şartlarını</button>
          {' '}ve{' '}
          <button
            onClick={() => setLegalModal('privacy')}
            className="font-medium text-content-dim underline underline-offset-2 transition-colors hover:text-brand"
          >Gizlilik Politikasını</button>
          {' '}kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  );
}
