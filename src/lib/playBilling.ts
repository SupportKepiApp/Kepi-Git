import { Capacitor } from '@capacitor/core';
import { PlayBilling, type PlayBillingProduct } from './nativePlugins';
import { SUBSCRIPTION_SKUS } from './config';

export type PlanId = 'monthly' | 'yearly';

export interface DigitalServiceItem {
  itemId: string;
  title: string;
  description: string;
  price: { value: string; currency: string };
}

export const PRODUCT_SKUS = SUBSCRIPTION_SKUS;

export function isPlayBillingAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export async function fetchProductDetails(): Promise<Record<string, DigitalServiceItem>> {
  if (!Capacitor.isNativePlatform()) return {};

  try {
    const result = await PlayBilling.fetchProductDetails({
      skus: Object.values(PRODUCT_SKUS),
    });
    const out: Record<string, DigitalServiceItem> = {};
    for (const p of result.products as PlayBillingProduct[]) {
      out[p.itemId] = {
        itemId: p.itemId,
        title: p.title,
        description: p.description,
        price: p.price,
      };
    }
    return out;
  } catch {
    return {};
  }
}

interface PurchaseResult {
  purchaseToken: string;
  productId: string;
}

export async function purchasePlan(plan: 'monthly' | 'yearly'): Promise<PurchaseResult> {
  const sku = PRODUCT_SKUS[plan];

  if (Capacitor.isNativePlatform()) {
    const result = await PlayBilling.purchasePlan({ sku });
    if (!result?.purchaseToken) throw new Error('Ödeme iptal edildi');
    return { purchaseToken: result.purchaseToken, productId: result.productId || sku };
  }

  throw new Error('Google Play Billing bu cihazda kullanılamıyor');
}

export async function acknowledgePurchase(token: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await PlayBilling.acknowledgePurchase({ purchaseToken: token });
  } catch {
    // ignore - verification already done server-side
  }
}
