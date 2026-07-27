import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from './lib/supabase';
import {
  REGIONS,
  MARKETPLACE_COMMISSIONS,
  calculate,
  resolveCommissionRate,
  lookupASIN,
  determineFBATier,
  calcInboundingCost,
  type RegionId,
  type Category,
  type CalcResult,
  type FulfillmentMode,
  type FBAMethod,
  type FBAInputs,
  type ASINData,
} from './data';
import { useTheme } from './theme';
import { useLang, type Lang } from './lib/i18n';
import { useAuth } from './lib/auth';
import { AuthScreen } from './AuthScreen';
import { PaywallScreen } from './PaywallScreen';
import KepiLogo from './assets/kepi-logo.jpg';

type TabId = 'calc' | 'history' | 'converter' | 'calculator' | 'feedback';

interface HistoryEntry {
  id: string;
  timestamp: number;
  marketplaceId: string;
  marketplaceName: string;
  categoryName: string;
  purchase: string;
  sale: string;
  shipping: string;
  tax: string;
  other: string;
  returnRate: string;
  fbaInputs: FBAInputs | null;
  netProfit: number;
  margin: number;
  breakEven: number;
  symbol: string;
  asinData?: ASINData | null;
  isFavorite?: boolean;
  name?: string;
}

const HISTORY_KEY = 'kepi_history_v1';
const MAX_HISTORY = 10;

const CURRENCIES = [
  { sym: '₺', code: 'TRY' },
  { sym: '$', code: 'USD' },
  { sym: '€', code: 'EUR' },
  { sym: '£', code: 'GBP' }
];

/* ---------- Toast ---------- */
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed left-1/2 top-4 z-[100] -translate-x-1/2 animate-fade-up">
      <div className="flex items-center gap-2 rounded-xl bg-success/15 px-4 py-2.5 text-sm font-medium text-success ring-1 ring-success/30 shadow-card-lg">
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {message}
      </div>
    </div>
  );
}

/* ---------- Money Input ---------- */
function MoneyInput({
  label, suffix, value, onChange, disabled, placeholder, isRequired
}: {
  label: string; suffix: string; value: string; onChange: (v: string) => void;
  disabled?: boolean; placeholder?: string; isRequired?: boolean;
}) {
  const { t } = useLang();
  return (
    <div>
      <div className="mb-1 flex justify-between items-end">
        <label className={`block text-[11px] font-medium ${disabled ? 'text-content-dim/50' : 'text-content-dim'}`}>{label}</label>
        {isRequired !== undefined && (
          <span className={`text-[9px] ${isRequired ? 'text-danger font-semibold' : 'text-content-dim/40'}`}>
            {isRequired ? t('required') : t('optional')}
          </span>
        )}
      </div>
      <div className={`flex items-center rounded-xl ring-1 transition-all ${disabled ? 'bg-surface-0 ring-border/50' : 'bg-surface-1 ring-border focus-within:ring-brand/50'}`}>
        <input
          type="number"
          inputMode="decimal"
          disabled={disabled}
          readOnly={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? '0'}
          className={`w-full bg-transparent px-3 py-2.5 text-sm text-content outline-none ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        />
        <span className="px-3 text-[11px] font-medium text-content-dim">{suffix}</span>
      </div>
    </div>
  );
}

/* ---------- Section ---------- */
function Section({ title, step, children, className = '' }: {
  title: string; step?: number; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={`animate-fade-up rounded-2xl bg-surface-1 p-4 ring-1 ring-border ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        {step !== undefined && <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand/15 text-[10px] font-bold text-brand">{step}</span>}
        <h2 className="text-xs font-semibold uppercase tracking-wider text-content-dim">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/* ---------- Category Dropdown ---------- */
function CategoryDropdown({
  categories, value, onChange,
}: {
  categories: Category[]; value: Category | null; onChange: (c: Category) => void;
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [categories, search]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl bg-surface-1 px-3 py-2.5 text-sm text-content ring-1 ring-border transition-all hover:ring-brand/40"
      >
        <span className={value ? '' : 'text-content-dim/60'}>{value ? value.name : t('category_select')}</span>
        <svg className={`h-4 w-4 text-content-dim transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-2 max-h-72 w-full animate-fade-up overflow-hidden rounded-xl shadow-2xl ring-1 ring-border" style={{ backgroundColor: 'rgb(var(--surface-1))' }}>
          {categories.length > 5 && (
            <div className="border-b border-border p-2">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('category_search')}
                className="w-full rounded-lg px-3 py-2 text-sm text-content outline-none"
                style={{ backgroundColor: 'rgb(var(--surface-2))' }}
              />
            </div>
          )}
          <div className="max-h-56 overflow-y-auto no-scrollbar">
            {filtered.map((cat) => (
              <button
                key={cat.name}
                onClick={() => { onChange(cat); setOpen(false); setSearch(''); }}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm text-content transition-colors hover:bg-surface-2"
              >
                <span>{cat.name}</span>
                <span className="text-[11px] font-semibold text-brand">{cat.isDynamic ? t('category_dynamic') : `${cat.rate}%`}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-content-dim">{t('category_not_found')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Result Card ---------- */
function ResultCard({ result, symbol }: { result: CalcResult; symbol: string }) {
  const { t } = useLang();
  const fmt = (n: number) => {
    const sign = n < 0 ? '-' : '';
    return `${sign}${symbol}${Math.abs(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  return (
    <div className="space-y-3">
      <div className={`rounded-xl p-4 text-center ${result.isLoss ? 'bg-danger/10 ring-1 ring-danger/30' : 'bg-success/10 ring-1 ring-success/30'}`}>
        <p className="text-[11px] font-medium uppercase tracking-wider text-content-dim">{t('net_profit')}</p>
        <p className={`mt-1 text-2xl font-bold ${result.isLoss ? 'text-danger' : 'text-success'}`}>{fmt(result.netProfit)}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-surface-2 p-3">
          <p className="text-[10px] text-content-dim">{t('margin')}</p>
          <p className={`text-base font-semibold ${result.margin >= 0 ? 'text-content' : 'text-danger'}`}>{result.margin.toFixed(1)}%</p>
        </div>
        <div className="rounded-xl bg-surface-2 p-3">
          <p className="text-[10px] text-content-dim">{t('cost_ratio')}</p>
          <p className="text-base font-semibold text-content">{result.costRatio.toFixed(1)}%</p>
        </div>
      </div>
      <div className="rounded-xl bg-surface-2 p-3 text-center">
        <p className="text-[10px] text-content-dim">{t('break_even')}</p>
        <p className="mt-0.5 text-lg font-bold text-content">{fmt(result.breakEvenPrice)}</p>
        <p className="mt-0.5 text-[10px] text-content-dim/60">{t('break_even_hint')}</p>
      </div>
      <div className="space-y-1.5 rounded-xl bg-surface-2 p-3">
        {result.commissionAmount > 0 && (
          <div className="flex justify-between text-xs"><span className="text-content-dim">{t('commission')}</span><span className="text-content">{fmt(result.commissionAmount)}</span></div>
        )}
        {result.taxAmount > 0 && (
          <div className="flex justify-between text-xs"><span className="text-content-dim">{t('tax_label')}</span><span className="text-content">{fmt(result.taxAmount)}</span></div>
        )}
        {result.returnCost > 0 && (
          <div className="flex justify-between text-xs"><span className="text-content-dim">{t('return_cost')}</span><span className="text-content">{fmt(result.returnCost)}</span></div>
        )}
        {result.fbaCosts && (
          <div className="flex justify-between text-xs"><span className="text-content-dim">{t('fba_total')}</span><span className="text-content">{fmt(result.fbaCosts.total)}</span></div>
        )}
        <div className="flex justify-between border-t border-border pt-1.5 text-xs font-semibold"><span className="text-content-dim">{t('total_cost')}</span><span className="text-content">{fmt(result.totalCost)}</span></div>
      </div>
    </div>
  );
}

/* ---------- History Panel ---------- */
function HistoryPanel({ history, onClear, onRestore, onToggleStar, onDelete }: {
  history: HistoryEntry[];
  onClear: () => void;
  onRestore: (e: HistoryEntry) => void;
  onToggleStar: (id: string, name?: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useLang();
  const [starringId, setStarringId] = useState<string | null>(null);
  const [starName, setStarName] = useState('');

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="mb-3 h-12 w-12 text-content-dim/30" viewBox="0 0 24 24" fill="none"><path d="M3 3v6h6M3 9a9 9 0 1 1 1.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <p className="text-sm text-content-dim">{t('history_empty')}</p>
      </div>
    );
  }
  return (
    <section className="animate-fade-up space-y-2">
      <div className="flex justify-end">
        <button onClick={onClear} className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-danger ring-1 ring-danger/30 transition-all hover:bg-danger/10">{t('history_clear')}</button>
      </div>
      {history.map((e) => (
        <div key={e.id} className="relative rounded-xl bg-surface-1 p-3 ring-1 ring-border shadow-sm transition-all hover:bg-surface-2 cursor-pointer" onClick={(ev) => {
          if ((ev.target as HTMLElement).closest('.star-btn, .star-input')) return;
          onRestore(e);
        }}>
          <button
            className="star-btn absolute right-3 top-3 z-10 text-2xl leading-none transition-transform active:scale-90"
            onClick={(ev) => {
              ev.stopPropagation();
              if (e.isFavorite) {
                onToggleStar(e.id);
              } else {
                setStarringId(e.id);
                setStarName('');
              }
            }}
            aria-label="Favori"
          >
            {e.isFavorite ? '⭐️' : <span className="text-content-dim opacity-40 hover:opacity-100">☆</span>}
          </button>
          <button
            className="delete-btn absolute bottom-3 right-3 z-10 text-content-dim opacity-40 transition-all hover:text-danger hover:opacity-100 active:scale-90"
            onClick={(ev) => { ev.stopPropagation(); onDelete(e.id); }}
            aria-label="Sil"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>

          <div className="pr-20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-content-dim">{e.marketplaceName} {e.isFavorite && e.name && <span className="ml-1 text-brand font-bold">[{e.name}]</span>}</span>
              <span className="text-[10px] text-content-dim/60">{new Date(e.timestamp).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            
            {starringId === e.id && !e.isFavorite && (
              <div className="star-input mt-2 mb-2 flex gap-2 animate-fade-up">
                <input 
                  type="text" 
                  autoFocus
                  placeholder={t('star_name_placeholder')}
                  value={starName}
                  onChange={(ev) => setStarName(ev.target.value)}
                  className="w-full rounded-lg bg-surface-0 px-2 py-1 text-xs text-content ring-1 ring-brand/50 outline-none"
                />
                <button 
                  onClick={() => { onToggleStar(e.id, starName || t('favorite_default')); setStarringId(null); }}
                  className="rounded-lg bg-brand px-3 py-1 text-xs font-medium text-white"
                >{t('star_save')}</button>
                <button onClick={() => setStarringId(null)} className="rounded-lg bg-surface-2 px-2 py-1 text-xs text-content-dim ring-1 ring-border">{t('star_cancel')}</button>
              </div>
            )}

            <p className="mt-0.5 truncate text-xs text-content-dim">{e.categoryName}</p>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-[11px] text-content-dim">{t('history_sale')}: <span className="text-content">{e.symbol}{parseFloat(e.sale).toFixed(2)}</span></div>
              <div className={`text-sm font-bold ${e.netProfit < 0 ? 'text-danger' : 'text-success'}`}>{e.symbol}{e.netProfit.toFixed(2)}</div>
            </div>
            <div className="mt-0.5 flex justify-between text-[10px] text-content-dim">
              <span>{t('history_margin')}: {e.margin.toFixed(1)}%</span>
              <span>{t('history_breakeven')}: {e.symbol}{e.breakEven.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

/* ---------- Converter Tab ---------- */
function ConverterTab() {
  const { t } = useLang();
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('TRY');
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [staticRate, setStaticRate] = useState(34.5);
  const [manualRate, setManualRate] = useState('');
  const [rateMsg, setRateMsg] = useState('');

  const [lenVal, setLenVal] = useState('');
  const [lenFrom, setLenFrom] = useState<'cm' | 'in'>('cm');
  const [lenTo, setLenTo] = useState<'cm' | 'in'>('in');

  const [wgtVal, setWgtVal] = useState('');
  const [wgtFrom, setWgtFrom] = useState<'kg' | 'lb'>('kg');
  const [wgtTo, setWgtTo] = useState<'kg' | 'lb'>('lb');

  const [desiW, setDesiW] = useState('');
  const [desiL, setDesiL] = useState('');
  const [desiH, setDesiH] = useState('');
  const [desiDivisor, setDesiDivisor] = useState<number>(5000);

  const currencies = ['USD', 'TRY', 'EUR', 'GBP'];

  const fetchRate = useCallback(async () => {
    setLoading(true);
    setRateMsg('');
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      const tryRate = json.rates?.TRY;
      if (tryRate) {
        setStaticRate(tryRate);
        setRateMsg(t('converter_rate_ok', { n: tryRate.toFixed(2) }));
      } else {
        throw new Error('No TRY rate');
      }
    } catch {
      setRateMsg(t('converter_rate_fail'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRate(); }, [fetchRate]);

  const rates: Record<string, number> = { USD: 1, TRY: staticRate, EUR: 0.92, GBP: 0.79 };

  const convert = () => {
    const a = parseFloat(amount);
    if (isNaN(a)) return;
    const usd = a / (rates[from] || 1);
    setResult(usd * (rates[to] || 1));
  };

  const lenResult = useMemo(() => {
    const v = parseFloat(lenVal);
    if (isNaN(v)) return '0';
    const cm = lenFrom === 'cm' ? v : v * 2.54;
    const res = lenTo === 'cm' ? cm : cm / 2.54;
    return res.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
  }, [lenVal, lenFrom, lenTo]);

  const wgtResult = useMemo(() => {
    const v = parseFloat(wgtVal);
    if (isNaN(v)) return '0';
    const kg = wgtFrom === 'kg' ? v : v / 2.20462;
    const res = wgtTo === 'kg' ? kg : kg * 2.20462;
    return res.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
  }, [wgtVal, wgtFrom, wgtTo]);

  const desiResult = useMemo(() => {
    const w = parseFloat(desiW), l = parseFloat(desiL), h = parseFloat(desiH);
    if (isNaN(w) || isNaN(l) || isNaN(h)) return null;
    return (w * l * h) / desiDivisor;
  }, [desiW, desiL, desiH, desiDivisor]);

  return (
    <div className="space-y-4">
      <Section title={t('converter_currency')} step={1}>
        <div className="space-y-3">
          <MoneyInput label={t('converter_amount')} suffix={from} value={amount} onChange={setAmount} placeholder="0.00" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-content-dim">{t('converter_from')}</label>
              <select value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-xl bg-surface-1 px-3 py-2.5 text-sm text-content ring-1 ring-border outline-none">
                {currencies.map((c) => <option key={c} value={c} className="bg-surface-1">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-content-dim">{t('converter_to')}</label>
              <select value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-xl bg-surface-1 px-3 py-2.5 text-sm text-content ring-1 ring-border outline-none">
                {currencies.map((c) => <option key={c} value={c} className="bg-surface-1">{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={convert} disabled={loading} className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-dark disabled:opacity-50">
              {t('converter_btn')}
            </button>
            <button onClick={fetchRate} disabled={loading} className="rounded-xl bg-surface-2 px-3 py-2.5 text-sm font-medium text-brand ring-1 ring-brand/30 transition-all hover:bg-brand/10 disabled:opacity-50">
              {loading ? '…' : t('converter_fetch')}
            </button>
          </div>
          {rateMsg && <p className="text-[10px] text-content-dim/70">{rateMsg}</p>}
          {result !== null && (
            <div className="rounded-xl bg-surface-2 p-4 text-center animate-scale-in">
              <p className="text-[11px] text-content-dim">{t('converter_result')}</p>
              <p className="mt-1 text-xl font-bold text-content">{result.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {to}</p>
            </div>
          )}
        </div>
      </Section>
      <Section title={t('converter_length')} step={2}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input type="number" inputMode="decimal" value={lenVal} onChange={(e) => setLenVal(e.target.value)} placeholder="0" className="w-full rounded-xl bg-surface-1 px-3 py-2.5 text-sm text-content ring-1 ring-border outline-none focus:ring-brand/50" />
            <select value={lenFrom} onChange={(e) => setLenFrom(e.target.value as 'cm' | 'in')} className="mt-1.5 w-full rounded-xl bg-surface-1 px-3 py-2 text-sm text-content ring-1 ring-border outline-none">
              <option value="cm" className="bg-surface-1">cm</option>
              <option value="in" className="bg-surface-1">inch</option>
            </select>
          </div>
          <button onClick={() => { setLenFrom(lenTo); setLenTo(lenFrom); }} className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-brand ring-1 ring-border transition-all hover:ring-brand/40 active:scale-90">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M10 4l-3 3M10 4l3 3M10 16l-3-3M10 16l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="flex-1">
            <div className="rounded-xl bg-surface-2 px-3 py-2.5 text-sm font-semibold text-content ring-1 ring-border">{lenResult}</div>
            <select value={lenTo} onChange={(e) => setLenTo(e.target.value as 'cm' | 'in')} className="mt-1.5 w-full rounded-xl bg-surface-1 px-3 py-2 text-sm text-content ring-1 ring-border outline-none">
              <option value="cm" className="bg-surface-1">cm</option>
              <option value="in" className="bg-surface-1">inch</option>
            </select>
          </div>
        </div>
      </Section>
      <Section title={t('converter_weight')} step={3}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input type="number" inputMode="decimal" value={wgtVal} onChange={(e) => setWgtVal(e.target.value)} placeholder="0" className="w-full rounded-xl bg-surface-1 px-3 py-2.5 text-sm text-content ring-1 ring-border outline-none focus:ring-brand/50" />
            <select value={wgtFrom} onChange={(e) => setWgtFrom(e.target.value as 'kg' | 'lb')} className="mt-1.5 w-full rounded-xl bg-surface-1 px-3 py-2 text-sm text-content ring-1 ring-border outline-none">
              <option value="kg" className="bg-surface-1">kg</option>
              <option value="lb" className="bg-surface-1">lb</option>
            </select>
          </div>
          <button onClick={() => { setWgtFrom(wgtTo); setWgtTo(wgtFrom); }} className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-brand ring-1 ring-border transition-all hover:ring-brand/40 active:scale-90">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M10 4l-3 3M10 4l3 3M10 16l-3-3M10 16l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="flex-1">
            <div className="rounded-xl bg-surface-2 px-3 py-2.5 text-sm font-semibold text-content ring-1 ring-border">{wgtResult}</div>
            <select value={wgtTo} onChange={(e) => setWgtTo(e.target.value as 'kg' | 'lb')} className="mt-1.5 w-full rounded-xl bg-surface-1 px-3 py-2 text-sm text-content ring-1 ring-border outline-none">
              <option value="kg" className="bg-surface-1">kg</option>
              <option value="lb" className="bg-surface-1">lb</option>
            </select>
          </div>
        </div>
      </Section>
      <Section title={t('converter_desi')} step={4}>
        <div className="space-y-3">
          <div className="flex gap-2">
            {([
              { val: 5000, label: t('desi_div_5000'), sub: t('desi_sub_5000') },
              { val: 3000, label: t('desi_div_3000'), sub: t('desi_sub_3000') },
            ]).map((opt) => (
              <button
                key={opt.val}
                onClick={() => setDesiDivisor(opt.val)}
                className={`flex-1 rounded-xl py-2 px-2 text-center transition-all ${desiDivisor === opt.val ? 'bg-brand text-white' : 'bg-surface-2 text-content-dim ring-1 ring-border'}`}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className={`text-[10px] ${desiDivisor === opt.val ? 'text-white/70' : 'text-content-dim/60'}`}>{opt.sub}</div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { label: t('desi_w'), val: desiW, set: setDesiW },
              { label: t('desi_l'), val: desiL, set: setDesiL },
              { label: t('desi_h'), val: desiH, set: setDesiH },
            ]).map((f) => (
              <div key={f.label}>
                <label className="mb-1 block text-[11px] font-medium text-content-dim">{f.label}</label>
                <input type="number" inputMode="decimal" value={f.val} onChange={(e) => f.set(e.target.value)} placeholder="0" className="w-full rounded-xl bg-surface-1 px-3 py-2.5 text-sm text-content ring-1 ring-border outline-none focus:ring-brand/50" />
              </div>
            ))}
          </div>
          {desiResult !== null && (
            <div className="rounded-xl bg-brand/10 px-4 py-3 text-center ring-1 ring-brand/30 animate-scale-in">
              <p className="text-[11px] text-content-dim">{t('desi_value')}</p>
              <p className="mt-0.5 text-2xl font-bold text-brand">{desiResult.toFixed(2)} {t('desi_unit')}</p>
              <p className="mt-1 text-[10px] text-content-dim/60">{t('desi_formula', { n: desiDivisor })}</p>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

/* ---------- Calculator Tab ---------- */
function CalculatorTab() {
  const { t } = useLang();
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);

  const inputDigit = (d: string) => {
    if (fresh) { setDisplay(d); setFresh(false); }
    else setDisplay(display === '0' ? d : display + d);
  };
  const inputDot = () => {
    if (fresh) { setDisplay('0.'); setFresh(false); }
    else if (!display.includes('.')) setDisplay(display + '.');
  };
  const clearAll = () => { setDisplay('0'); setPrev(null); setOp(null); setFresh(true); };
  const doOp = (nextOp: string) => {
    const current = parseFloat(display);
    if (prev !== null && op && !fresh) {
      const r = compute(prev, current, op);
      setDisplay(String(r)); setPrev(r);
    } else { setPrev(current); }
    setOp(nextOp); setFresh(true);
  };
  const compute = (a: number, b: number, o: string) => {
    switch (o) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      case '%': return (a * b) / 100;
      default: return b;
    }
  };
  const equals = () => {
    if (op !== null && prev !== null) {
      const r = compute(prev, parseFloat(display), op);
      setDisplay(String(r)); setPrev(null); setOp(null); setFresh(true);
    }
  };

  const Btn = ({ label, onClick, variant = 'default' }: { label: string; onClick: () => void; variant?: 'default' | 'op' | 'accent' | 'wide' }) => (
    <button
      onClick={onClick}
      className={`rounded-2xl py-3.5 text-lg font-semibold transition-all active:scale-95 ${variant === 'wide' ? 'col-span-2' : ''} ${
        variant === 'accent' ? 'bg-brand text-white' :
        variant === 'op' ? 'bg-surface-2 text-brand ring-1 ring-brand/30' :
        'bg-surface-2 text-content ring-1 ring-border'
      }`}
    >{label}</button>
  );

  return (
    <Section title={t('calculator_title')} step={1}>
      <div className="space-y-3">
        <div className="rounded-xl bg-surface-0 p-4 text-right">
          <p className="text-[11px] text-content-dim/50">{prev !== null && op ? `${prev} ${op}` : ''}</p>
          <p className="truncate text-3xl font-bold text-content">{display}</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Btn label="C" onClick={clearAll} variant="op" />
          <Btn label="%" onClick={() => doOp('%')} variant="op" />
          <Btn label="÷" onClick={() => doOp('÷')} variant="op" />
          <Btn label="×" onClick={() => doOp('×')} variant="op" />
          <Btn label="7" onClick={() => inputDigit('7')} />
          <Btn label="8" onClick={() => inputDigit('8')} />
          <Btn label="9" onClick={() => inputDigit('9')} />
          <Btn label="−" onClick={() => doOp('−')} variant="op" />
          <Btn label="4" onClick={() => inputDigit('4')} />
          <Btn label="5" onClick={() => inputDigit('5')} />
          <Btn label="6" onClick={() => inputDigit('6')} />
          <Btn label="+" onClick={() => doOp('+')} variant="op" />
          <Btn label="1" onClick={() => inputDigit('1')} />
          <Btn label="2" onClick={() => inputDigit('2')} />
          <Btn label="3" onClick={() => inputDigit('3')} />
          <Btn label="=" onClick={equals} variant="accent" />
          <Btn label="0" onClick={() => inputDigit('0')} variant="wide" />
          <Btn label="." onClick={inputDot} />
        </div>
      </div>
    </Section>
  );
}

/* ---------- ASIN Query Panel ---------- */
function ASINPanel({ onResult, regionId }: { onResult: (data: ASINData) => void; regionId: RegionId }) {
  const { t } = useLang();
  const [asin, setAsin] = useState('');
  const [loading, setLoading] = useState(false);

  const query = () => {
    if (!asin.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const data = lookupASIN(asin, regionId);
      onResult(data);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="rounded-xl bg-surface-2 p-3 ring-1 ring-border">
      <label className="mb-1.5 block text-[11px] font-medium text-content-dim">{t('asin_label')}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={asin}
          onChange={(e) => setAsin(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && query()}
          placeholder={t('asin_placeholder')}
          className="w-full rounded-lg bg-surface-1 px-3 py-2 text-sm text-content ring-1 ring-border outline-none focus:ring-brand/50"
        />
        <button
          onClick={query}
          disabled={loading}
          className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
          ) : t('asin_query')}
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-content-dim/60">{t('asin_hint')}</p>
    </div>
  );
}

/* ---------- Theme Toggle Button ---------- */
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-1 text-content-dim ring-1 ring-border transition-all hover:text-brand hover:ring-brand/40 active:scale-90"
      aria-label="Tema değiştir"
    >
      {theme === 'dark' ? (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
    </button>
  );
}

/* ---------- Language Toggle Button ---------- */
function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-lg bg-surface-1 ring-1 ring-border p-0.5">
      {(['tr', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${lang === l ? 'bg-brand text-white' : 'text-content-dim hover:text-content'}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/* ---------- FBA Details Modal ---------- */
function FbaDetailsModal({ data, onClose }: { data: ASINData; onClose: () => void }) {
  const { t } = useLang();
  const fmt = (n: number) => `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const items = [
    { label: 'Fulfillment Cost', value: data.fbaFulfillmentFee },
    { label: 'Storage Cost', value: data.storageFee },
    { label: 'Inbounding Cost', value: data.inboundingFee },
    { label: 'Other Costs', value: data.miscFee },
  ].filter((it) => it.value > 0);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-surface-1 p-4 ring-1 ring-border animate-fade-up sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-content">{t('fba_details_title')}</h3>
          <button onClick={onClose} className="text-content-dim transition-colors hover:text-content" aria-label="Kapat">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        {items.length === 0 ? (
          <p className="py-4 text-center text-xs text-content-dim">{t('fba_details_empty')}</p>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.label} className="flex justify-between text-sm">
                <span className="text-content-dim">{it.label}</span>
                <span className="font-medium text-content">{fmt(it.value)}</span>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t border-border pt-2 text-sm font-bold">
              <span className="text-content">{t('fba_details_total')}</span>
              <span className="text-brand">{fmt(data.costPerUnit)}</span>
            </div>
          </div>
        )}
        <p className="mt-3 text-[10px] text-content-dim/70">{t('fba_details_note')}</p>
      </div>
    </div>
  );
}

/* ---------- Main App ---------- */
export default function App() {
  const { user, loading, accessStatus } = useAuth();
  const [paywallDismissed, setPaywallDismissed] = useState(false);

  // Deep-link: com.kepi.app://#access_token=...&refresh_token=... (implicit akış)
  // Capacitor Android, OAuth redirect'i appUrlOpen olayı ile bize iletir.
  // flowType 'implicit' olduğu için token'lar URL hash'inde gelir;
  // exchangeCodeForSession (PKCE) çalışmaz, bu yüzden hash'i parse edip
  // setSession ile oturumu kurarız.
  useEffect(() => {
    let listener: { remove: () => void } | undefined;

    const handleUrl = async (url: string) => {
      try {
        const hashIndex = url.indexOf('#');
        if (hashIndex === -1) return;
        const params = new URLSearchParams(url.slice(hashIndex + 1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (!access_token || !refresh_token) return;
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) console.warn('setSession error:', error.message);
      } catch (e) {
        console.warn('appUrlOpen error:', e);
      }
    };

    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('appUrlOpen', ({ url }) => { void handleUrl(url); })
        .then((l) => { listener = l; })
        .catch((e) => console.warn('appUrlOpen listener error:', e));
    }

    return () => { listener?.remove(); };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-0">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }
  if (!user) return <AuthScreen />;
  if ((accessStatus === 'expired') && !paywallDismissed) {
    return <PaywallScreen onPurchased={() => setPaywallDismissed(true)} onClose={() => setPaywallDismissed(true)} />;
  }
  return <AppInner />;
}

function AppInner() {
  const { trialDaysLeft, daysLeft, accessStatus, signOut, user } = useAuth();
  const { t } = useLang();
  const [showPaywall, setShowPaywall] = useState(false);
  const [tab, setTab] = useState<TabId>('calc');
  const [regionId, setRegionId] = useState<RegionId>('tr');
  const [marketplaceId, setMarketplaceId] = useState('trendyol');
  const [category, setCategory] = useState<Category | null>(null);
  const [manualRate, setManualRate] = useState('');
  const [purchase, setPurchase] = useState('');
  const [sale, setSale] = useState('');
  const [shipping, setShipping] = useState('');
  const [tax, setTax] = useState('');
  const [other, setOther] = useState('0');
  const [returnRate, setReturnRate] = useState('0');
  const [amazonMode, setAmazonMode] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>('fbm');
  const [fbaMethod, setFbaMethod] = useState<FBAMethod>('asin');
  const [fbaInputs, setFbaInputs] = useState<FBAInputs>({
    unit: 'cm', width: '', length: '', height: '', weightUnit: 'kg', weight: '',
    fulfillmentCost: '', storageCost: '', inboundingCost: '', miscCost: '',
  });
  const [asinData, setAsinData] = useState<ASINData | null>(null);
  const [fbaTier, setFbaTier] = useState<string | null>(null);
  const [showFbaDetails, setShowFbaDetails] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const [inputCurrency, setInputCurrency] = useState<string>('₺');
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({ '₺': 34.5, '$': 1, '€': 0.92, '£': 0.79 });
  
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const region = REGIONS[regionId];
  const marketplace = region.marketplaces.find((m) => m.id === marketplaceId) || region.marketplaces[0];
  const isManual = marketplaceId === 'manuel';

  useEffect(() => {
    setAmazonMode(marketplaceId === 'amazon_us' || marketplaceId === 'amazon_tr');
    setInputCurrency(regionId === 'tr' ? '₺' : '$');
  }, [marketplaceId, regionId]);

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(data => {
        if (data.rates) {
          setCurrencyRates({
            '$': 1,
            '₺': data.rates.TRY || 34.5,
            '€': data.rates.EUR || 0.92,
            '£': data.rates.GBP || 0.79
          });
        }
      })
      .catch(() => { /* hata sessizce yoksayılır */ });
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < 60 || Math.abs(dy) > 50) return;
    const tabsList: TabId[] = ['calc', 'history', 'converter', 'calculator', 'feedback'];
    const idx = tabsList.indexOf(tab);
    if (dx < 0 && idx < tabsList.length - 1) setTab(tabsList[idx + 1]);
    else if (dx > 0 && idx > 0) setTab(tabsList[idx - 1]);
  }, [tab]);

  const resetInputs = useCallback(() => {
    setPurchase(''); setSale(''); setShipping(''); setTax(''); setOther('0'); setReturnRate('0');
    setCategory(null); setManualRate('');
    setFbaInputs({ unit: 'cm', width: '', length: '', height: '', weightUnit: 'kg', weight: '', fulfillmentCost: '', storageCost: '', inboundingCost: '', miscCost: '' });
    setAsinData(null); setFbaTier(null);
  }, []);

  const handleMarketplaceChange = (newId: string) => {
    setMarketplaceId(newId);
    setCategory(null);
    resetInputs();
  };

  const handleRegionChange = (newRegionId: RegionId) => {
    setRegionId(newRegionId);
    const r = REGIONS[newRegionId];
    setMarketplaceId(r.marketplaces[0].id);
    setCategory(null);
    resetInputs();
  };

  const handleCurrencyChange = (newSym: string) => {
    if (newSym === inputCurrency) return;
    setPurchase('');
    setSale('');
    setShipping('');
    setOther('');
    setInputCurrency(newSym);
  };

  const commissionRate = useMemo(() => {
    if (isManual) return parseFloat(manualRate) || 0;
    if (!category) return 0;
    const saleNum = parseFloat(sale) || 0;
    return resolveCommissionRate(category, saleNum);
  }, [isManual, manualRate, category, sale]);

  const hasAllInputs = useMemo(() => {
    const p = parseFloat(purchase);
    const s = parseFloat(sale);
    if (isNaN(p) || isNaN(s)) return false;
    if (s <= 0) return false;
    if (isManual && !manualRate) return false;
    if (!isManual && !category) return false;
    return true;
  }, [purchase, sale, isManual, manualRate, category]);

  const result = useMemo(() => {
    if (!hasAllInputs) return null;
    const purchaseNum = parseFloat(purchase);
    const saleNum = parseFloat(sale);

    if (amazonMode && fulfillmentMode === 'fba' && fbaMethod === 'asin' && asinData) {
      const costPerUnit = asinData.costPerUnit;
      const shippingNum = parseFloat(shipping) || 0;
      const taxNum = parseFloat(tax) || 0;
      const otherNum = parseFloat(other) || 0;
      const returnRateNum = parseFloat(returnRate) || 0;

      const commissionAmount = saleNum * (commissionRate / 100);
      const taxAmount = saleNum * (taxNum / 100);
      const returnCost = saleNum * (returnRateNum / 100);
      const totalCost = purchaseNum + costPerUnit + shippingNum + commissionAmount + taxAmount + returnCost + otherNum;
      const netProfit = saleNum - totalCost;
      return {
        netProfit,
        margin: saleNum > 0 ? (netProfit / saleNum) * 100 : 0,
        breakEvenPrice: purchaseNum + costPerUnit + shippingNum + otherNum,
        costRatio: saleNum > 0 ? (totalCost / saleNum) * 100 : 0,
        commissionAmount,
        taxAmount,
        returnCost,
        totalCost,
        isLoss: netProfit < 0,
        fbaCosts: { fulfillment: costPerUnit, storage: 0, inbounding: 0, misc: 0, total: costPerUnit },
      } as CalcResult;
    }

    let fbaCosts: { fulfillment: number; storage: number; inbounding: number; misc: number } | undefined;
    if (amazonMode && fulfillmentMode === 'fba') {
      const f = parseFloat(fbaInputs.fulfillmentCost) || 0;
      const s = parseFloat(fbaInputs.storageCost) || 0;
      const i = parseFloat(fbaInputs.inboundingCost) || 0;
      const m = parseFloat(fbaInputs.miscCost) || 0;
      fbaCosts = { fulfillment: f, storage: s, inbounding: i, misc: m };
    }
    return calculate(
      purchaseNum, saleNum, parseFloat(shipping) || 0,
      parseFloat(tax) || 0, commissionRate, parseFloat(returnRate) || 0,
      fbaCosts, parseFloat(other) || 0,
    );
  }, [hasAllInputs, purchase, sale, shipping, tax, other, returnRate, commissionRate, amazonMode, fulfillmentMode, fbaInputs, fbaMethod, asinData]);

  const calcFBAManual = useCallback(() => {
    const w = parseFloat(fbaInputs.width);
    const l = parseFloat(fbaInputs.length);
    const h = parseFloat(fbaInputs.height);
    const wt = parseFloat(fbaInputs.weight);
    if (isNaN(w) || isNaN(l) || isNaN(h) || isNaN(wt)) return;
    const tier = determineFBATier(regionId, w, l, h, wt, fbaInputs.unit, fbaInputs.weightUnit);
    const inbounding = calcInboundingCost(regionId, wt, fbaInputs.weightUnit);
    setFbaInputs((prev) => ({
      ...prev,
      fulfillmentCost: tier.fulfillment.toFixed(2),
      storageCost: tier.storage.toFixed(2),
      inboundingCost: inbounding.toFixed(2),
    }));
    setFbaTier(tier.tier);
  }, [fbaInputs.width, fbaInputs.length, fbaInputs.height, fbaInputs.weight, fbaInputs.unit, fbaInputs.weightUnit, regionId]);

  const addEntry = useCallback(() => {
    if (!result) return;
    const isEditing = editingEntryId !== null;
    const entry: HistoryEntry = {
      id: isEditing ? editingEntryId! : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      marketplaceId: marketplace.id,
      marketplaceName: marketplace.name,
      categoryName: isManual ? 'Manuel' : category?.name || '',
      purchase,
      sale,
      shipping,
      tax,
      other,
      returnRate,
      fbaInputs: amazonMode && fulfillmentMode === 'fba' && fbaMethod === 'manual' ? { ...fbaInputs } : null,
      asinData: amazonMode && fulfillmentMode === 'fba' && fbaMethod === 'asin' ? asinData : null,
      netProfit: result.netProfit,
      margin: result.margin,
      breakEven: result.breakEvenPrice,
      symbol: inputCurrency,
      isFavorite: false,
    };

    let updatedExisting = false;
    setHistory((prev) => {
      if (isEditing) {
        const existing = prev.find(x => x.id === editingEntryId);
        updatedExisting = !!existing;
        let next: HistoryEntry[];
        if (existing) {
          next = prev.map((x) => x.id === editingEntryId
            ? { ...entry, id: x.id, isFavorite: x.isFavorite, name: x.name }
            : x);
        } else {
          next = [entry, ...prev];
        }
        const favs = next.filter(x => x.isFavorite);
        let nonFavs = next.filter(x => !x.isFavorite);
        if (nonFavs.length > MAX_HISTORY) nonFavs = nonFavs.slice(0, MAX_HISTORY);
        const finalHistory = [...favs, ...nonFavs].sort((a,b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return b.timestamp - a.timestamp;
        });
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(finalHistory)); } catch { /* ignore */ }
        return finalHistory;
      }
      const matchIdx = prev.findIndex(x =>
        x.marketplaceId === entry.marketplaceId &&
        x.purchase === entry.purchase &&
        x.sale === entry.sale &&
        x.shipping === entry.shipping &&
        x.tax === entry.tax &&
        x.other === entry.other &&
        x.returnRate === entry.returnRate &&
        x.symbol === entry.symbol &&
        !x.isFavorite
      );
      updatedExisting = matchIdx >= 0;
      let next: HistoryEntry[];
      if (matchIdx >= 0) {
        next = prev.map((x, i) => i === matchIdx ? { ...entry, id: x.id, isFavorite: x.isFavorite, name: x.name } : x);
      } else {
        next = [entry, ...prev];
      }
      const favs = next.filter(x => x.isFavorite);
      let nonFavs = next.filter(x => !x.isFavorite);
      if (nonFavs.length > MAX_HISTORY) nonFavs = nonFavs.slice(0, MAX_HISTORY);
      const finalHistory = [...favs, ...nonFavs].sort((a,b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return b.timestamp - a.timestamp;
      });
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(finalHistory)); } catch { /* ignore */ }
      return finalHistory;
    });
    setEditingEntryId(null);
    setToast(updatedExisting ? t('updated_toast') : t('saved_toast'));
  }, [result, marketplace, isManual, category, purchase, sale, shipping, tax, other, returnRate, amazonMode, fulfillmentMode, fbaInputs, fbaMethod, asinData, inputCurrency, editingEntryId]);

  const toggleStarEntry = useCallback((id: string, name?: string) => {
    setHistory(prev => {
      let next = prev.map(e => {
        if (e.id === id) {
          const isFav = !e.isFavorite;
          return { ...e, isFavorite: isFav, name: isFav ? (name || e.name || t('favorite_default')) : undefined };
        }
        return e;
      });
      
      const favs = next.filter(x => x.isFavorite);
      let nonFavs = next.filter(x => !x.isFavorite);
      if (nonFavs.length > MAX_HISTORY) nonFavs = nonFavs.slice(0, MAX_HISTORY);
      const finalHistory = [...favs, ...nonFavs].sort((a,b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return b.timestamp - a.timestamp;
      });
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(finalHistory)); } catch {}
      return finalHistory;
    });
  }, []);

  const restoreEntry = useCallback((entry: HistoryEntry) => {
    setTab('calc');
    setEditingEntryId(entry.id);
    
    let matchedRegion: RegionId = 'tr';
    if (['amazon_us', 'etsy', 'ebay'].includes(entry.marketplaceId)) matchedRegion = 'us';
    setRegionId(matchedRegion);
    
    setTimeout(() => {
      setMarketplaceId(entry.marketplaceId);
      setInputCurrency(entry.symbol);
      setPurchase(entry.purchase);
      setSale(entry.sale);
      setShipping(entry.shipping);
      setTax(entry.tax);
      setOther(entry.other);
      setReturnRate(entry.returnRate);
      
      if (entry.marketplaceId === 'manuel') {
        setManualRate(''); 
      } else {
        const cats = MARKETPLACE_COMMISSIONS[entry.marketplaceId] || [];
        const found = cats.find(c => c.name === entry.categoryName);
        if (found) setCategory(found);
      }
      
      if (entry.asinData) {
        setFulfillmentMode('fba');
        setFbaMethod('asin');
        setAsinData(entry.asinData);
      } else if (entry.fbaInputs) {
        setFulfillmentMode('fba');
        setFbaMethod('manual');
        setFbaInputs(entry.fbaInputs);
      } else {
        setFulfillmentMode('fbm');
      }
      setToast(t('restored_toast'));
    }, 50);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory(prev => {
      const favsOnly = prev.filter(e => e.isFavorite);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(favsOnly)); } catch { /* ignore */ }
      return favsOnly;
    });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setHistory(prev => {
      const next = prev.filter(e => e.id !== id);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setToast(t('history_deleted'));
  }, []);

  const handleASINResult = (data: ASINData) => {
    setAsinData(data);
    setShipping('0');
    setTax('0');
    setOther('0');
    setReturnRate('0');
    setToast(t('asin_pulled'));
  };

  const sendFeedback = async () => {
    if (feedbackMsg.trim().length < 10) {
      setToast(t('feedback_too_short'));
      return;
    }
    setIsSendingFeedback(true);
    try {
      const { error: fbError } = await supabase
        .from('feedbacks')
        .insert({
          user_id: user?.id ?? null,
          email: user?.email ?? null,
          message: feedbackMsg,
        });
      if (fbError) throw fbError;
      setToast(t('feedback_sent'));
      setFeedbackMsg('');
    } catch (error) {
      console.error('Error sending feedback:', error);
      setToast(t('feedback_error'));
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const deleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('No session');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      await supabase.auth.signOut();
      setToast(t('delete_account_success'));
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Delete account error:', error);
      setToast(t('delete_account_error'));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'calc', label: t('tab_calc'),
      icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M9 7h6M9 12h6M9 17h3M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
    {
      id: 'history', label: t('tab_history'),
      icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M3 3v6h6M3 9a9 9 0 1 1 1.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
    {
      id: 'converter', label: t('tab_converter'),
      icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
    {
      id: 'calculator', label: t('tab_calculator'),
      icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M8 6h8M8 10h2M12 10h2M16 10h.01M8 14h2M12 14h2M16 14h.01M8 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
    },
    {
      id: 'feedback', label: t('tab_feedback'),
      icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    }
  ];

  let stepCounter = 0;
  const nextStep = () => ++stepCounter;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-surface-0" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {showFbaDetails && asinData && (
        <FbaDetailsModal data={asinData} onClose={() => setShowFbaDetails(false)} />
      )}

      <header className="flex items-center justify-between px-5 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div className="flex items-center gap-2">
          <img src={KepiLogo} alt="Kepi Logo" className="h-7 w-auto" />
          <button
            onClick={() => setShowPaywall(true)}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all active:scale-95 ${
              accessStatus === 'active'
                ? 'bg-success/10 text-success ring-1 ring-success/30 hover:bg-success/20'
                : 'bg-warning/10 text-warning ring-1 ring-warning/30 hover:bg-warning/20'
            }`}
            aria-label={accessStatus === 'active' ? t('days_left') : t('trial_days')}
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {accessStatus === 'active' ? `${daysLeft} ${t('days_left')}` : `${trialDaysLeft} ${t('trial_days')}`}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 space-y-3 overflow-y-auto px-4 pb-28 no-scrollbar">
        {tab === 'calc' && (
          <>
            <Section title={t('region_title')} step={nextStep()}>
              <div className="flex gap-2">
                {(['tr', 'us'] as RegionId[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRegionChange(r)}
                    className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${regionId === r ? 'bg-brand text-white shadow-card-lg' : 'bg-surface-1 text-content-dim ring-1 ring-border hover:ring-brand/40'}`}
                  >
                    {r === 'tr' ? t('region_tr') : t('region_us')}
                  </button>
                ))}
              </div>
            </Section>
            <Section title={t('marketplace_title')} step={nextStep()}>
              <div className="grid grid-cols-2 gap-2">
                {region.marketplaces.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleMarketplaceChange(m.id)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${marketplaceId === m.id ? 'bg-brand text-white' : 'bg-surface-2 text-content-dim ring-1 ring-border'}`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </Section>

            <Section title={t('category_title')} step={nextStep()} className="relative z-50">
              <div className="mb-1.5 flex justify-end">
                <span className="text-[9px] font-semibold text-danger">{t('required')}</span>
              </div>
              {isManual ? (
                <MoneyInput label={t('commission_rate')} suffix="%" value={manualRate} onChange={setManualRate} placeholder="0" isRequired />
              ) : (
                <CategoryDropdown categories={marketplace.categories} value={category} onChange={setCategory} />
              )}
            </Section>

            <div className="px-1">
              <p className="flex items-start gap-1.5 text-[11px] text-content-dim/70">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                {t('calc_disclaimer')}
              </p>
            </div>

            {amazonMode && (
              <Section title={t('fba_title')} step={nextStep()}>
                <div className="mb-3 flex gap-2">
                  {(['fbm', 'fba'] as FulfillmentMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setFulfillmentMode(m)}
                      className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all ${fulfillmentMode === m ? 'bg-brand text-white' : 'bg-surface-2 text-content-dim ring-1 ring-border'}`}
                    >
                      {m === 'fbm' ? 'FBM' : 'FBA'}
                    </button>
                  ))}
                </div>
                {fulfillmentMode === 'fba' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {(['asin', 'manual'] as FBAMethod[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => setFbaMethod(m)}
                          className={`flex-1 rounded-xl py-2 text-xs font-medium transition-all ${fbaMethod === m ? 'bg-brand text-white' : 'bg-surface-2 text-content-dim ring-1 ring-border'}`}
                        >
                          {m === 'asin' ? t('asin_lookup') : t('manual_dims')}
                        </button>
                      ))}
                    </div>

                    {fbaMethod === 'asin' ? (
                      <>
                        <ASINPanel onResult={handleASINResult} regionId={regionId} />
                        {asinData && (
                          <>
                            <div className="rounded-xl bg-surface-2 p-3 text-xs animate-fade-up">
                              <p className="font-semibold text-content">{asinData.title}</p>
                              <p className="mt-0.5 text-content-dim">{t('original_category')}: {asinData.category}</p>
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <div className="mb-1 flex items-end justify-between">
                                  <label className="block text-[11px] font-medium text-content-dim">{t('cost_per_unit')}</label>
                                  <span className="text-[9px] text-content-dim/40">{t('read_only')}</span>
                                </div>
                                <div className="flex items-center rounded-xl bg-surface-0 px-3 py-2.5 ring-1 ring-border/50">
                                  <span className="w-full text-sm font-semibold text-content">{asinData.costPerUnit.toFixed(2)}</span>
                                  <span className="px-3 text-[11px] font-medium text-content-dim">{region.symbol}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => setShowFbaDetails(true)}
                                className="self-end rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-medium text-brand ring-1 ring-brand/30 transition-all hover:bg-brand/10"
                              >
                                {t('details')}
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-medium text-content-dim">{t('width')} ({fbaInputs.unit})</label>
                            <input type="number" inputMode="decimal" value={fbaInputs.width} onChange={(e) => setFbaInputs({ ...fbaInputs, width: e.target.value })} placeholder="0" className="w-full rounded-xl bg-surface-1 px-2 py-2 text-sm text-content ring-1 ring-border outline-none focus:ring-brand/50" />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-medium text-content-dim">{t('length')} ({fbaInputs.unit})</label>
                            <input type="number" inputMode="decimal" value={fbaInputs.length} onChange={(e) => setFbaInputs({ ...fbaInputs, length: e.target.value })} placeholder="0" className="w-full rounded-xl bg-surface-1 px-2 py-2 text-sm text-content ring-1 ring-border outline-none focus:ring-brand/50" />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-medium text-content-dim">{t('height')} ({fbaInputs.unit})</label>
                            <input type="number" inputMode="decimal" value={fbaInputs.height} onChange={(e) => setFbaInputs({ ...fbaInputs, height: e.target.value })} placeholder="0" className="w-full rounded-xl bg-surface-1 px-2 py-2 text-sm text-content ring-1 ring-border outline-none focus:ring-brand/50" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-medium text-content-dim">{t('weight')} ({fbaInputs.weightUnit})</label>
                            <input type="number" inputMode="decimal" value={fbaInputs.weight} onChange={(e) => setFbaInputs({ ...fbaInputs, weight: e.target.value })} placeholder="0" className="w-full rounded-xl bg-surface-1 px-3 py-2 text-sm text-content ring-1 ring-border outline-none focus:ring-brand/50" />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-medium text-content-dim">{t('unit')}</label>
                            <div className="flex gap-1">
                              <button onClick={() => setFbaInputs({ ...fbaInputs, unit: 'cm' })} className={`flex-1 rounded-lg py-2 text-xs font-medium ${fbaInputs.unit === 'cm' ? 'bg-brand text-white' : 'bg-surface-2 text-content-dim ring-1 ring-border'}`}>cm</button>
                              <button onClick={() => setFbaInputs({ ...fbaInputs, unit: 'in' })} className={`flex-1 rounded-lg py-2 text-xs font-medium ${fbaInputs.unit === 'in' ? 'bg-brand text-white' : 'bg-surface-2 text-content-dim ring-1 ring-border'}`}>in</button>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setFbaInputs({ ...fbaInputs, weightUnit: 'kg' })} className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${fbaInputs.weightUnit === 'kg' ? 'bg-brand text-white' : 'bg-surface-2 text-content-dim ring-1 ring-border'}`}>kg</button>
                          <button onClick={() => setFbaInputs({ ...fbaInputs, weightUnit: 'lb' })} className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${fbaInputs.weightUnit === 'lb' ? 'bg-brand text-white' : 'bg-surface-2 text-content-dim ring-1 ring-border'}`}>lb</button>
                          <button onClick={calcFBAManual} className="flex-1 rounded-lg bg-brand py-1.5 text-xs font-semibold text-white transition-all hover:bg-brand-dark">{t('calculate')}</button>
                        </div>
                        {fbaTier && (
                          <p className="text-center text-[11px] text-content-dim">{t('size_tier')}: <span className="font-semibold text-brand">{fbaTier}</span></p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <MoneyInput label={t('fba_fee')} suffix={region.symbol} value={fbaInputs.fulfillmentCost} onChange={(v) => setFbaInputs({ ...fbaInputs, fulfillmentCost: v })} disabled />
                          <MoneyInput label={t('storage_fee')} suffix={region.symbol} value={fbaInputs.storageCost} onChange={(v) => setFbaInputs({ ...fbaInputs, storageCost: v })} disabled />
                          <MoneyInput label={t('inbounding')} suffix={region.symbol} value={fbaInputs.inboundingCost} onChange={(v) => setFbaInputs({ ...fbaInputs, inboundingCost: v })} disabled />
                          <MoneyInput label={t('other_fba')} suffix={region.symbol} value={fbaInputs.miscCost} onChange={(v) => setFbaInputs({ ...fbaInputs, miscCost: v })} />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Section>
            )}

            <Section title={t('price_info')} step={nextStep()}>
              <div className="mb-4 flex justify-end">
                <div className="flex rounded-lg bg-surface-1 ring-1 ring-border p-1">
                  {CURRENCIES.map(c => (
                    <button
                      key={c.sym}
                      onClick={() => handleCurrencyChange(c.sym)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${inputCurrency === c.sym ? 'bg-brand text-white shadow-sm' : 'text-content-dim hover:text-content'}`}
                    >
                      {c.sym} ({c.code})
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <MoneyInput label={t('purchase')} suffix={inputCurrency} value={purchase} onChange={setPurchase} isRequired />
                <MoneyInput label={t('sale')} suffix={inputCurrency} value={sale} onChange={setSale} isRequired />
                <MoneyInput label={t('shipping')} suffix={inputCurrency} value={shipping} onChange={setShipping} isRequired={false} />
                <MoneyInput label={t('tax')} suffix="%" value={tax} onChange={setTax} isRequired={false} />
                <div>
                  <MoneyInput label={t('other')} suffix={inputCurrency} value={other} onChange={setOther} isRequired={false} />
                  <p className="mt-1.5 px-1 text-[10px] text-content-dim/70">{t('other_hint')}</p>
                </div>
                <MoneyInput label={t('return_rate')} suffix="%" value={returnRate} onChange={setReturnRate} isRequired={false} />
              </div>
            </Section>

            {hasAllInputs && result && (
              <Section title={t('result')} step={nextStep()}>
                <ResultCard result={result} symbol={inputCurrency} />
                <button
                  onClick={addEntry}
                  className="mt-3 w-full rounded-xl bg-surface-2 py-2.5 text-sm font-medium text-content ring-1 ring-border transition-all hover:bg-brand/10 hover:ring-brand/30"
                >
                  {t('save_history')}
                </button>
              </Section>
            )}

            <button
              onClick={resetInputs}
              className="w-full rounded-xl bg-surface-1 py-2.5 text-sm font-medium text-danger ring-1 ring-danger/20 transition-all hover:bg-danger/10"
            >
              {t('reset')}
            </button>
          </>
        )}

        {tab === 'history' && (
          <>
            <div>
              <h2 className="text-lg font-bold text-content">{t('history_title')}</h2>
              <p className="text-[11px] text-content-dim">{t('history_hint')}</p>
            </div>
            <HistoryPanel history={history} onClear={clearHistory} onRestore={restoreEntry} onToggleStar={toggleStarEntry} onDelete={deleteEntry} />
          </>
        )}

        {tab === 'converter' && <ConverterTab />}
        {tab === 'calculator' && <CalculatorTab />}
        
        {tab === 'feedback' && (
          <Section title={t('feedback_title')}>
            <div className="space-y-4">
              <div className="rounded-xl bg-surface-1 border border-border p-4">
                <p className="text-xs text-content leading-relaxed text-justify mb-4">
                  {t('feedback_body1')}
                </p>
                <p className="text-xs text-content leading-relaxed text-justify">
                  {t('feedback_body2')}
                </p>
              </div>

              <div>
                <textarea
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                  maxLength={1000}
                  placeholder={t('feedback_placeholder')}
                  className="w-full min-h-[120px] rounded-xl bg-surface-1 p-3 text-sm text-content ring-1 ring-border outline-none focus:ring-brand/50 resize-y"
                />
                <div className="mt-1 flex justify-end">
                  <span className="text-[10px] font-medium text-content-dim">
                    {feedbackMsg.length} / 1000
                  </span>
                </div>
              </div>

              <button
                onClick={sendFeedback}
                disabled={isSendingFeedback || feedbackMsg.trim().length === 0}
                className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white transition-all hover:bg-brand-dark disabled:opacity-50"
              >
                {isSendingFeedback ? t('sending') : t('send')}
              </button>

              <button
                onClick={() => signOut()}
                className="w-full rounded-xl bg-surface-2 py-3 text-sm font-semibold text-danger ring-1 ring-danger/20 transition-all hover:bg-danger/10 active:scale-[0.98]"
              >
                {t('sign_out')}
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeletingAccount}
                className="w-full rounded-xl bg-danger/10 py-3 text-sm font-semibold text-danger ring-1 ring-danger/30 transition-all hover:bg-danger/20 active:scale-[0.98] disabled:opacity-50"
              >
                {t('delete_account')}
              </button>
            </div>
          </Section>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={() => !isDeletingAccount && setShowDeleteConfirm(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-up" />
            <div
              className="relative z-10 w-full max-w-sm rounded-2xl bg-surface-1 p-5 ring-1 ring-border shadow-card-lg animate-fade-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-danger/15">
                  <svg className="h-5 w-5 text-danger" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h3 className="text-base font-bold text-content">{t('delete_account_confirm_title')}</h3>
              </div>
              <p className="mb-4 text-sm text-content-dim leading-relaxed">{t('delete_account_confirm')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeletingAccount}
                  className="flex-1 rounded-xl bg-surface-2 py-2.5 text-sm font-semibold text-content ring-1 ring-border transition-all hover:bg-surface-2/80 disabled:opacity-50"
                >
                  {t('delete_account_cancel_btn')}
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={isDeletingAccount}
                  className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-semibold text-white transition-all hover:bg-danger/90 disabled:opacity-50"
                >
                  {isDeletingAccount ? t('deleting') : t('delete_account_confirm_btn')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface-1/95 backdrop-blur-xl" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
        <div className="mx-auto flex max-w-md">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors ${tab === t.id ? 'text-brand' : 'text-content-dim'}`}
            >
              {t.icon}
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {showPaywall && (
        <PaywallScreen onPurchased={() => setShowPaywall(false)} onClose={() => setShowPaywall(false)} />
      )}
    </div>
  );
}
