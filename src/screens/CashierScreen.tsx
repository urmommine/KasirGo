import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db from '../database/db';
import { Product, useCartStore } from '../store/cartStore';
import { borderRadius, getShadow, spacing, typography, useTheme } from '../theme';

const ProductCard = React.memo(({
    item,
    onAdd,
    colors,
    mode
}: {
    item: Product;
    onAdd: (product: Product) => void;
    colors: any;
    mode: 'light' | 'dark';
}) => {
    const isOutOfStock = item.use_stock === 1 && item.stock <= 0;

    return (
        <TouchableOpacity
            style={[
                styles.card,
                { backgroundColor: colors.cardBackground },
                getShadow(mode, 'sm'),
                isOutOfStock && styles.cardDisabled,
            ]}
            onPress={() => !isOutOfStock && onAdd(item)}
            activeOpacity={0.7}
            disabled={isOutOfStock}
        >
            <View style={[styles.imageContainer, { backgroundColor: colors.primaryLight }]}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" />
                ) : (
                    <Text style={[styles.iconText, { color: colors.primary }]}>
                        {item.name.charAt(0).toUpperCase()}
                    </Text>
                )}
                {isOutOfStock && (
                    <View style={styles.outOfStockOverlay}>
                        <Text style={styles.outOfStockText}>Habis</Text>
                    </View>
                )}
            </View>
            <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
                    {item.name}
                </Text>
                <Text style={[styles.price, { color: colors.success }]}>
                    Rp {item.price.toLocaleString('id-ID')}
                </Text>
                <Text style={[
                    styles.stock,
                    { color: isOutOfStock ? colors.error : colors.textMuted }
                ]}>
                    Stok: {item.use_stock === 1 ? item.stock : '∞'}
                </Text>
            </View>
            {!isOutOfStock && (
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.primary }]}
                    onPress={() => onAdd(item)}
                >
                    <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
});

export default function CashierScreen() {
    const router = useRouter();
    const { colors, mode } = useTheme();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const addToCart = useCartStore(state => state.addToCart);
    const cartItems = useCartStore(state => state.items);
    const cartItemCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
    const cartTotal = useCartStore(state => state.getTotal());

    const loadData = useCallback(() => {
        try {
            const pResult = db.getAllSync<Product>('SELECT * FROM products ORDER BY name ASC');
            setProducts(pResult);

            const cResult = db.getAllSync<{ id: number; name: string }>('SELECT * FROM categories ORDER BY name ASC');
            setCategories(cResult);

            filterProducts(pResult, search, selectedCategory);
        } catch (e) {
            console.error(e);
        }
    }, [search, selectedCategory]);

    const filterProducts = (allProducts: Product[], query: string, categoryId: number | null) => {
        let filtered = allProducts;

        if (categoryId !== null) {
            filtered = filtered.filter(p => p.category_id === categoryId);
        }

        if (query) {
            const lower = query.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                (p.sku && p.sku.toLowerCase().includes(lower)) ||
                ((p as any).barcode && (p as any).barcode.toLowerCase().includes(lower))
            );
        }

        setFilteredProducts(filtered);
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterProducts(products, search, selectedCategory);
    }, [search, selectedCategory, products]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
        setRefreshing(false);
    }, [loadData]);

    const handleAddToCart = useCallback((product: Product) => {
        addToCart(product);
    }, [addToCart]);

    const renderItem = useCallback(({ item }: { item: Product }) => (
        <ProductCard item={item} onAdd={handleAddToCart} colors={colors} mode={mode} />
    ), [handleAddToCart, colors, mode]);

    const keyExtractor = useCallback((item: Product) => item.id.toString(), []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Kasir',
                    headerRight: () => (
                        <TouchableOpacity onPress={() => router.push('/products')}>
                            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    ),
                }}
            />

            {/* Search Bar */}
            <View style={[
                styles.searchContainer,
                { backgroundColor: colors.cardBackground },
                getShadow(mode, 'sm'),
            ]}>
                <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Cari nama, SKU, atau barcode..."
                    placeholderTextColor={colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
                <TouchableOpacity
                    style={[styles.scanBtn, { backgroundColor: colors.primaryLight }]}
                    onPress={() => router.push('/scanner')}
                >
                    <Ionicons name="barcode-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Categories */}
            <View style={styles.categoriesWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
                    <TouchableOpacity
                        style={[
                            styles.categoryChip,
                            { backgroundColor: selectedCategory === null ? colors.primary : colors.cardBackground },
                            getShadow(mode, 'sm'),
                        ]}
                        onPress={() => setSelectedCategory(null)}
                    >
                        <Text style={[styles.categoryText, { color: selectedCategory === null ? '#fff' : colors.textSecondary }]}>
                            Semua
                        </Text>
                    </TouchableOpacity>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryChip,
                                { backgroundColor: selectedCategory === cat.id ? colors.primary : colors.cardBackground },
                                getShadow(mode, 'sm'),
                            ]}
                            onPress={() => setSelectedCategory(cat.id)}
                        >
                            <Text style={[styles.categoryText, { color: selectedCategory === cat.id ? '#fff' : colors.textSecondary }]}>
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Product Grid */}
            <FlatList
                data={filteredProducts}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                numColumns={2}
                columnWrapperStyle={{ gap: spacing.md }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            />

            {/* Cart Bar */}
            {cartItemCount > 0 && (
                <View style={styles.cartBarContainer}>
                    <TouchableOpacity
                        style={[
                            styles.cartBar,
                            { backgroundColor: colors.text },
                            getShadow(mode, 'xl'),
                        ]}
                        onPress={() => router.push('/cart')}
                    >
                        <View style={styles.cartInfo}>
                            <View style={[styles.badge, { backgroundColor: colors.error }]}>
                                <Text style={styles.badgeText}>{cartItemCount}</Text>
                            </View>
                            <Text style={[styles.totalText, { color: colors.textInverse }]}>
                                Rp {cartTotal.toLocaleString('id-ID')}
                            </Text>
                        </View>
                        <View style={styles.checkoutBtn}>
                            <Text style={[styles.checkoutText, { color: colors.textInverse }]}>
                                Checkout
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: spacing.lg,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.xl,
        height: 52,
    },
    searchIcon: { marginRight: spacing.sm },
    searchInput: {
        flex: 1,
        fontSize: typography.fontSize.md,
    },
    scanBtn: {
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginLeft: spacing.sm,
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: spacing.lg,
        paddingTop: 0,
        paddingBottom: 120,
    },
    card: {
        flex: 1,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginBottom: spacing.md,
        minWidth: '45%',
        overflow: 'hidden',
    },
    cardDisabled: { opacity: 0.7 },
    imageContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
        overflow: 'hidden',
    },
    image: { width: '100%', height: '100%' },
    outOfStockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outOfStockText: { color: '#fff', fontWeight: 'bold' },
    iconText: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
    },
    info: { width: '100%' },
    name: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        height: 36,
        marginBottom: spacing.xs,
    },
    price: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
    },
    stock: {
        fontSize: typography.fontSize.xs,
        marginTop: spacing.xs,
    },
    categoriesWrapper: { marginBottom: spacing.md },
    categoriesContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
    categoryChip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    categoryText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
    addBtn: {
        position: 'absolute',
        right: 4,
        bottom: 4,
        borderRadius: borderRadius.md,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBarContainer: {
        position: 'absolute',
        bottom: spacing['2xl'],
        left: spacing.lg,
        right: spacing.lg,
    },
    cartBar: {
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cartInfo: { flexDirection: 'row', alignItems: 'center' },
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        marginRight: spacing.md,
    },
    badgeText: {
        color: '#fff',
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
    },
    totalText: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    checkoutBtn: { flexDirection: 'row', alignItems: 'center' },
    checkoutText: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        marginRight: spacing.xs,
    },
});
