import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import db from '../database/db';
import { Product, useCartStore } from '../store/cartStore';
import { useTheme } from '../theme';
import { borderRadius, spacing, typography } from '../theme/theme';
import { useBeepSound } from '../utils/beepSound';

export default function ScannerScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [torch, setTorch] = useState(false);
    const addToCart = useCartStore(state => state.addToCart);
    const { playBeep } = useBeepSound();

    if (!permission) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.loadingText, { color: colors.text }]}>Meminta izin kamera...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'Scanner' }} />
                <View style={styles.permissionContainer}>
                    <View style={[styles.permissionIcon, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name="camera-outline" size={64} color={colors.primary} />
                    </View>
                    <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
                        Izinkan akses kamera untuk scan barcode
                    </Text>
                    <TouchableOpacity
                        style={[styles.permissionBtn, { backgroundColor: colors.primary }]}
                        onPress={requestPermission}
                    >
                        <Text style={styles.permissionBtnText}>Izinkan Kamera</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const handleBarcodeScanned = (result: BarcodeScanningResult) => {
        if (scanned) return;

        setScanned(true);
        Vibration.vibrate(100);

        const barcode = result.data;

        try {
            const products = db.getAllSync<Product>(
                'SELECT * FROM products WHERE barcode = ? OR sku = ? LIMIT 1',
                [barcode, barcode]
            );

            if (products.length > 0) {
                const product = products[0];
                playBeep();
                addToCart(product);
                Alert.alert(
                    'Produk Ditemukan! ✅',
                    `${product.name} ditambahkan ke keranjang`,
                    [
                        { text: 'Scan Lagi', onPress: () => setScanned(false) },
                        { text: 'Ke Kasir', onPress: () => router.back() }
                    ]
                );
            } else {
                Alert.alert(
                    'Produk Tidak Ditemukan',
                    `Barcode: ${barcode}\nTidak ada produk dengan barcode/SKU ini.`,
                    [
                        { text: 'Scan Lagi', onPress: () => setScanned(false) },
                        { text: 'Tambah Produk', onPress: () => router.push('/products') }
                    ]
                );
            }
        } catch (e) {
            console.error(e);
            setScanned(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Scan Barcode',
                    headerTransparent: true,
                    headerTintColor: '#fff',
                }}
            />

            <CameraView
                style={styles.camera}
                facing="back"
                enableTorch={torch}
                barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'qr'],
                }}
                onBarcodeScanned={handleBarcodeScanned}
            />

            {/* Overlay */}
            <View style={styles.overlay}>
                <View style={styles.scanArea}>
                    <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
                    <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
                    <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
                    <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
                </View>
                <Text style={styles.hint}>Arahkan kamera ke barcode produk</Text>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.controlBtn, { backgroundColor: torch ? colors.primary : 'rgba(0,0,0,0.5)' }]}
                    onPress={() => setTorch(!torch)}
                >
                    <Ionicons name={torch ? 'flash' : 'flash-outline'} size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.controlBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1 },
    loadingText: { textAlign: 'center', marginTop: 100 },
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing['3xl'] },
    permissionIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    permissionText: { fontSize: typography.fontSize.lg, textAlign: 'center', marginBottom: spacing.xl },
    permissionBtn: {
        paddingHorizontal: spacing['2xl'],
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.xl,
    },
    permissionBtnText: { color: '#fff', fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.lg },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanArea: {
        width: 280,
        height: 180,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
    },
    topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
    topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
    hint: { color: '#fff', marginTop: spacing['2xl'], fontSize: typography.fontSize.md, textAlign: 'center' },
    controls: {
        position: 'absolute',
        bottom: spacing['4xl'],
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing['3xl'],
    },
    controlBtn: {
        padding: spacing.lg,
        borderRadius: borderRadius.full,
    },
});
