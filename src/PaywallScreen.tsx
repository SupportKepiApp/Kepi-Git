import { useEffect, useRef, useState } from 'react';
import { useAuth } from './lib/auth';
import { useLang } from './lib/i18n';
import { supabase } from './lib/supabase';
import {
  fetchProductDetails,
  purchasePlan,
  acknowledgePurchase,
  isPlayBillingAvailable,
  type DigitalServiceItem,
} from './lib/playBilling';
import { PLANS, type PlanId } from './lib/config';
import KepiLogo from './assets/kepi-logo.jpg';

interface Props {
  onPurchased: () => void;
  onClose?: () => void;
}

type Status = 'idle' | 'processing' | 'success' | 'error';

export function PaywallScreen({ onPurchased, onClose }: Props) {
  const { profile, refreshProfile, signOut, trialDaysLeft, accessStatus } = useAuth();
  const { t } = useLang();
  const [products, setProducts] = useState<Record<string, DigitalServiceItem>>({});
  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loadingSkus, setLoadingSkus] = useState(true);
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const billingAvailable = isPlayBillingAvailable();

  // Kullanım süresi dolmamışsa (trial aktif veya plan aktif) "Kapat" göster ve yukarı kaydırarak kapatılabilir,
  // süresi dolduysa "Hesaptan Çıkış Yap" göster ve kaydırma ile kapatma devre dışı.
  const canClose = accessStatus === 'trial' || accessStatus === 'active';

  useEffect(() => {
    let cancelled = false;
    fetchProductDetails()
      .then((p) => { if (!cancelled) { setProducts(p); setLoadingSkus(false); } })
      .catch(() => { if (!cancelled) setLoadingSkus(false); });
    return () => { cancelled = true; };
  }, []);

  const hasRealProducts = Object.keys(products).length > 0;
  const showMock = !billingAvailable || (!loadingSkus && !hasRealProducts);

  // Get the current user's session access token to authenticate the
  // verify-purchase edge function call (NOT the anon key).
  const getAuthToken = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const buy = async (plan: PlanId) => {
    setError(null);
    setStatus('processing');
    setBusyPlan(plan);
    try {
      const accessToken = await getAuthToken();
      if (!accessToken) {
        throw new Error('Oturum bulunamadı, lütfen tekrar giriş yapın.');
      }

      if (showMock) {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-purchase`;
        const headers = {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        };
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ purchase_token: 'mock_test_token', product_id: 'mock', plan, mock: true }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || t('paywall_verify_fail', { n: res.status }));
        }
        await refreshProfile();
        setStatus('success');
        setTimeout(() => onPurchased(), 1400);
        return;
      }

      const { purchaseToken, productId } = await purchasePlan(plan);
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-purchase`;
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ purchase_token: purchaseToken, product_id: productId, plan }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Doğrulama başarısız (${res.status})`);
      }
      await acknowledgePurchase(purchaseToken);
      await refreshProfile();
      setStatus('success');
      setTimeout(() => onPurchased(), 1400);
    } catch (e) {
      const msg = (e as Error).message || t('paywall_unknown_error');
      setError(msg.includes('cancel') || msg.toLowerCase().includes('iptal')
        ? t('paywall_cancelled')
        : msg);
      setStatus('error');
    } finally {
      setBusyPlan(null);
    }
  };

  const fmtPrice = (sku: string, fallback: string) => {
    const p = products[sku];
    return p ? `${p.price.value} ${p.price.currency}` : fallback;
  };

  const handleClose = () => {
    if (!onClose) return;
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, 300);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (!canClose) return;
    startY.current = e.touches[0].clientY;
    setDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging || !canClose) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy < 0) setDragY(dy);
  };

  const onTouchEnd = () => {
    if (!dragging || !canClose) return;
    setDragging(false);
    if (dragY < -120) {
      handleClose();
    }
    setDragY(0);
  };

  const handleSignOut = async () => {
    setClosing(true);
    setTimeout(async () => {
      await signOut();
      setClosing(false);
    }, 300);
  };

  if (status === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-0/95 px-6 animate-slide-down">
        <div className="w-full max-w-sm animate-scale-in text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
            <svg className="h-10 w-10 text-success" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h2 className="text-xl font-bold text-content">{t('paywall_success')}</h2>
          <p className="mt-2 text-sm text-content-dim">{t('paywall_success_desc')}</p>
          <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full w-full origin-left animate-[scaleX_1.4s_ease-out] bg-brand" style={{ transform: 'scaleX(1)' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col bg-surface-0 ${closing ? 'animate-slide-up' : 'animate-slide-down'}`}
      style={dragY ? { transform: `translateY(${dragY}px)`, transition: dragging ? 'none' : 'transform 0.3s ease-out' } : undefined}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe handle - only when canClose */}
      {canClose && (
        <div className="mx-auto w-full max-w-md pt-3 pb-1">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-content-dim/30" />
        </div>
      )}
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto px-6 py-6 no-scrollbar">
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="text-center">
            <img src={KepiLogo} alt="Kepi" className="mx-auto mb-4 h-20 w-20 rounded-2xl object-cover shadow-card-lg" />
            <h1 className="text-2xl font-bold text-content">{t('paywall_title')}</h1>
          </div>

          {/* Trial status */}
          {profile?.plan === 'trial' && trialDaysLeft > 0 && (
            <div className="rounded-xl bg-warning/10 px-4 py-2.5 text-center text-xs font-medium text-warning ring-1 ring-warning/30">
              {t('paywall_trial_warning', { n: trialDaysLeft })}
            </div>
          )}

          {/* Active plan status */}
          {profile?.plan && (profile.plan === 'monthly' || profile.plan === 'yearly') && accessStatus === 'active' && (
            <div className="rounded-xl bg-success/10 px-4 py-2.5 text-center text-xs font-medium text-success ring-1 ring-success/30">
              {t('paywall_active_plan', { plan: t(`plan_${profile.plan}`) })}
            </div>
          )}

          {/* Billing warning */}
          {!billingAvailable && !showMock && (
            <div className="rounded-xl bg-warning/10 px-3 py-2 text-[11px] text-warning ring-1 ring-warning/30">
              {t('paywall_no_billing')}
            </div>
          )}
          {showMock && (
            <div className="rounded-xl bg-warning/10 px-3 py-2 text-[11px] text-warning ring-1 ring-warning/30">
              {t('paywall_mock')}
            </div>
          )}

          {/* Error */}
          {status === 'error' && error && (
            <div className="rounded-xl bg-danger/10 px-4 py-3 text-xs text-danger ring-1 ring-danger/30">
              {error}
            </div>
          )}

          {/* Plan cards */}
          <div className="space-y-3">
            {PLANS.map((plan) => {
              const isYearly = plan.id === 'yearly';
              const price = fmtPrice(plan.sku, plan.fallbackPrice);
              const isBusy = busyPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => buy(plan.id)}
                  disabled={busyPlan !== null || (!billingAvailable && !showMock)}
                  className={`relative w-full overflow-hidden rounded-2xl p-5 text-left transition-all active:scale-[0.98] disabled:opacity-50 ${
                    isYearly
                      ? 'bg-gradient-to-br from-brand to-brand-dark text-white shadow-card-lg ring-1 ring-brand/40'
                      : 'bg-surface-1 text-content ring-1 ring-border hover:ring-brand/40'
                  }`}
                >
                  {plan.badge && (
                    <span className={`absolute right-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      isYearly ? 'bg-white/20 text-white' : 'bg-brand/15 text-brand'
                    }`}>
                      {t(plan.badge)}
                    </span>
                  )}
                  <div className="flex items-start justify-between pr-20">
                    <div>
                      <p className={`text-base font-bold ${isYearly ? 'text-white' : 'text-content'}`}>{t(plan.name)}</p>
                      <p className={`mt-0.5 text-xs ${isYearly ? 'text-white/80' : 'text-content-dim'}`}>{t(plan.description)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${isYearly ? 'text-white' : 'text-content'}`}>{price.split(' ')[0]}</span>
                    <span className={`text-xs ${isYearly ? 'text-white/70' : 'text-content-dim'}`}>
                      {price.split(' ').slice(1).join(' ')} / {plan.id === 'yearly' ? t('per_year') : t('per_month')}
                    </span>
                  </div>
                  {isBusy && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className={`h-3 w-3 animate-spin rounded-full border-2 ${isYearly ? 'border-white border-t-transparent' : 'border-brand border-t-transparent'}`} />
                      <span className={`text-[11px] ${isYearly ? 'text-white/80' : 'text-content-dim'}`}>{t('paywall_processing')}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Trust note */}
          <div className="rounded-xl bg-surface-1 p-3.5 text-[10px] leading-relaxed text-content-dim ring-1 ring-border">
            {t('paywall_trust')}
          </div>
        </div>
      </div>

      {/* Swipe hint - only when canClose */}
      {canClose && (
        <div className="mx-auto w-full max-w-md px-6 pb-1 text-center text-[10px] text-content-dim/50">
          {t('paywall_swipe_hint')}
        </div>
      )}

      {/* Bottom action button */}
      <div className="sticky bottom-0 mx-auto w-full max-w-md bg-surface-0/95 px-6 pb-6 pt-3 backdrop-blur-xl" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}>
        {canClose ? (
          <button
            onClick={handleClose}
            className="w-full rounded-xl bg-surface-1 py-3.5 text-sm font-semibold text-content ring-1 ring-border transition-all hover:bg-surface-2 active:scale-[0.98]"
          >
            {t('paywall_close')}
          </button>
        ) : (
          <button
            onClick={handleSignOut}
            className="w-full rounded-xl bg-danger/10 py-3.5 text-sm font-semibold text-danger ring-1 ring-danger/30 transition-all hover:bg-danger/20 active:scale-[0.98]"
          >
            {t('paywall_signout')}
          </button>
        )}
      </div>
    </div>
  );
}
