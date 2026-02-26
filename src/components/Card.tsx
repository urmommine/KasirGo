import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { borderRadius, getShadow, spacing } from '../theme/theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: keyof typeof spacing;
    selected?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    variant = 'default',
    padding = 'lg',
    selected = false,
}) => {
    const { colors, mode, isDark } = useTheme();

    const getVariantStyle = (): ViewStyle => {
        switch (variant) {
            case 'elevated':
                return {
                    ...getShadow(mode, 'lg'),
                };
            case 'outlined':
                return {
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                };
            default:
                return {
                    ...getShadow(mode, 'sm'),
                };
        }
    };

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.cardBackground,
                    padding: spacing[padding],
                },
                getVariantStyle(),
                selected && {
                    borderWidth: 2,
                    borderColor: colors.primary,
                    backgroundColor: isDark ? colors.primaryLight : colors.primaryLight,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: borderRadius.xl,
    },
});
