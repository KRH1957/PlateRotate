import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Load .env file if present — covers platforms that use file-based env config
// rather than injecting vars directly into the process environment.
dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const APP_TOKEN = process.env.APP_TOKEN;
const MODEL = 'claude-haiku-4-5-20251001';

// Log startup state — visible in xCloud's log viewer
console.log(`[startup] PlateRotate proxy starting on port ${PORT}`);
console.log(`[startup] Working directory: ${process.cwd()}`);
console.log(`[startup] Node version: ${process.version}`);
console.log(`[startup] ANTHROPIC_API_KEY set: ${!!ANTHROPIC_API_KEY}`);
console.log(`[startup] APP_TOKEN set: ${!!APP_TOKEN}`);

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

// Every request to /convert must include the app token in the Authorization header.
// This blocks random internet traffic from using the proxy as a free Anthropic gateway.
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

// The prompt template lives here on the server — not in the app binary
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

  // Basic input validation
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

// Health check — always responds so we can diagnose remotely.
// Reports whether config vars are set (true/false only — never logs the actual values).
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'plate-rotate-proxy',
    node: process.version,
    cwd: process.cwd(),
    config: {
      hasApiKey: !!ANTHROPIC_API_KEY,
      hasAppToken: !!APP_TOKEN,
      port: PORT,
    },
  });
});

app.listen(PORT, () => {
  console.log(`[ready] PlateRotate proxy listening on port ${PORT}`);
});
