import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, Vibration, View } from 'react-native';
import db from '../database/db';
import { borderRadius, getShadow, spacing, typography, useTheme } from '../theme';
import { useBeepSound } from '../utils/beepSound';

interface Product {
    id: number;
    name: string;
    price: number;
    cost_price: number;
    stock: number;
    use_stock: number;
    sku?: string;
    barcode?: string;
    image?: string;
    category_id?: number;
    category_name?: string;
}

export default function ProductScreen() {
    const { colors, mode } = useTheme();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Selection Mode State
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Form State
    const [formName, setFormName] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formCostPrice, setFormCostPrice] = useState('');
    const [formStock, setFormStock] = useState('');
    const [formUseStock, setFormUseStock] = useState(true);
    const [formSku, setFormSku] = useState('');
    const [formBarcode, setFormBarcode] = useState('');
    const [formImage, setFormImage] = useState<string | null>(null);
    const [formCategory, setFormCategory] = useState<number | null>(null);

    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [scannerVisible, setScannerVisible] = useState(false);
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const { playBeep } = useBeepSound();

    const fetchCategories = useCallback(() => {
        try {
            const result = db.getAllSync<{ id: number; name: string }>('SELECT id, name FROM categories ORDER BY name ASC');
            setCategories(result);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const fetchProducts = useCallback(() => {
        try {
            const result = db.getAllSync<Product>(`
                SELECT p.*, c.name as category_name 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id 
                ORDER BY p.id DESC
            `);
            setProducts(result);
            setFilteredProducts(result);
        } catch (e) {
            console.error(e);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchProducts();
            fetchCategories();
        }, [fetchProducts, fetchCategories])
    );

    useEffect(() => {
        if (search) {
            const lower = search.toLowerCase();
            setFilteredProducts(products.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                (p.sku && p.sku.toLowerCase().includes(lower)) ||
                (p.barcode && p.barcode.toLowerCase().includes(lower))
            ));
        } else {
            setFilteredProducts(products);
        }
    }, [search, products]);

    const handleSave = () => {
        if (!formName || !formPrice || (formUseStock && !formStock)) {
            Alert.alert('Error', 'Nama, Harga, dan Stok (jika diaktifkan) wajib diisi!');
            return;
        }

        try {
            if (editingProduct) {
                db.runSync(
                    'UPDATE products SET name = ?, price = ?, cost_price = ?, stock = ?, use_stock = ?, sku = ?, barcode = ?, image = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [
                        formName,
                        parseInt(formPrice),
                        parseInt(formCostPrice || '0'),
                        parseInt(formStock || '0'),
                        formUseStock ? 1 : 0,
                        formSku,
                        formBarcode || null,
                        formImage,
                        formCategory,
                        editingProduct.id
                    ]
                );
            } else {
                db.runSync(
                    'INSERT INTO products (name, price, cost_price, stock, use_stock, sku, barcode, image, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        formName,
                        parseInt(formPrice),
                        parseInt(formCostPrice || '0'),
                        parseInt(formStock || '0'),
                        formUseStock ? 1 : 0,
                        formSku,
                        formBarcode || null,
                        formImage,
                        formCategory
                    ]
                );
            }
            fetchProducts();
            closeModal();
        } catch (e) {
            Alert.alert('Error', 'Gagal menyimpan produk');
            console.error(e);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setFormImage(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Izin Kamera', 'Izin kamera diperlukan untuk mengambil foto.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setFormImage(result.assets[0].uri);
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert('Hapus Produk', 'Yakin ingin menghapus produk ini?', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus',
                style: 'destructive',
                onPress: () => {
                    db.runSync('DELETE FROM products WHERE id = ?', [id]);
                    fetchProducts();
                }
            }
        ]);
    };

    const openModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormName(product.name);
            setFormPrice(product.price.toString());
            setFormCostPrice(product.cost_price?.toString() || '');
            setFormStock(product.stock.toString());
            setFormUseStock(product.use_stock === 1);
            setFormSku(product.sku || '');
            setFormBarcode(product.barcode || '');
            setFormImage(product.image || null);
            setFormCategory(product.category_id || null);
        } else {
            setEditingProduct(null);
            setFormName('');
            setFormPrice('');
            setFormCostPrice('');
            setFormStock('');
            setFormUseStock(true);
            setFormSku('');
            setFormBarcode('');
            setFormImage(null);
            setFormCategory(null);
        }
        setModalVisible(true);
    };

    const handleOpenScanner = () => {
        if (!cameraPermission?.granted) {
            requestCameraPermission();
            return;
        }
        setScannerVisible(true);
    };

    const handleBarcodeScanned = (result: BarcodeScanningResult) => {
        Vibration.vibrate(100);
        playBeep();
        setFormBarcode(result.data);
        setScannerVisible(false);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingProduct(null);
    };

    // Selection Mode Handlers
    const handleLongPress = (id: number) => {
        Vibration.vibrate(50);
        setSelectionMode(true);
        setSelectedIds(new Set([id]));
    };

    const toggleSelection = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
        if (newSelected.size === 0) {
            setSelectionMode(false);
        }
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedIds(new Set());
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;
        Alert.alert(
            'Hapus Produk',
            `Yakin ingin menghapus ${selectedIds.size} produk terpilih?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: () => {
                        const ids = Array.from(selectedIds);
                        const placeholders = ids.map(() => '?').join(',');
                        db.runSync(`DELETE FROM products WHERE id IN (${placeholders})`, ids);
                        fetchProducts();
                        exitSelectionMode();
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Product }) => {
        const isSelected = selectedIds.has(item.id);
        const hasLowStock = item.use_stock === 1 && item.stock < 5;

        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    { backgroundColor: colors.cardBackground },
                    getShadow(mode, 'sm'),
                    isSelected && {
                        borderWidth: 2,
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryLight,
                    },
                ]}
                onPress={() => selectionMode ? toggleSelection(item.id) : openModal(item)}
                onLongPress={() => handleLongPress(item.id)}
                activeOpacity={0.7}
            >
                {selectionMode && (
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => toggleSelection(item.id)}
                    >
                        <Ionicons
                            name={isSelected ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={isSelected ? colors.primary : colors.textMuted}
                        />
                    </TouchableOpacity>
                )}

                <View style={[styles.productImageContainer, { backgroundColor: colors.background }]}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.productImage} contentFit="cover" />
                    ) : (
                        <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                    )}
                </View>

                <View style={styles.cardInfo}>
                    <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.row}>
                        <Text style={[styles.productSku, { color: colors.textMuted, marginRight: spacing.md }]}>
                            {item.category_name || 'Tanpa Kategori'}
                        </Text>
                        <Text style={[styles.productSku, { color: colors.textMuted }]}>SKU: {item.sku || '-'}</Text>
                    </View>
                    <Text style={[styles.productPrice, { color: colors.primary }]}>
                        Rp {item.price.toLocaleString('id-ID')}
                        <Text style={[styles.costPrice, { color: colors.textMuted }]}> (Modal: Rp {item.cost_price?.toLocaleString('id-ID') || 0})</Text>
                    </Text>
                    <Text style={[styles.productStock, { color: hasLowStock ? colors.error : colors.success }]}>
                        Stok: {item.use_stock === 1 ? item.stock : 'Unlimited'}
                    </Text>
                </View>
                {!selectionMode && (
                    <View style={styles.cardActions}>
                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                            <Ionicons name="trash-outline" size={22} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: 'Kelola Produk' }} />

            {/* Search */}
            <View style={[
                styles.searchContainer,
                { backgroundColor: colors.cardBackground },
                getShadow(mode, 'sm'),
            ]}>
                <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Cari produk..."
                    placeholderTextColor={colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <FlatList
                data={filteredProducts}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>Belum ada produk.</Text>
                }
            />

            {/* Selection Mode Action Bar */}
            {selectionMode && (
                <View style={[styles.selectionBar, { backgroundColor: colors.primary }]}>
                    <TouchableOpacity onPress={exitSelectionMode} style={styles.selectionCancelBtn}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.selectionCount}>{selectedIds.size} dipilih</Text>
                    <TouchableOpacity onPress={handleBulkDelete} style={[styles.selectionDeleteBtn, { backgroundColor: colors.error }]}>
                        <Ionicons name="trash" size={20} color="#fff" />
                        <Text style={styles.selectionDeleteText}>Hapus</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* FAB */}
            {!selectionMode && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: colors.primary }, getShadow(mode, 'lg')]}
                    onPress={() => openModal()}
                >
                    <Ionicons name="add" size={30} color="#fff" />
                </TouchableOpacity>
            )}

            {/* Add/Edit Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
                            </Text>
                            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {/* Image Picker */}
                            <View style={styles.imagePickerContainer}>
                                <TouchableOpacity onPress={pickImage} style={[styles.imagePreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                    {formImage ? (
                                        <Image source={{ uri: formImage }} style={styles.image} contentFit="cover" />
                                    ) : (
                                        <View style={styles.imagePlaceholder}>
                                            <Ionicons name="camera-outline" size={40} color={colors.textMuted} />
                                            <Text style={{ color: colors.textMuted, marginTop: spacing.sm }}>Pilih Foto</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <View style={styles.imageActions}>
                                    <TouchableOpacity style={[styles.imageBtn, { backgroundColor: colors.primary }]} onPress={takePhoto}>
                                        <Ionicons name="camera" size={20} color="#fff" />
                                        <Text style={styles.imageBtnText}>Ambil Foto</Text>
                                    </TouchableOpacity>
                                    {formImage && (
                                        <TouchableOpacity style={[styles.imageBtn, { backgroundColor: colors.error }]} onPress={() => setFormImage(null)}>
                                            <Ionicons name="trash" size={20} color="#fff" />
                                            <Text style={styles.imageBtnText}>Hapus</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Nama Produk</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                                    value={formName}
                                    onChangeText={setFormName}
                                    placeholder="Contoh: Kopi Susu"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Kategori</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                                    <TouchableOpacity
                                        style={[
                                            styles.categoryChip,
                                            { backgroundColor: formCategory === null ? colors.primary : colors.background, borderColor: colors.border }
                                        ]}
                                        onPress={() => setFormCategory(null)}
                                    >
                                        <Text style={{ color: formCategory === null ? '#fff' : colors.textSecondary }}>Semua</Text>
                                    </TouchableOpacity>
                                    {categories.map(cat => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.categoryChip,
                                                { backgroundColor: formCategory === cat.id ? colors.primary : colors.background, borderColor: colors.border }
                                            ]}
                                            onPress={() => setFormCategory(cat.id)}
                                        >
                                            <Text style={{ color: formCategory === cat.id ? '#fff' : colors.textSecondary }}>{cat.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Harga Jual</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                                        value={formPrice}
                                        onChangeText={setFormPrice}
                                        placeholder="0"
                                        placeholderTextColor={colors.textMuted}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Harga Modal</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                                        value={formCostPrice}
                                        onChangeText={setFormCostPrice}
                                        placeholder="0"
                                        placeholderTextColor={colors.textMuted}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={[styles.formGroup, styles.switchRow]}>
                                <View>
                                    <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>Kelola Stok</Text>
                                    <Text style={{ fontSize: typography.fontSize.xs, color: colors.textMuted }}>Matikan jika stok tidak terbatas</Text>
                                </View>
                                <Switch
                                    value={formUseStock}
                                    onValueChange={setFormUseStock}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor="#fff"
                                />
                            </View>

                            {formUseStock && (
                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Jumlah Stok</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                                        value={formStock}
                                        onChangeText={setFormStock}
                                        placeholder="0"
                                        placeholderTextColor={colors.textMuted}
                                        keyboardType="numeric"
                                    />
                                </View>
                            )}

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>SKU (Optional)</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                                    value={formSku}
                                    onChangeText={setFormSku}
                                    placeholder="Contoh: KPS-01"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Barcode (Optional)</Text>
                                <View style={styles.barcodeInputRow}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                                        value={formBarcode}
                                        onChangeText={setFormBarcode}
                                        placeholder="Scan atau ketik barcode"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                    <TouchableOpacity style={[styles.scanInputBtn, { backgroundColor: colors.primary }]} onPress={handleOpenScanner}>
                                        <Ionicons name="barcode-outline" size={24} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
                                <Text style={styles.saveBtnText}>Simpan Produk</Text>
                            </TouchableOpacity>

                            <View style={{ height: spacing['4xl'] }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Barcode Scanner Modal */}
            <Modal visible={scannerVisible} animationType="slide">
                <View style={styles.scannerContainer}>
                    <CameraView
                        style={styles.camera}
                        facing="back"
                        barcodeScannerSettings={{
                            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'qr'],
                        }}
                        onBarcodeScanned={handleBarcodeScanned}
                    />
                    <View style={styles.scannerOverlay}>
                        <View style={styles.scanArea}>
                            <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
                            <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
                            <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
                            <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
                        </View>
                        <Text style={styles.scanHint}>Arahkan kamera ke barcode produk</Text>
                    </View>
                    <TouchableOpacity style={styles.closeScannerBtn} onPress={() => setScannerVisible(false)}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Modal>
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
    searchInput: { flex: 1, fontSize: typography.fontSize.md },
    listContent: { padding: spacing.lg, paddingTop: 0, paddingBottom: 100 },
    card: {
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardInfo: { flex: 1 },
    productImageContainer: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.lg,
        overflow: 'hidden',
    },
    productImage: { width: '100%', height: '100%' },
    productName: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold },
    productSku: { fontSize: typography.fontSize.xs, marginVertical: 2 },
    productBarcode: { fontSize: typography.fontSize.xs, marginTop: spacing.xs },
    productPrice: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, marginVertical: 2 },
    costPrice: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
    productStock: { fontSize: typography.fontSize.sm, marginTop: spacing.xs },
    cardActions: { flexDirection: 'row', alignItems: 'center' },
    actionBtn: {
        padding: spacing.sm,
        marginLeft: spacing.sm,
    },
    checkbox: {
        marginRight: spacing.md,
        padding: spacing.sm,
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing['3xl'],
    },
    selectionCancelBtn: { padding: spacing.sm },
    selectionCount: { color: '#fff', fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold },
    selectionDeleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    selectionDeleteText: { color: '#fff', fontWeight: typography.fontWeight.semibold },
    emptyText: { textAlign: 'center', marginTop: 50 },
    fab: {
        position: 'absolute',
        bottom: spacing['2xl'],
        right: spacing['2xl'],
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: borderRadius['2xl'], borderTopRightRadius: borderRadius['2xl'], padding: spacing['2xl'], paddingBottom: spacing['4xl'], maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing['2xl'] },
    modalTitle: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold },
    closeBtn: {
        padding: spacing.md,
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formGroup: { marginBottom: spacing.lg },
    label: { fontSize: typography.fontSize.sm, marginBottom: spacing.sm, fontWeight: typography.fontWeight.medium },
    input: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md, fontSize: typography.fontSize.lg },
    row: { flexDirection: 'row' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    saveBtn: { borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', marginTop: spacing.sm },
    saveBtnText: { color: '#fff', fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
    imagePickerContainer: { marginBottom: spacing.xl, alignItems: 'center' },
    imagePreview: { width: 120, height: 120, borderRadius: borderRadius.xl, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    image: { width: '100%', height: '100%' },
    imagePlaceholder: { alignItems: 'center' },
    imageActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
    imageBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.lg },
    imageBtnText: { color: '#fff', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
    categoryScroll: { flexDirection: 'row', marginTop: spacing.xs },
    categoryChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, marginRight: spacing.sm },
    barcodeInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    scanInputBtn: { padding: spacing.md, borderRadius: borderRadius.lg },
    scannerContainer: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1 },
    scannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    scanArea: { width: 280, height: 180, position: 'relative' },
    corner: { position: 'absolute', width: 30, height: 30 },
    topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
    topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
    scanHint: { color: '#fff', marginTop: spacing['2xl'], fontSize: typography.fontSize.md, textAlign: 'center' },
    closeScannerBtn: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: spacing.md, borderRadius: 30 },
});
