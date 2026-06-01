import { SubscriptionModule, CheckoutParams, CheckoutResult, VerifyResult, RestoreResult } from './index';

// The Stripe checkout flow never touches stripe.com directly from the app.
// All API calls go through our proxy server, which holds the Stripe secret key.
const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL;
const APP_TOKEN = process.env.EXPO_PUBLIC_APP_TOKEN;

// Deep link the app registers in app.json as scheme: "platerotate".
// Stripe replaces {CHECKOUT_SESSION_ID} with the real session ID on redirect.
const SUCCESS_URL = 'platerotate://checkout-success?session_id={CHECKOUT_SESSION_ID}';
const CANCEL_URL = 'platerotate://';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${APP_TOKEN ?? ''}`,
  };
}

async function proxyPost<T>(path: string, body: unknown): Promise<T> {
  if (!PROXY_URL) throw new Error('Proxy URL not configured. Add EXPO_PUBLIC_PROXY_URL to .env.');

  const res = await fetch(`${PROXY_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({})) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? 'Request failed. Please try again.');
  }
  return data as T;
}

async function createCheckoutSession({ plan }: CheckoutParams): Promise<CheckoutResult> {
  return proxyPost<CheckoutResult>('/create-checkout-session', {
    plan,
    successUrl: SUCCESS_URL,
    cancelUrl: CANCEL_URL,
  });
}

async function verifySession(sessionId: string): Promise<VerifyResult> {
  return proxyPost<VerifyResult>('/verify-session', { sessionId });
}

async function restoreSubscription(email: string): Promise<RestoreResult> {
  return proxyPost<RestoreResult>('/restore-subscription', { email });
}

export const stripeCheckoutModule: SubscriptionModule = {
  createCheckoutSession,
  verifySession,
  restoreSubscription,
};
