// Re-export everything from ThemeContext for cleaner imports
export { ThemeProvider, darkTheme, lightTheme, useTheme } from './ThemeContext';
export type { ThemeColors, ThemeMode } from './ThemeContext';

// Export theme utilities
export {
    animations, borderRadius, colors, darkShadows,
    dimensions, getShadow, getTheme, shadows, spacing, typography
} from './theme';

