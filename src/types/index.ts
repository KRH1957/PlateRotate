// Diet IDs used throughout the app
export type DietId =
  | 'ketogenic'
  | 'carnivore'
  | 'glp1_friendly'
  | 'mediterranean'
  | 'paleo'
  | 'anti_inflammatory';

// Allergen IDs used throughout the app
export type AllergenId = 'nuts' | 'dairy' | 'gluten' | 'shellfish' | 'eggs' | 'soy';

export interface Diet {
  id: DietId;
  label: string;
  description: string;
  emoji: string;
}

export interface Allergen {
  id: AllergenId;
  label: string;
  emoji: string;
}

export interface UserSettings {
  onboardingComplete: boolean;
  dietId: DietId | null;
  allergens: AllergenId[];
}

// The result of a single meal conversion (returned by Claude Haiku — used later)
export interface ConversionResult {
  originalMeal: string;
  convertedMeal: string;
  ingredients: string[];
  instructions: string[];
  notes: string;
  dietId: DietId;
  allergensFlagged: AllergenId[];
}

// A saved favorite entry
export interface Favorite {
  id: number;
  originalMeal: string;
  convertedMeal: string; // JSON string of ConversionResult
  dietId: DietId;
  createdAt: number; // Unix timestamp
}

// A conversion history entry
export interface HistoryEntry {
  id: number;
  originalMeal: string;
  convertedMeal: string; // JSON string of ConversionResult
  dietId: DietId;
  createdAt: number;
}

// A 7-day meal plan (Pro tier — used later)
export interface MealPlan {
  id: number;
  planData: string; // JSON string of the plan
  dietId: DietId;
  createdAt: number;
}

// Usage counter for free tier enforcement
export interface UsageStats {
  freeConversionsUsed: number; // Max 5 on free tier
}

// Tier levels
export type Tier = 'free' | 'basic' | 'pro';
