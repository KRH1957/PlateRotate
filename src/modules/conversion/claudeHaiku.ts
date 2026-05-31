import { ConversionModule, ConversionInput, ConversionApiResponse } from './index';
import { ConversionResult } from '../../types';

// Points to the proxy server — never to Anthropic directly.
// The Anthropic API key lives on the server. It is not in this app.
const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL;
const APP_TOKEN = process.env.EXPO_PUBLIC_APP_TOKEN;

export const claudeHaikuConversion: ConversionModule = {
  async convertMeal(input: ConversionInput): Promise<ConversionResult> {
    if (!PROXY_URL) {
      throw new Error('Proxy URL not configured. Add EXPO_PUBLIC_PROXY_URL to .env.');
    }

    const response = await fetch(`${PROXY_URL}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APP_TOKEN ?? ''}`,
      },
      body: JSON.stringify({
        originalMeal: input.originalMeal,
        dietId: input.dietId,
        dietLabel: input.dietLabel,
        allergens: input.allergens,
        allergenLabels: input.allergenLabels,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Conversion failed. Please try again.';
      try {
        const errBody = await response.json() as { error?: string };
        if (errBody.error) errorMessage = errBody.error;
      } catch {
        // If the error body isn't JSON, use the default message above
      }
      if (response.status === 429) throw new Error('Too many requests. Wait a moment and try again.');
      throw new Error(errorMessage);
    }

    const parsed = await response.json() as ConversionApiResponse;

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
