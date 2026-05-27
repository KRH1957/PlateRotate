import { DietId, AllergenId, ConversionResult } from '../../types';

export interface ConversionInput {
  originalMeal: string;
  dietId: DietId;
  dietLabel: string;
  allergens: AllergenId[];
  allergenLabels: string[];
}

// The raw JSON shape Claude Haiku returns inside its response
export interface ConversionApiResponse {
  convertedMealName: string;
  ingredients: string[];
  instructions: string[];
  notes: string;
}

export interface ConversionModule {
  convertMeal(input: ConversionInput): Promise<ConversionResult>;
}
