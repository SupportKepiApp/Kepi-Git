import { useCallback, useEffect, useState } from 'react';

export interface HistoryEntry {
  id: string;
  marketplace: string;
  purchasePrice: number;
  salePrice: number;
  netProfit: number;
  margin: number;
  currency: string;
  symbol: string;
  date: string; // dd.mm.yyyy
  time: string; // HH:MM
  timestamp: number;
}

const STORAGE_KEY = 'kepi_history_v1';
const MAX_ENTRIES = 10;

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function formatDateTime(d: Date): { date: string; time: string } {
  return {
    date: `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function readStorage(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(readStorage());
  }, []);

  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp' | 'date' | 'time'>) => {
    const now = new Date();
    const { date, time } = formatDateTime(now);
    const full: HistoryEntry = {
      ...entry,
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: now.getTime(),
      date,
      time,
    };
    setHistory((prev) => {
      const next = [full, ...prev].slice(0, MAX_ENTRIES);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  }, []);

  return { history, addEntry, clearHistory };
}
