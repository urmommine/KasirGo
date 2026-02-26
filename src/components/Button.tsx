import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextStyle,
    ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';
import { borderRadius, dimensions, spacing, typography } from '../theme/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    style,
}) => {
    const { colors, isDark } = useTheme();

    const getBackgroundColor = (pressed: boolean): string => {
        if (disabled) return colors.border;

        switch (variant) {
            case 'primary':
                return pressed ? colors.primaryDark : colors.primary;
            case 'secondary':
                return pressed ? colors.surfaceHover : colors.surface;
            case 'outline':
            case 'ghost':
                return pressed ? colors.surfaceHover : 'transparent';
            case 'danger':
                return pressed ? '#DC2626' : colors.error;
            default:
                return colors.primary;
        }
    };

    const getTextColor = (): string => {
        if (disabled) return colors.textMuted;

        switch (variant) {
            case 'primary':
            case 'danger':
                return colors.textInverse;
            case 'secondary':
                return colors.text;
            case 'outline':
                return colors.primary;
            case 'ghost':
                return colors.text;
            default:
                return colors.textInverse;
        }
    };

    const getSizeStyle = (): { container: ViewStyle; text: TextStyle; iconSize: number } => {
        switch (size) {
            case 'sm':
                return {
                    container: {
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                        minHeight: 36,
                    },
                    text: { fontSize: typography.fontSize.sm },
                    iconSize: 16,
                };
            case 'lg':
                return {
                    container: {
                        paddingVertical: spacing.lg,
                        paddingHorizontal: spacing.xl,
                        minHeight: dimensions.buttonHeight + 8,
                    },
                    text: { fontSize: typography.fontSize.lg },
                    iconSize: 24,
                };
            default:
                return {
                    container: {
                        paddingVertical: spacing.md,
                        paddingHorizontal: spacing.lg,
                        minHeight: dimensions.buttonHeight,
                    },
                    text: { fontSize: typography.fontSize.md },
                    iconSize: 20,
                };
        }
    };

    const sizeStyle = getSizeStyle();
    const textColor = getTextColor();

    const renderContent = () => {
        if (loading) {
            return <ActivityIndicator color={textColor} />;
        }

        const iconComponent = icon && (
            <Ionicons
                name={icon}
                size={sizeStyle.iconSize}
                color={textColor}
                style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
            />
        );

        return (
            <>
                {iconPosition === 'left' && iconComponent}
                <Text
                    style={[
                        styles.text,
                        sizeStyle.text,
                        { color: textColor },
                    ]}
                >
                    {title}
                </Text>
                {iconPosition === 'right' && iconComponent}
            </>
        );
    };

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                styles.button,
                sizeStyle.container,
                {
                    backgroundColor: getBackgroundColor(pressed),
                    borderColor: variant === 'outline' ? colors.primary : 'transparent',
                    borderWidth: variant === 'outline' ? 1.5 : 0,
                    opacity: pressed && !disabled ? 0.9 : 1,
                },
                fullWidth && styles.fullWidth,
                style,
            ]}
        >
            {renderContent()}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.lg,
    },
    fullWidth: {
        width: '100%',
    },
    text: {
        fontWeight: typography.fontWeight.semibold,
    },
    iconLeft: {
        marginRight: spacing.sm,
    },
    iconRight: {
        marginLeft: spacing.sm,
    },
});
