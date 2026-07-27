package com.kepi.app.plugins;

import android.app.Activity;
import android.content.Context;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

/**
 * Native Google Play Billing plugin using Billing Client 8.x.
 *
 * Key fixes for Billing 8.x compatibility:
 * - enablePendingPurchases() requires PendingPurchasesParams for BOTH subs and inapp
 * - queryProductDetailsAsync returns QueryProductDetailsResult, use .getProductDetailsList()
 * - Product type is always "SUBS" (uppercase) for subscriptions
 * - Handles undefined/null purchase responses safely (no JSON.parse of undefined)
 */
@CapacitorPlugin(name = "PlayBilling")
public class PlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private static final String TAG = "PlayBillingPlugin";
    private BillingClient billingClient;
    private PluginCall pendingPurchaseCall;
    private boolean billingConnected = false;

    @Override
    public void load() {
        super.load();
        initBillingClient();
    }

    private void initBillingClient() {
        // Billing 8.x: enablePendingPurchases() requires params for both subs AND inapp
        PendingPurchasesParams pendingParams = PendingPurchasesParams.newBuilder()
            .enableOneTimeProducts()
            .enablePrepaidPlans()
            .build();

        billingClient = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(pendingParams)
            .build();

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    billingConnected = true;
                    Log.d(TAG, "Billing client connected");
                } else {
                    billingConnected = false;
                    Log.e(TAG, "Billing setup failed: " + billingResult.getResponseCode());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                billingConnected = false;
                Log.d(TAG, "Billing client disconnected");
            }
        });
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", billingConnected);
        call.resolve(ret);
    }

    @PluginMethod
    public void fetchProductDetails(PluginCall call) {
        if (!billingConnected) {
            call.reject("Billing not connected");
            return;
        }

        JSArray skuArray = call.getArray("skus");
        if (skuArray == null) {
            call.reject("skus required");
            return;
        }

        List<String> skuList = new ArrayList<>();
        for (int i = 0; i < skuArray.length(); i++) {
            try {
                skuList.add(skuArray.getString(i));
            } catch (Exception e) {
                // skip invalid
            }
        }

        // Always use SUBS (uppercase) for subscriptions - critical fix
        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        for (String sku : skuList) {
            products.add(QueryProductDetailsParams.Product.newBuilder()
                .setProductId(sku)
                .setProductType(BillingClient.ProductType.SUBS)
                .build());
        }

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(products)
            .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsResult) -> {
            // Billing 8.x: use getProductDetailsList() on the result object
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                call.reject("Product query failed: " + billingResult.getResponseCode());
                return;
            }

            List<ProductDetails> detailsList = productDetailsResult.getProductDetailsList();
            JSArray resultArray = new JSArray();
            for (ProductDetails details : detailsList) {
                JSObject item = new JSObject();
                item.put("itemId", details.getProductId());
                item.put("title", details.getTitle());
                item.put("description", details.getDescription());

                // Get subscription offer details
                List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
                if (offers != null && !offers.isEmpty()) {
                    ProductDetails.SubscriptionOfferDetails offer = offers.get(0);
                    List<ProductDetails.PricingPhase> phases = offer.getPricingPhases().getPricingPhaseList();
                    if (!phases.isEmpty()) {
                        ProductDetails.PricingPhase phase = phases.get(0);
                        JSObject price = new JSObject();
                        price.put("value", phase.getFormattedPrice());
                        price.put("currency", phase.getPriceCurrencyCode());
                        item.put("price", price);
                    }
                }
                resultArray.put(item);
            }

            JSObject ret = new JSObject();
            ret.put("products", resultArray);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void purchasePlan(PluginCall call) {
        if (!billingConnected) {
            call.reject("Billing not connected");
            return;
        }

        String sku = call.getString("sku");
        if (sku == null) {
            call.reject("sku required");
            return;
        }

        pendingPurchaseCall = call;

        // Query product details first to get the offer for launchBillingFlow
        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        productList.add(QueryProductDetailsParams.Product.newBuilder()
            .setProductId(sku)
            .setProductType(BillingClient.ProductType.SUBS)
            .build());

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsResult) -> {
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                if (pendingPurchaseCall != null) {
                    pendingPurchaseCall.reject("Product query failed: " + billingResult.getResponseCode());
                    pendingPurchaseCall = null;
                }
                return;
            }

            List<ProductDetails> detailsList = productDetailsResult.getProductDetailsList();
            if (detailsList == null || detailsList.isEmpty()) {
                if (pendingPurchaseCall != null) {
                    pendingPurchaseCall.reject("Product not found: " + sku);
                    pendingPurchaseCall = null;
                }
                return;
            }

            ProductDetails details = detailsList.get(0);
            List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
            if (offers == null || offers.isEmpty()) {
                if (pendingPurchaseCall != null) {
                    pendingPurchaseCall.reject("No subscription offers available");
                    pendingPurchaseCall = null;
                }
                return;
            }

            ProductDetails.SubscriptionOfferDetails offer = offers.get(0);
            BillingFlowParams.ProductDetailsParams productDetailsParams =
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(details)
                    .setOfferToken(offer.getOfferToken())
                    .build();

            BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(List.of(productDetailsParams))
                .build();

            BillingResult flowResult = billingClient.launchBillingFlow(getActivity(), billingFlowParams);
            if (flowResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                if (pendingPurchaseCall != null) {
                    pendingPurchaseCall.reject("Billing flow failed: " + flowResult.getResponseCode());
                    pendingPurchaseCall = null;
                }
            }
        });
    }

    @PluginMethod
    public void acknowledgePurchase(PluginCall call) {
        String purchaseToken = call.getString("purchaseToken");
        if (purchaseToken == null) {
            call.reject("purchaseToken required");
            return;
        }

        if (!billingConnected) {
            call.reject("Billing not connected");
            return;
        }

        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build(),
            (billingResult, purchases) -> {
                for (Purchase purchase : purchases) {
                    if (purchase.getPurchaseToken().equals(purchaseToken)) {
                        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                            AcknowledgePurchaseParams ackParams = AcknowledgePurchaseParams.newBuilder()
                                .setPurchaseToken(purchaseToken)
                                .build();
                            billingClient.acknowledgePurchase(ackParams, ackResult -> {
                                if (ackResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                                    call.resolve();
                                } else {
                                    call.reject("Acknowledge failed: " + ackResult.getResponseCode());
                                }
                            });
                        } else {
                            call.resolve();
                        }
                        return;
                    }
                }
                call.reject("Purchase not found for token");
            }
        );
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        if (pendingPurchaseCall == null) return;

        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    JSObject ret = new JSObject();
                    ret.put("purchaseToken", purchase.getPurchaseToken());
                    ret.put("productId", purchase.getProducts().isEmpty() ? "" : purchase.getProducts().get(0));
                    pendingPurchaseCall.resolve(ret);
                    pendingPurchaseCall = null;
                    return;
                }
            }
            // Purchase pending - safe handling, no crash
            pendingPurchaseCall.reject("Purchase pending");
            pendingPurchaseCall = null;
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            pendingPurchaseCall.reject("Purchase cancelled");
            pendingPurchaseCall = null;
        } else {
            // Safe error handling - no undefined JSON parse
            pendingPurchaseCall.reject("Purchase failed: " + billingResult.getResponseCode());
            pendingPurchaseCall = null;
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (billingClient != null && billingConnected) {
            billingClient.endConnection();
        }
        super.handleOnDestroy();
    }
}
