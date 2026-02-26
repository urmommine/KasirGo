import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken,
} from 'react-native';
import { useTheme } from '../theme';
import { borderRadius, spacing, typography } from '../theme/theme';

const { width } = Dimensions.get('window');

const ONBOARDING_COMPLETE_KEY = '@kasirgo_onboarding_complete';

interface OnboardingSlide {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    title: string;
    description: string;
}

const slides: OnboardingSlide[] = [
    {
        id: '1',
        icon: 'storefront',
        iconColor: '#10B981',
        title: 'Selamat Datang di KasirGo',
        description: 'Aplikasi kasir offline-first yang simpel dan cepat untuk UMKM Indonesia.',
    },
    {
        id: '2',
        icon: 'barcode-outline',
        iconColor: '#0EA5E9',
        title: 'Kelola Produk dengan Mudah',
        description: 'Scan barcode, atur stok, dan kelola harga produk dalam satu aplikasi.',
    },
    {
        id: '3',
        icon: 'bar-chart',
        iconColor: '#8B5CF6',
        title: 'Pantau Penjualan Harian',
        description: 'Lihat laporan penjualan, histori transaksi, dan ekspor data kapan saja.',
    },
];

export const OnboardingScreen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;

    const viewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index !== null) {
                setCurrentIndex(viewableItems[0].index);
            }
        }
    ).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
            // Call callback if provided (when rendered directly in layout)
            if (onComplete) {
                onComplete();
            } else {
                router.replace('/' as any);
            }
        } catch (error) {
            console.error('Failed to save onboarding status:', error);
            if (onComplete) {
                onComplete();
            } else {
                router.replace('/' as any);
            }
        }
    };

    const renderSlide = ({ item }: { item: OnboardingSlide }) => (
        <View style={[styles.slide, { width }]}>
            <View
                style={[
                    styles.iconContainer,
                    {
                        backgroundColor: isDark ? colors.surface : colors.primaryLight,
                    },
                ]}
            >
                <Ionicons name={item.icon} size={80} color={item.iconColor} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
                {item.description}
            </Text>
        </View>
    );

    const renderPagination = () => (
        <View style={styles.pagination}>
            {slides.map((_, i) => {
                const inputRange = [
                    (i - 1) * width,
                    i * width,
                    (i + 1) * width,
                ];

                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [8, 24, 8],
                    extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        key={slides[i].id}
                        style={[
                            styles.dot,
                            {
                                width: dotWidth,
                                opacity,
                                backgroundColor: colors.primary,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );

    const isLastSlide = currentIndex === slides.length - 1;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Skip Button */}
            <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                activeOpacity={0.7}
            >
                <Text style={[styles.skipText, { color: colors.textMuted }]}>Lewati</Text>
            </TouchableOpacity>

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                keyExtractor={(item) => item.id}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onViewableItemsChanged={viewableItemsChanged}
                viewabilityConfig={viewConfig}
            />

            {/* Pagination */}
            {renderPagination()}

            {/* Next/Start Button */}
            <TouchableOpacity
                style={[styles.nextButton, { backgroundColor: colors.primary }]}
                onPress={handleNext}
                activeOpacity={0.8}
            >
                <Text style={[styles.nextButtonText, { color: colors.textInverse }]}>
                    {isLastSlide ? 'Mulai Sekarang' : 'Lanjut'}
                </Text>
                <Ionicons
                    name={isLastSlide ? 'checkmark' : 'arrow-forward'}
                    size={20}
                    color={colors.textInverse}
                    style={styles.nextButtonIcon}
                />
            </TouchableOpacity>
        </View>
    );
};

// Helper function to check if onboarding is complete
export const checkOnboardingComplete = async (): Promise<boolean> => {
    try {
        const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        return value === 'true';
    } catch {
        return false;
    }
};

// Helper function to reset onboarding (for testing)
export const resetOnboarding = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    } catch (error) {
        console.error('Failed to reset onboarding:', error);
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    skipButton: {
        position: 'absolute',
        top: 60,
        right: spacing.xl,
        zIndex: 10,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipText: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
    },
    slide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing['3xl'],
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing['3xl'],
    },
    title: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    description: {
        fontSize: typography.fontSize.lg,
        textAlign: 'center',
        lineHeight: 26,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing['3xl'],
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: spacing.xl,
        marginBottom: spacing['4xl'],
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.xl,
    },
    nextButtonText: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
    },
    nextButtonIcon: {
        marginLeft: spacing.sm,
    },
});
