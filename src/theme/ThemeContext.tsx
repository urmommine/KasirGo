import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, getTheme, lightTheme, ThemeColors, ThemeMode } from './theme';

// ============================================================================
// TYPES
// ============================================================================

interface ThemeContextType {
    mode: ThemeMode;
    colors: ThemeColors;
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@kasirgo_theme';

// ============================================================================
// PROVIDER
// ============================================================================

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [mode, setMode] = useState<ThemeMode>('light');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved theme preference
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedTheme === 'light' || savedTheme === 'dark') {
                    setMode(savedTheme);
                } else if (systemColorScheme) {
                    setMode(systemColorScheme);
                }
            } catch (error) {
                console.error('Failed to load theme preference:', error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadTheme();
    }, [systemColorScheme]);

    // Save theme preference
    const saveTheme = useCallback(async (newMode: ThemeMode) => {
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    }, []);

    const toggleTheme = useCallback(() => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        saveTheme(newMode);
    }, [mode, saveTheme]);

    const setTheme = useCallback((newMode: ThemeMode) => {
        setMode(newMode);
        saveTheme(newMode);
    }, [saveTheme]);

    const value = useMemo(
        () => ({
            mode,
            colors: getTheme(mode),
            isDark: mode === 'dark',
            toggleTheme,
            setTheme,
        }),
        [mode, toggleTheme, setTheme]
    );

    // Don't render until theme is loaded to prevent flash
    if (!isLoaded) {
        return null;
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// ============================================================================
// HOOK
// ============================================================================

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// ============================================================================
// EXPORTS
// ============================================================================

export { darkTheme, lightTheme };
export type { ThemeColors, ThemeMode };

