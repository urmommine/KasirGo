import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db from '../database/db';
import { useTheme } from '../theme';
import { borderRadius, getShadow, spacing, typography } from '../theme/theme';
import { resetOnboarding } from './OnboardingScreen';

export default function SettingsScreen() {
    const router = useRouter();
    const { colors, mode, isDark, toggleTheme } = useTheme();
    const [storeName, setStoreName] = useState('');
    const [storeAddress, setStoreAddress] = useState('');
    const [taxRate, setTaxRate] = useState('0');
    const [enableTax, setEnableTax] = useState(false);

    useFocusEffect(
        useCallback(() => {
            try {
                const result = db.getAllSync<{ store_name: string, store_address: string, tax_rate: number, enable_tax: number }>('SELECT * FROM settings WHERE id = 1');
                if (result.length > 0) {
                    setStoreName(result[0].store_name);
                    setStoreAddress(result[0].store_address || '');
                    setTaxRate(result[0].tax_rate?.toString() || '0');
                    setEnableTax(result[0].enable_tax === 1);
                }
            } catch (e) {
                console.error(e);
            }
        }, [])
    );

    const handleSave = () => {
        try {
            db.runSync(
                'UPDATE settings SET store_name = ?, store_address = ?, tax_rate = ?, enable_tax = ? WHERE id = 1',
                [storeName, storeAddress, parseFloat(taxRate) || 0, enableTax ? 1 : 0]
            );
            Alert.alert('Sukses ✅', 'Pengaturan toko berhasil disimpan.');
        } catch (e) {
            Alert.alert('Error', 'Gagal menyimpan pengaturan.');
            console.error(e);
        }
    };

    const handleResetOnboarding = () => {
        Alert.alert(
            'Reset Onboarding',
            'Ini akan menampilkan onboarding kembali saat aplikasi dibuka. Lanjutkan?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Reset',
                    onPress: async () => {
                        await resetOnboarding();
                        Alert.alert('Berhasil', 'Onboarding akan ditampilkan saat aplikasi dibuka kembali.');
                    },
                },
            ]
        );
    };

    const SettingMenuButton = ({ title, subtitle, icon, iconColor, onPress }: { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string; onPress: () => void }) => (
        <TouchableOpacity
            style={[styles.menuBtn, { backgroundColor: colors.surface }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.menuIconContainer, { backgroundColor: iconColor + '20' }]}>
                <Ionicons name={icon} size={24} color={iconColor} />
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                contentContainerStyle={{ paddingBottom: spacing['4xl'] }}
                keyboardShouldPersistTaps="handled"
            >
                <Stack.Screen options={{ title: 'Pengaturan' }} />

                {/* Manajemen Data Section (Migrated from Home) */}
                <View style={[styles.section, { backgroundColor: colors.cardBackground }, getShadow(mode, 'sm')]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Manajemen Data</Text>

                    <SettingMenuButton
                        title="Daftar Produk"
                        subtitle="Kelola stok, harga, dan barcode"
                        icon="cube-outline"
                        iconColor="#F59E0B"
                        onPress={() => router.push('/products')}
                    />

                    <View style={[styles.separator, { backgroundColor: colors.border }]} />

                    <SettingMenuButton
                        title="Kategori Produk"
                        subtitle="Kelola kategori makanan, minuman, dll"
                        icon="list-outline"
                        iconColor="#10B981"
                        onPress={() => router.push('/categories')}
                    />

                    <View style={[styles.separator, { backgroundColor: colors.border }]} />

                    <SettingMenuButton
                        title="Riwayat Transaksi"
                        subtitle="Lihat dan hapus riwayat"
                        icon="time-outline"
                        iconColor="#3B82F6"
                        onPress={() => router.push('/history')}
                    />
                </View>

                {/* Theme Section */}
                <View style={[styles.section, { backgroundColor: colors.cardBackground }, getShadow(mode, 'sm')]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Tampilan</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Ionicons
                                name={isDark ? 'moon' : 'sunny'}
                                size={24}
                                color={colors.primary}
                                style={styles.settingIcon}
                            />
                            <View>
                                <Text style={[styles.settingLabel, { color: colors.text }]}>Mode Gelap</Text>
                                <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                                    {isDark ? 'Aktif' : 'Nonaktif'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.border, true: colors.primaryLight }}
                            thumbColor={isDark ? colors.primary : colors.textMuted}
                        />
                    </View>
                </View>

                {/* Store Profile Section */}
                <View style={[styles.section, { backgroundColor: colors.cardBackground }, getShadow(mode, 'sm')]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Profil Toko</Text>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Nama Toko</Text>
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text },
                            ]}
                            value={storeName}
                            onChangeText={setStoreName}
                            placeholder="Nama Toko Anda"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Alamat Toko</Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text },
                            ]}
                            value={storeAddress}
                            onChangeText={setStoreAddress}
                            placeholder="Alamat lengkap..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                        onPress={handleSave}
                    >
                        <Ionicons name="checkmark" size={20} color="#fff" style={{ marginRight: spacing.sm }} />
                        <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
                    </TouchableOpacity>
                </View>

                {/* Tax Section */}
                <View style={[styles.section, { backgroundColor: colors.cardBackground }, getShadow(mode, 'sm')]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Pajak & Biaya</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="receipt-outline" size={24} color={colors.primary} style={styles.settingIcon} />
                            <View>
                                <Text style={[styles.settingLabel, { color: colors.text }]}>Aktifkan Pajak (Inclusive)</Text>
                                <Text style={[styles.settingDescription, { color: colors.textMuted }]}>Pajak sudah termasuk dalam harga</Text>
                            </View>
                        </View>
                        <Switch
                            value={enableTax}
                            onValueChange={setEnableTax}
                            trackColor={{ false: colors.border, true: colors.primaryLight }}
                            thumbColor={enableTax ? colors.primary : colors.textMuted}
                        />
                    </View>

                    {enableTax && (
                        <View style={[styles.formGroup, { marginTop: spacing.lg }]}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Persentase Pajak (%)</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text },
                                ]}
                                value={taxRate}
                                onChangeText={setTaxRate}
                                placeholder="Contoh: 11"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="numeric"
                            />
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: spacing.md }]}
                        onPress={handleSave}
                    >
                        <Ionicons name="checkmark" size={20} color="#fff" style={{ marginRight: spacing.sm }} />
                        <Text style={styles.saveBtnText}>Simpan Pengaturan Pajak</Text>
                    </TouchableOpacity>
                </View>

                {/* About Section */}
                <View style={[styles.section, { backgroundColor: colors.cardBackground }, getShadow(mode, 'sm')]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Tentang Aplikasi</Text>

                    <View style={styles.aboutContent}>
                        <View style={[styles.logoContainer, { backgroundColor: colors.primaryLight }]}>
                            <Ionicons name="storefront" size={48} color={colors.primary} />
                        </View>
                        <Text style={[styles.appName, { color: colors.primary }]}>KasirGo</Text>
                        <Text style={[styles.version, { color: colors.textMuted }]}>Versi 1.0.0</Text>
                        <Text style={[styles.desc, { color: colors.textSecondary }]}>
                            Aplikasi kasir offline-first sederhana untuk UMKM Indonesia.
                        </Text>
                    </View>
                </View>

                {/* Debug Section */}
                <View style={[styles.section, { backgroundColor: colors.cardBackground }, getShadow(mode, 'sm')]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Debug</Text>

                    <TouchableOpacity
                        style={[styles.debugBtn, { borderColor: colors.warning }]}
                        onPress={handleResetOnboarding}
                    >
                        <Ionicons name="refresh" size={20} color={colors.warning} style={{ marginRight: spacing.sm }} />
                        <Text style={[styles.debugBtnText, { color: colors.warning }]}>Reset Onboarding</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: spacing.lg },
    section: {
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        marginBottom: spacing.lg,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingIcon: {
        marginRight: spacing.md,
    },
    settingLabel: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
    },
    settingDescription: {
        fontSize: typography.fontSize.sm,
    },
    separator: {
        height: 1,
        marginVertical: spacing.sm,
    },
    menuBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    menuIconContainer: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
    },
    menuSubtitle: {
        fontSize: typography.fontSize.xs,
    },
    formGroup: { marginBottom: spacing.lg },
    label: {
        fontSize: typography.fontSize.sm,
        marginBottom: spacing.sm,
        fontWeight: typography.fontWeight.medium,
    },
    input: {
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontSize: typography.fontSize.lg,
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginTop: spacing.sm,
    },
    saveBtnText: { color: '#fff', fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
    aboutContent: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    appName: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold },
    version: { fontSize: typography.fontSize.md, marginVertical: spacing.xs },
    desc: { textAlign: 'center', marginTop: spacing.sm },
    debugBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    debugBtnText: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
    },
});
