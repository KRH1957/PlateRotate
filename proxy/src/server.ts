import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';

// Load .env file if present — covers platforms that use file-based env config
// rather than injecting vars directly into the process environment.
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const APP_TOKEN = process.env.APP_TOKEN;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_BASIC_MONTHLY = process.env.STRIPE_PRICE_BASIC_MONTHLY;
const STRIPE_PRICE_PRO_MONTHLY = process.env.STRIPE_PRICE_PRO_MONTHLY;
const MODEL = 'claude-haiku-4-5-20251001';

// Log startup state — visible in Railway's log viewer
console.log(`[startup] PlateRotate proxy starting on port ${PORT}`);
console.log(`[startup] Working directory: ${process.cwd()}`);
console.log(`[startup] Node version: ${process.version}`);
console.log(`[startup] ANTHROPIC_API_KEY set: ${!!ANTHROPIC_API_KEY}`);
console.log(`[startup] APP_TOKEN set: ${!!APP_TOKEN}`);
console.log(`[startup] STRIPE_SECRET_KEY set: ${!!STRIPE_SECRET_KEY}`);
console.log(`[startup] STRIPE_PRICE_BASIC_MONTHLY set: ${!!STRIPE_PRICE_BASIC_MONTHLY}`);
console.log(`[startup] STRIPE_PRICE_PRO_MONTHLY set: ${!!STRIPE_PRICE_PRO_MONTHLY}`);

// Stripe client — null if key not set (graceful degradation)
const stripe: Stripe | null = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

app.use(express.json({ limit: '16kb' }));

// Rate limit: 30 requests per minute per IP — stops bots and accidental abuse
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
});
app.use(limiter);

// Every request to protected routes must include the app token in the Authorization header.
// This blocks random internet traffic from using the proxy as a free gateway.
function requireAppToken(req: Request, res: Response, next: NextFunction): void {
  if (!APP_TOKEN) {
    res.status(503).json({ error: 'Server is not configured. Contact support.' });
    return;
  }
  const auth = (req.headers['authorization'] as string | undefined) ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || token !== APP_TOKEN) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }
  next();
}

// ─── Meal Conversion ─────────────────────────────────────────────────────────

interface ConvertRequestBody {
  originalMeal: string;
  dietId: string;
  dietLabel: string;
  allergens: string[];
  allergenLabels: string[];
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
}

function buildPrompt(body: ConvertRequestBody): string {
  const allergenLine =
    body.allergens.length > 0
      ? `ALLERGEN RESTRICTIONS — you MUST exclude ALL of these from the converted recipe: ${body.allergenLabels.join(', ')}.`
      : 'No allergen restrictions.';

  return `You are a meal conversion expert. Convert the meal below to the ${body.dietLabel} diet.

Meal to convert: ${body.originalMeal}
Target diet: ${body.dietLabel}
${allergenLine}

Return ONLY a valid JSON object — no markdown, no explanation, no extra text. Use exactly this structure:
{
  "convertedMealName": "The name of the converted meal",
  "ingredients": ["ingredient with quantity 1", "ingredient with quantity 2"],
  "instructions": ["Step 1: ...", "Step 2: ..."],
  "notes": "Brief note on key substitutions or tips for this diet"
}`;
}

function extractJson(raw: string): string {
  return raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
}

app.post('/convert', requireAppToken, async (req: Request, res: Response): Promise<void> => {
  if (!ANTHROPIC_API_KEY) {
    res.status(503).json({ error: 'Server is not configured. Contact support.' });
    return;
  }

  const body = req.body as ConvertRequestBody;

  if (!body.originalMeal || typeof body.originalMeal !== 'string' || body.originalMeal.trim().length === 0) {
    res.status(400).json({ error: 'originalMeal is required.' });
    return;
  }
  if (!body.dietLabel || typeof body.dietLabel !== 'string') {
    res.status(400).json({ error: 'dietLabel is required.' });
    return;
  }
  if (body.originalMeal.length > 500) {
    res.status(400).json({ error: 'Meal description is too long. Please keep it under 500 characters.' });
    return;
  }
  if (!Array.isArray(body.allergens) || !Array.isArray(body.allergenLabels)) {
    res.status(400).json({ error: 'allergens and allergenLabels must be arrays.' });
    return;
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: buildPrompt(body) }],
      }),
    });

    if (!anthropicRes.ok) {
      console.error(`Anthropic error ${anthropicRes.status}:`, await anthropicRes.text());
      if (anthropicRes.status === 429) {
        res.status(429).json({ error: 'Service is busy. Please wait a moment and try again.' });
        return;
      }
      res.status(502).json({ error: 'Conversion service temporarily unavailable. Please try again.' });
      return;
    }

    const data = await anthropicRes.json() as AnthropicResponse;
    const rawText = data.content?.find((c) => c.type === 'text')?.text ?? '';

    if (!rawText) {
      res.status(502).json({ error: 'No response from conversion service. Please try again.' });
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(rawText));
    } catch {
      console.error('JSON parse failed. Raw text:', rawText);
      res.status(502).json({ error: 'Something went wrong with the conversion. Please try again.' });
      return;
    }

    res.json(parsed);
  } catch (err) {
    console.error('Proxy server error:', err);
    res.status(500).json({ error: 'Server error. Please try again in a moment.' });
  }
});

// ─── Stripe Payments ─────────────────────────────────────────────────────────

interface CheckoutSessionBody {
  plan: 'basic' | 'pro';
  successUrl: string;
  cancelUrl: string;
}

// Creates a Stripe Checkout session and returns the hosted payment URL.
// The app opens this URL in the device browser. When payment completes,
// Stripe redirects to successUrl which deep-links back into the app.
app.post('/create-checkout-session', requireAppToken, async (req: Request, res: Response): Promise<void> => {
  if (!stripe) {
    res.status(503).json({ error: 'Payment system not configured. Contact support.' });
    return;
  }

  const body = req.body as CheckoutSessionBody;

  if (!body.plan || !['basic', 'pro'].includes(body.plan)) {
    res.status(400).json({ error: 'plan must be "basic" or "pro".' });
    return;
  }
  if (!body.successUrl || !body.cancelUrl) {
    res.status(400).json({ error: 'successUrl and cancelUrl are required.' });
    return;
  }

  const priceId = body.plan === 'basic' ? STRIPE_PRICE_BASIC_MONTHLY : STRIPE_PRICE_PRO_MONTHLY;
  if (!priceId) {
    console.error(`Missing price ID for plan: ${body.plan}`);
    res.status(503).json({ error: 'This plan is not yet available. Please try again later.' });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      customer_creation: 'always',
      allow_promotion_codes: true,
      metadata: { plan: body.plan },
    });

    if (!session.url) {
      res.status(502).json({ error: 'Could not generate checkout link. Please try again.' });
      return;
    }

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe create-checkout-session error:', err);
    res.status(500).json({ error: 'Could not start checkout. Please try again.' });
  }
});

interface VerifySessionBody {
  sessionId: string;
}

// Verifies a completed checkout session and returns the plan and email.
// Called by the app immediately after the Stripe success deep link fires.
app.post('/verify-session', requireAppToken, async (req: Request, res: Response): Promise<void> => {
  if (!stripe) {
    res.status(503).json({ error: 'Payment system not configured.' });
    return;
  }

  const body = req.body as VerifySessionBody;
  if (!body.sessionId || typeof body.sessionId !== 'string') {
    res.status(400).json({ error: 'sessionId is required.' });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(body.sessionId, {
      expand: ['customer'],
    });

    const paid = session.payment_status === 'paid';
    const plan = (session.metadata?.plan ?? null) as 'basic' | 'pro' | null;
    const email =
      session.customer_email ??
      session.customer_details?.email ??
      null;

    res.json({ paid, plan, email });
  } catch (err) {
    console.error('Stripe verify-session error:', err);
    res.status(500).json({ error: 'Could not verify payment. Please try again.' });
  }
});

interface RestoreSubscriptionBody {
  email: string;
}

// Looks up an active Stripe subscription by customer email.
// Used by the "Restore Purchase" flow when users reinstall the app.
app.post('/restore-subscription', requireAppToken, async (req: Request, res: Response): Promise<void> => {
  if (!stripe) {
    res.status(503).json({ error: 'Payment system not configured.' });
    return;
  }

  const body = req.body as RestoreSubscriptionBody;
  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    res.status(400).json({ error: 'A valid email address is required.' });
    return;
  }

  try {
    const customers = await stripe.customers.list({ email: body.email.trim().toLowerCase(), limit: 5 });

    if (customers.data.length === 0) {
      res.json({ found: false, plan: null });
      return;
    }

    // Check subscriptions for each matching customer — take the highest active plan found
    let bestPlan: 'basic' | 'pro' | null = null;

    outer: for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 10,
      });

      for (const sub of subs.data) {
        const subPlan = sub.metadata?.['plan'] as string | undefined;
        if (subPlan === 'pro') {
          bestPlan = 'pro';
          break outer;
        }
        if (subPlan === 'basic') {
          bestPlan = 'basic';
        }
      }
    }

    res.json({ found: bestPlan !== null, plan: bestPlan });
  } catch (err) {
    console.error('Stripe restore-subscription error:', err);
    res.status(500).json({ error: 'Could not look up your subscription. Please try again.' });
  }
});

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'plate-rotate-proxy',
    node: process.version,
    cwd: process.cwd(),
    config: {
      hasApiKey: !!ANTHROPIC_API_KEY,
      hasAppToken: !!APP_TOKEN,
      hasStripeKey: !!STRIPE_SECRET_KEY,
      hasStripePrices: !!(STRIPE_PRICE_BASIC_MONTHLY && STRIPE_PRICE_PRO_MONTHLY),
      port: PORT,
    },
  });
});

app.listen(PORT, () => {
  console.log(`[ready] PlateRotate proxy listening on port ${PORT}`);
});
