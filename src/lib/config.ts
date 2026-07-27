// SKU ve plan yapılandırması.
// Google Play Console'daki ürünleri buradan kolayca güncelleyebilirsiniz.
// Play Console > Monetize > Products > Subscriptions bölümündeki
// "Product ID" değerleriyle birebir eşleşmelidir.

export const SUBSCRIPTION_SKUS = {
  monthly: 'kepi_monthly',
  yearly: 'kepi_yearly',
} as const;

export type PlanId = 'monthly' | 'yearly';

export interface PlanConfig {
  id: PlanId;
  sku: string;
  name: string;
  fallbackPrice: string;
  description: string;
  badge?: string;
}

export const PLANS: PlanConfig[] = [
  {
    id: 'yearly',
    sku: SUBSCRIPTION_SKUS.yearly,
    name: 'plan_yearly',
    fallbackPrice: '399,00 ₺',
    description: 'plan_yearly_desc',
    badge: 'plan_badge',
  },
  {
    id: 'monthly',
    sku: SUBSCRIPTION_SKUS.monthly,
    name: 'plan_monthly',
    fallbackPrice: '39,00 ₺',
    description: 'plan_monthly_desc',
  },
];
