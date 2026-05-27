export const Colors = {
  // Backgrounds
  background: '#FAF8F4',   // Warm white — main screen background
  surface: '#FFFFFF',      // Pure white — cards and panels
  surfaceAlt: '#F0EDE8',   // Warm gray — secondary surfaces

  // Brand greens
  primary: '#4A7C59',      // Forest green — buttons, active states, headers
  accent: '#7DAF8E',       // Sage green — icons, highlights, borders
  primaryLight: '#E8F4EC', // Very light green — selected state backgrounds

  // Text
  textPrimary: '#1A2E1A',  // Near-black with green tint — headings and body
  textSecondary: '#4A6A4A',// Medium green-gray — subtext, labels
  textMuted: '#8A9E8A',    // Muted green-gray — placeholders, hints
  textInverse: '#FFFFFF',  // White — text on dark/green backgrounds

  // Borders and dividers
  border: '#DDE8DD',       // Light green-tinted — card borders, dividers
  borderStrong: '#B8CCB8', // Stronger border — focused inputs

  // Semantic
  error: '#C0392B',
  errorLight: '#FDECEA',
  success: '#4A7C59',      // Same as primary — intentional
  warning: '#D4860A',
  warningLight: '#FEF3E2',

  // Tab bar
  tabActive: '#4A7C59',
  tabInactive: '#8A9E8A',
  tabBackground: '#FFFFFF',
};

export const Typography = {
  // Font sizes (minimum 16pt body per STANDARDS.md)
  xs: 12,
  sm: 14,
  body: 16,
  md: 18,
  lg: 20,   // Minimum for primary actions
  xl: 24,
  xxl: 30,
  hero: 36,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// Minimum tap target: 48x48 per STANDARDS.md
export const TAP_TARGET = 48;
