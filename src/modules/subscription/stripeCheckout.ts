import { SubscriptionModule, CheckoutParams, CheckoutResult, VerifyResult, RestoreResult } from './index';

// The Stripe checkout flow never touches stripe.com directly from the app.
// All API calls go through our proxy server, which holds the Stripe secret key.
// The proxy constructs HTTPS success/cancel URLs for Stripe (live mode requires HTTPS).
// Stripe redirects the browser to the proxy's /checkout-redirect page, which
// then deep-links back into the app via platerotate://checkout-success?session_id=xxx.
const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL;
const APP_TOKEN = process.env.EXPO_PUBLIC_APP_TOKEN;

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
  return proxyPost<CheckoutResult>('/create-checkout-session', { plan });
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
