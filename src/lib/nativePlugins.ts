import { registerPlugin } from '@capacitor/core';

// Native Google Sign-In plugin (no browser, uses AccountManager)
export interface GoogleSignInResult {
  idToken: string;
}
export interface GoogleSignInPlugin {
  signIn(): Promise<GoogleSignInResult>;
}

// Native Play Billing plugin (Billing Client 8.x)
export interface PlayBillingProduct {
  itemId: string;
  title: string;
  description: string;
  price: { value: string; currency: string };
}
export interface PlayBillingProductDetailsResult {
  products: PlayBillingProduct[];
}
export interface PlayBillingPurchaseResult {
  purchaseToken: string;
  productId: string;
}
export interface PlayBillingPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  fetchProductDetails(options: { skus: string[] }): Promise<PlayBillingProductDetailsResult>;
  purchasePlan(options: { sku: string }): Promise<PlayBillingPurchaseResult>;
  acknowledgePurchase(options: { purchaseToken: string }): Promise<void>;
}

export const GoogleSignIn = registerPlugin<GoogleSignInPlugin>('GoogleSignIn');
export const PlayBilling = registerPlugin<PlayBillingPlugin>('PlayBilling');
