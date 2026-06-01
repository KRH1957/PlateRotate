import { Tier } from '../../types';

export interface CheckoutParams {
  plan: Exclude<Tier, 'free'>;
}

export interface CheckoutResult {
  url: string;
  sessionId: string;
}

export interface VerifyResult {
  paid: boolean;
  plan: Exclude<Tier, 'free'> | null;
  email: string | null;
}

export interface RestoreResult {
  found: boolean;
  plan: Exclude<Tier, 'free'> | null;
}

export interface SubscriptionModule {
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult>;
  verifySession(sessionId: string): Promise<VerifyResult>;
  restoreSubscription(email: string): Promise<RestoreResult>;
}
