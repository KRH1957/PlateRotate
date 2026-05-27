import { ConversionModule, ConversionInput, ConversionApiResponse } from './index';
import { ConversionResult } from '../../types';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

// Strips markdown code fences Claude sometimes wraps JSON in
function extractJson(raw: string): string {
  return raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
}

function buildPrompt(input: ConversionInput): string {
  const allergenLine =
    input.allergens.length > 0
      ? `ALLERGEN RESTRICTIONS — you MUST exclude ALL of these from the converted recipe: ${input.allergenLabels.join(', ')}.`
      : 'No allergen restrictions.';

  return `You are a meal conversion expert. Convert the meal below to the ${input.dietLabel} diet.

Meal to convert: ${input.originalMeal}
Target diet: ${input.dietLabel}
${allergenLine}

Return ONLY a valid JSON object — no markdown, no explanation, no extra text. Use exactly this structure:
{
  "convertedMealName": "The name of the converted meal",
  "ingredients": ["ingredient with quantity 1", "ingredient with quantity 2"],
  "instructions": ["Step 1: ...", "Step 2: ..."],
  "notes": "Brief note on key substitutions or tips for this diet"
}`;
}

export const claudeHaikuConversion: ConversionModule = {
  async convertMeal(input: ConversionInput): Promise<ConversionResult> {
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
      throw new Error('API key not configured. Add your Anthropic API key to .env.');
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: buildPrompt(input) }],
      }),
    });

    if (!response.ok) {
      // Map common HTTP errors to messages Kevin can understand
      if (response.status === 401) throw new Error('Invalid API key. Check your .env file.');
      if (response.status === 429) throw new Error('Too many requests. Wait a moment and try again.');
      if (response.status >= 500) throw new Error('Anthropic service is temporarily unavailable. Try again in a minute.');
      throw new Error(`Conversion failed (error ${response.status}). Please try again.`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };

    const rawText = data.content?.find((c) => c.type === 'text')?.text ?? '';
    if (!rawText) throw new Error('No response from conversion service. Please try again.');

    let parsed: ConversionApiResponse;
    try {
      parsed = JSON.parse(extractJson(rawText)) as ConversionApiResponse;
    } catch {
      throw new Error('Something went wrong with the conversion. Please try again.');
    }

    if (!parsed.convertedMealName || !Array.isArray(parsed.ingredients) || !Array.isArray(parsed.instructions)) {
      throw new Error('Conversion returned unexpected data. Please try again.');
    }

    return {
      originalMeal: input.originalMeal,
      convertedMeal: parsed.convertedMealName,
      ingredients: parsed.ingredients,
      instructions: parsed.instructions,
      notes: parsed.notes ?? '',
      dietId: input.dietId,
      allergensFlagged: input.allergens,
    };
  },
};
