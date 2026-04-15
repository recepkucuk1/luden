/**
 * iyzico Subscription API v2 client using official `iyzipay` Node.js SDK.
 *
 * Promisified wrapper for specific subscription methods used in LudenLab.
 */

import Iyzipay from "iyzipay";

// Lazy initialization — build zamanında env var olmadığı için modül
// yüklendiğinde değil, ilk API çağrısında oluşturulur.
let _iyzipay: Iyzipay | null = null;
function getClient(): Iyzipay {
  if (!_iyzipay) {
    _iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
    });
  }
  return _iyzipay;
}

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface IyzicoProduct {
  referenceCode: string;
  createdDate: string;
  name: string;
  description?: string;
  status: string;
  pricingPlans: IyzicoPricingPlan[];
}

export interface IyzicoPricingPlan {
  referenceCode: string;
  createdDate: string | number;
  name: string;
  price: number;
  currencyCode: string;
  paymentInterval: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  paymentIntervalCount: number;
  trialPeriodDays?: number;
  productReferenceCode: string;
  planPaymentType: string;
  status: string;
  recurrenceCount?: number;
}

export interface IyzicoCustomer {
  name: string;
  surname: string;
  identityNumber: string;
  email: string;
  gsmNumber: string;
  billingAddress: {
    contactName: string;
    city: string;
    district: string;
    country: string;
    address: string;
    zipCode: string;
  };
  shippingAddress: {
    contactName: string;
    city: string;
    district: string;
    country: string;
    address: string;
    zipCode: string;
  };
}

export interface IyzicoSubscriptionData {
  referenceCode: string;
  parentReferenceCode?: string;
  pricingPlanReferenceCode: string;
  customerReferenceCode: string;
  customerEmail: string;
  subscriptionStatus: string;
  trialDays?: number;
  trialStartDate?: string;
  trialEndDate?: string;
  startDate: string;
  endDate?: string;
  createdDate: string;
}

// ─── Wrapper Helper ──────────────────────────────────────────────────────────

interface IyzicoResponse<T = unknown> {
  status: "success" | "failure";
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
  systemTime?: number;
  data?: T;
  token?: string;
  checkoutFormContent?: string;
  tokenExpireTime?: number;
}

// ─── Product API ────────────────────────────────────────────────────────────

export async function createProduct(
  name: string,
  description?: string,
): Promise<IyzicoResponse<IyzicoProduct>> {
  return new Promise((resolve, reject) => {
    getClient().subscriptionProduct.create(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: Date.now().toString(),
        name,
        description,
      },
      (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
  });
}

export async function listProducts(
  page = 1,
  count = 20,
): Promise<
  IyzicoResponse<{
    totalCount: string;
    currentPage: number;
    pageCount: number;
    items: IyzicoProduct[];
  }>
> {
  return new Promise((resolve, reject) => {
    getClient().subscriptionProduct.retrieveList(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: Date.now().toString(),
        page,
        count,
      },
      (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
  });
}

// ─── Pricing Plan API ───────────────────────────────────────────────────────

interface CreatePricingPlanInput {
  productReferenceCode: string;
  name: string;
  price: number;
  paymentInterval: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  paymentIntervalCount?: number;
  currencyCode?: string;
  planPaymentType?: string;
  trialPeriodDays?: number;
}

export async function createPricingPlan(
  input: CreatePricingPlanInput,
): Promise<IyzicoResponse<IyzicoPricingPlan>> {
  return new Promise((resolve, reject) => {
    getClient().subscriptionPricingPlan.create(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: Date.now().toString(),
        planPaymentType: "RECURRING",
        paymentIntervalCount: 1,
        trialPeriodDays: 0,
        currencyCode: "TRY",
        ...input,
      },
      (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
  });
}

export async function listPricingPlans(
  productReferenceCode: string,
  page = 1,
  count = 100,
): Promise<IyzicoResponse<{ items: IyzicoPricingPlan[] }>> {
  return new Promise((resolve, reject) => {
    getClient().subscriptionPricingPlan.retrieveList(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: Date.now().toString(),
        productReferenceCode,
        page,
        count,
      },
      (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
  });
}

// ─── Checkout Form API ──────────────────────────────────────────────────────

interface InitCheckoutFormInput {
  pricingPlanReferenceCode: string;
  callbackUrl: string;
  customer: IyzicoCustomer;
  subscriptionInitialStatus?: "ACTIVE" | "PENDING";
}

export async function initializeCheckoutForm(
  input: InitCheckoutFormInput,
): Promise<IyzicoResponse<never>> {
  return new Promise((resolve, reject) => {
    getClient().subscriptionCheckoutForm.initialize(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: Date.now().toString(),
        subscriptionInitialStatus: "ACTIVE",
        ...input,
      },
      (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
  });
}

export async function retrieveCheckoutForm(
  token: string,
): Promise<IyzicoResponse<IyzicoSubscriptionData>> {
  return new Promise((resolve, reject) => {
    getClient().subscriptionCheckoutForm.retrieve(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: Date.now().toString(),
        checkoutFormToken: token, // Note: the SDK might expect token instead of checkoutFormToken, let's pass both to be safe
        token: token,
      },
      (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
  });
}

// ─── Subscription Management ────────────────────────────────────────────────

export async function retrieveSubscription(
  subscriptionReferenceCode: string,
): Promise<IyzicoResponse<IyzicoSubscriptionData>> {
  return new Promise((resolve, reject) => {
    getClient().subscription.retrieve(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: Date.now().toString(),
        subscriptionReferenceCode,
      },
      (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
  });
}

export async function cancelSubscription(
  subscriptionReferenceCode: string,
): Promise<IyzicoResponse<never>> {
  return new Promise((resolve, reject) => {
    getClient().subscription.cancel(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: Date.now().toString(),
        subscriptionReferenceCode,
      },
      (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
  });
}
