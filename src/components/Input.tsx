import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';
import { borderRadius, dimensions, spacing, typography } from '../theme/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
    label?: string;
    error?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    ...textInputProps
}) => {
    const { colors, isDark } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const getBorderColor = () => {
        if (error) return colors.error;
        if (isFocused) return colors.primary;
        return colors.inputBorder;
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                    {label}
                </Text>
            )}
            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: colors.inputBackground,
                        borderColor: getBorderColor(),
                        borderWidth: isFocused || error ? 1.5 : 1,
                    },
                ]}
            >
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={20}
                        color={isFocused ? colors.primary : colors.textMuted}
                        style={styles.leftIcon}
                    />
                )}
                <TextInput
                    {...textInputProps}
                    style={[
                        styles.input,
                        {
                            color: colors.text,
                        },
                        leftIcon && { paddingLeft: 0 },
                        rightIcon && { paddingRight: 0 },
                    ]}
                    placeholderTextColor={colors.textMuted}
                    onFocus={(e) => {
                        setIsFocused(true);
                        textInputProps.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        textInputProps.onBlur?.(e);
                    }}
                />
                {rightIcon && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        disabled={!onRightIconPress}
                        style={styles.rightIconTouchable}
                    >
                        <Ionicons
                            name={rightIcon}
                            size={20}
                            color={isFocused ? colors.primary : colors.textMuted}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && (
                <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        marginBottom: spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: borderRadius.lg,
        minHeight: dimensions.inputHeight,
        paddingHorizontal: spacing.md,
    },
    input: {
        flex: 1,
        fontSize: typography.fontSize.lg,
        paddingVertical: spacing.md,
    },
    leftIcon: {
        marginRight: spacing.sm,
    },
    rightIconTouchable: {
        padding: spacing.sm,
        marginLeft: spacing.xs,
    },
    error: {
        fontSize: typography.fontSize.sm,
        marginTop: spacing.xs,
    },
});
