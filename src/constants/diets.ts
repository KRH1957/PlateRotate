import { Diet, Allergen } from '../types';

export const DIETS: Diet[] = [
  {
    id: 'ketogenic',
    label: 'Ketogenic',
    description: 'High fat, very low carbs',
    emoji: '🥑',
  },
  {
    id: 'carnivore',
    label: 'Carnivore',
    description: 'Animal products only',
    emoji: '🥩',
  },
  {
    id: 'glp1_friendly',
    label: 'GLP-1 Friendly',
    description: 'High protein, low sugar, easy portions',
    emoji: '🌿',
  },
  {
    id: 'mediterranean',
    label: 'Mediterranean',
    description: 'Whole foods, olive oil, fish',
    emoji: '🫒',
  },
  {
    id: 'paleo',
    label: 'Paleo',
    description: 'No grains, dairy, or processed food',
    emoji: '🍗',
  },
  {
    id: 'anti_inflammatory',
    label: 'Anti-Inflammatory',
    description: 'Reduce inflammation through food',
    emoji: '🫐',
  },
];

export const ALLERGENS: Allergen[] = [
  { id: 'nuts',      label: 'Nuts',      emoji: '🥜' },
  { id: 'dairy',     label: 'Dairy',     emoji: '🥛' },
  { id: 'gluten',    label: 'Gluten',    emoji: '🌾' },
  { id: 'shellfish', label: 'Shellfish', emoji: '🦐' },
  { id: 'eggs',      label: 'Eggs',      emoji: '🥚' },
  { id: 'soy',       label: 'Soy',       emoji: '🫘' },
];
