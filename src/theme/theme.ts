import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
    // Primary - Emerald Green (Modern POS feel)
    primary: {
        50: '#ECFDF5',
        100: '#D1FAE5',
        200: '#A7F3D0',
        300: '#6EE7B7',
        400: '#34D399',
        500: '#10B981', // Main primary
        600: '#059669',
        700: '#047857',
        800: '#065F46',
        900: '#064E3B',
    },

    // Accent - Sky Blue
    accent: {
        50: '#F0F9FF',
        100: '#E0F2FE',
        200: '#BAE6FD',
        300: '#7DD3FC',
        400: '#38BDF8',
        500: '#0EA5E9', // Main accent
        600: '#0284C7',
        700: '#0369A1',
        800: '#075985',
        900: '#0C4A6E',
    },

    // Neutral - Slate
    neutral: {
        50: '#F8FAFC',
        100: '#F1F5F9',
        200: '#E2E8F0',
        300: '#CBD5E1',
        400: '#94A3B8',
        500: '#64748B',
        600: '#475569',
        700: '#334155',
        800: '#1E293B',
        900: '#0F172A',
    },

    // Semantic
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Base
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
};

// ============================================================================
// THEME DEFINITIONS
// ============================================================================

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
    // Backgrounds
    background: string;
    backgroundSecondary: string;
    surface: string;
    surfaceHover: string;

    // Text
    text: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;

    // Primary
    primary: string;
    primaryLight: string;
    primaryDark: string;

    // Accent
    accent: string;
    accentLight: string;

    // Borders
    border: string;
    borderLight: string;

    // Semantic
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    error: string;
    errorLight: string;

    // Components
    cardBackground: string;
    inputBackground: string;
    inputBorder: string;
    modalOverlay: string;
    tabBar: string;
    fabBackground: string;
}

export const lightTheme: ThemeColors = {
    // Backgrounds
    background: colors.neutral[50],
    backgroundSecondary: colors.neutral[100],
    surface: colors.white,
    surfaceHover: colors.neutral[100],

    // Text
    text: colors.neutral[900],
    textSecondary: colors.neutral[600],
    textMuted: colors.neutral[400],
    textInverse: colors.white,

    // Primary
    primary: colors.primary[500],
    primaryLight: colors.primary[100],
    primaryDark: colors.primary[700],

    // Accent
    accent: colors.accent[500],
    accentLight: colors.accent[100],

    // Borders
    border: colors.neutral[200],
    borderLight: colors.neutral[100],

    // Semantic
    success: colors.success,
    successLight: '#D1FAE5',
    warning: colors.warning,
    warningLight: '#FEF3C7',
    error: colors.error,
    errorLight: '#FEE2E2',

    // Components
    cardBackground: colors.white,
    inputBackground: colors.neutral[50],
    inputBorder: colors.neutral[200],
    modalOverlay: 'rgba(15, 23, 42, 0.5)',
    tabBar: colors.white,
    fabBackground: colors.primary[500],
};

export const darkTheme: ThemeColors = {
    // Backgrounds
    background: colors.neutral[900],
    backgroundSecondary: colors.neutral[800],
    surface: colors.neutral[800],
    surfaceHover: colors.neutral[700],

    // Text
    text: colors.neutral[50],
    textSecondary: colors.neutral[300],
    textMuted: colors.neutral[500],
    textInverse: colors.neutral[900],

    // Primary
    primary: colors.primary[400],
    primaryLight: colors.primary[900],
    primaryDark: colors.primary[300],

    // Accent
    accent: colors.accent[400],
    accentLight: colors.accent[900],

    // Borders
    border: colors.neutral[700],
    borderLight: colors.neutral[800],

    // Semantic
    success: colors.primary[400],
    successLight: colors.primary[900],
    warning: '#FBBF24',
    warningLight: '#78350F',
    error: '#F87171',
    errorLight: '#7F1D1D',

    // Components
    cardBackground: colors.neutral[800],
    inputBackground: colors.neutral[700],
    inputBorder: colors.neutral[600],
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    tabBar: colors.neutral[900],
    fabBackground: colors.primary[500],
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
    // Font sizes
    fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        '2xl': 20,
        '3xl': 24,
        '4xl': 32,
        '5xl': 40,
    },

    // Font weights
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    // Line heights
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
};

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
};

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
};

// Dark mode shadows (subtle glow effect)
export const darkShadows = {
    sm: {
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    xl: {
        shadowColor: colors.primary[400],
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
};

// ============================================================================
// DIMENSIONS
// ============================================================================

export const dimensions = {
    screenWidth: width,
    screenHeight: height,
    touchTarget: 48, // Minimum touch target (Android guideline)
    headerHeight: 56,
    tabBarHeight: 60,
    fabSize: 56,
    inputHeight: 48,
    buttonHeight: 48,
};

// ============================================================================
// ANIMATIONS
// ============================================================================

export const animations = {
    fast: 150,
    normal: 250,
    slow: 400,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getTheme = (mode: ThemeMode): ThemeColors => {
    return mode === 'dark' ? darkTheme : lightTheme;
};

export const getShadow = (mode: ThemeMode, size: keyof typeof shadows) => {
    return mode === 'dark' ? darkShadows[size] : shadows[size];
};
