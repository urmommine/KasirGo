import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db from '../database/db';
import { useCartStore } from '../store/cartStore';
import { borderRadius, getShadow, spacing, typography, useTheme } from '../theme';

export default function CartScreen() {
    const router = useRouter();
    const { colors, mode } = useTheme();
    const {
        items, updateQty, removeFromCart, clearCart,
        getSubtotal, getDiscountTotal, getTotal,
        setItemDiscount, setTransactionDiscount, transactionDiscount
    } = useCartStore();

    const [moneyReceived, setMoneyReceived] = useState('');
    const [taxSettings, setTaxSettings] = useState({ enable: false, rate: 0 });
    const [showTrxDiscountModal, setShowTrxDiscountModal] = useState(false);
    const [trxDiscountInput, setTrxDiscountInput] = useState(transactionDiscount.value.toString());
    const [trxDiscountType, setTrxDiscountType] = useState<'fixed' | 'percentage'>(transactionDiscount.type);

    useFocusEffect(
        useCallback(() => {
            try {
                const result = db.getAllSync<{ tax_rate: number, enable_tax: number }>('SELECT tax_rate, enable_tax FROM settings WHERE id = 1');
                if (result.length > 0) {
                    setTaxSettings({
                        enable: result[0].enable_tax === 1,
                        rate: result[0].tax_rate || 0
                    });
                }
            } catch (e) {
                console.error(e);
            }
        }, [])
    );

    const subtotal = getSubtotal();
    const discountTotal = getDiscountTotal(subtotal);
    const baseTotal = getTotal();
    const taxTotal = taxSettings.enable ? (baseTotal * (taxSettings.rate / 100)) : 0;
    const finalTotal = baseTotal + taxTotal;

    const payAmount = parseInt(moneyReceived) || 0;
    const change = payAmount - finalTotal;
    const canPay = items.length > 0 && payAmount >= finalTotal;

    const handleProcessTransaction = () => {
        if (!canPay) return;

        try {
            const result = db.runSync(
                'INSERT INTO transactions (total, paid, change, discount_total, tax_total, discount_type) VALUES (?, ?, ?, ?, ?, ?)',
                [finalTotal, payAmount, change, discountTotal, Math.round(taxTotal), transactionDiscount.type]
            );
            const transactionId = result.lastInsertRowId;

            items.forEach(item => {
                db.runSync(
                    'INSERT INTO transaction_items (transaction_id, product_id, price, cost_price, qty, subtotal, discount) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [transactionId, item.id, item.price, item.cost_price || 0, item.qty, (item.price - item.discount) * item.qty, item.discount]
                );

                if (item.use_stock === 1) {
                    db.runSync(
                        'UPDATE products SET stock = stock - ? WHERE id = ?',
                        [item.qty, item.id]
                    );
                }
            });

            Alert.alert(
                'Transaksi Berhasil! ✅',
                'Data transaksi telah disimpan.',
                [{
                    text: 'OK',
                    onPress: () => {
                        clearCart();
                        router.replace('/' as any);
                    }
                }]
            );
        } catch (e) {
            console.error(e);
            Alert.alert('Gagal Memproses Transaksi', 'Terjadi kesalahan pada database.');
        }
    };

    const QuickMoneyBtn = ({ amount }: { amount: number }) => (
        <TouchableOpacity
            style={[
                styles.quickMoneyBtn,
                { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' },
            ]}
            onPress={() => setMoneyReceived(amount.toString())}
        >
            <Text style={[styles.quickMoneyText, { color: colors.primary }]}>
                {amount.toLocaleString('id-ID')}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: 'Keranjang' }} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <FlatList
                    data={items}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                        <View style={[
                            styles.itemCard,
                            { backgroundColor: colors.cardBackground },
                            getShadow(mode, 'sm'),
                        ]}>
                            <View style={styles.itemInfo}>
                                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                                <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>
                                    @ Rp {item.price.toLocaleString('id-ID')}
                                </Text>
                            </View>
                            <View style={[styles.qtyContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                <TouchableOpacity
                                    onPress={() => updateQty(item.id, item.qty - 1)}
                                    style={styles.qtyBtn}
                                >
                                    <Ionicons name="remove" size={16} color={colors.text} />
                                </TouchableOpacity>
                                <Text style={[styles.qtyText, { color: colors.text }]}>{item.qty}</Text>
                                <TouchableOpacity
                                    onPress={() => updateQty(item.id, item.qty + 1)}
                                    style={styles.qtyBtn}
                                >
                                    <Ionicons name="add" size={16} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.itemFinancials}>
                                <Text style={[styles.itemSubtotal, { color: colors.text }] as any}>
                                    Rp {((item.price - item.discount) * item.qty).toLocaleString('id-ID')}
                                </Text>
                                <View style={styles.discountInputWrapper}>
                                    <Text style={[styles.discountLabel, { color: colors.textMuted }] as any}>Disc:</Text>
                                    <TextInput
                                        style={[styles.itemDiscountInput, { color: colors.error }] as any}
                                        value={item.discount.toString()}
                                        onChangeText={(val) => setItemDiscount(item.id, parseInt(val) || 0)}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.deleteBtn}>
                                <Ionicons name="trash-outline" size={20} color={colors.error} />
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cart-outline" size={80} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                Keranjang kosong
                            </Text>
                        </View>
                    }
                />

                {/* Footer */}
                <View style={[
                    styles.footer,
                    { backgroundColor: colors.cardBackground },
                    getShadow(mode, 'lg'),
                ]}>
                    {/* Calculation Summary */}
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>
                                Rp {subtotal.toLocaleString('id-ID')}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.summaryRow}
                            onPress={() => setShowTrxDiscountModal(true)}
                        >
                            <View style={styles.rowLabelWithIcon}>
                                <Ionicons name="pricetag-outline" size={16} color={colors.error} style={{ marginRight: 4 }} />
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Diskon Transaksi</Text>
                            </View>
                            <Text style={[styles.summaryValue, { color: colors.error }]}>
                                - Rp {discountTotal.toLocaleString('id-ID')}
                            </Text>
                        </TouchableOpacity>

                        {taxSettings.enable && (
                            <View style={styles.summaryRow}>
                                <View style={styles.rowLabelWithIcon}>
                                    <Ionicons name="receipt-outline" size={16} color={colors.primary} style={{ marginRight: 4 }} />
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pajak ({taxSettings.rate}%)</Text>
                                </View>
                                <Text style={[styles.summaryValue, { color: colors.text }]}>
                                    + Rp {Math.round(taxTotal).toLocaleString('id-ID')}
                                </Text>
                            </View>
                        )}

                        {payAmount > 0 && (
                            <View style={[styles.summaryRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 0.5, borderTopColor: colors.border }]}>
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Kembalian</Text>
                                <Text style={[styles.summaryValue, { color: change >= 0 ? colors.success : colors.error }]}>
                                    Rp {Math.max(0, change).toLocaleString('id-ID')}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Total */}
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Bayar</Text>
                        <Text style={[styles.totalValue, { color: colors.primary }]}>
                            Rp {finalTotal.toLocaleString('id-ID')}
                        </Text>
                    </View>

                    {/* Money Input */}
                    <View style={[
                        styles.inputContainer,
                        { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
                    ]}>
                        <Ionicons name="cash-outline" size={24} color={colors.success} style={{ marginRight: spacing.md }} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Bayar"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numeric"
                            value={moneyReceived}
                            onChangeText={setMoneyReceived}
                        />
                    </View>

                    {/* Quick Money Suggestions */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickMoneyContainer}>
                        <QuickMoneyBtn amount={finalTotal} />
                        <QuickMoneyBtn amount={Math.ceil(finalTotal / 10000) * 10000} />
                        <QuickMoneyBtn amount={50000} />
                        <QuickMoneyBtn amount={100000} />
                    </ScrollView>

                    {/* Pay Button */}
                    <TouchableOpacity
                        style={[
                            styles.payBtn,
                            { backgroundColor: canPay ? colors.success : colors.border },
                        ]}
                        onPress={handleProcessTransaction}
                        disabled={!canPay}
                    >
                        <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginRight: spacing.sm }} />
                        <Text style={styles.payBtnText}>Lanjut Pembayaran</Text>
                    </TouchableOpacity>
                </View>

                {/* Transaction Discount Modal */}
                {showTrxDiscountModal && (
                    <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                        <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Diskon Transaksi</Text>

                            <View style={styles.typeChooser}>
                                <TouchableOpacity
                                    style={[styles.typeBtn, trxDiscountType === 'fixed' && { backgroundColor: colors.primary }]}
                                    onPress={() => setTrxDiscountType('fixed')}
                                >
                                    <Text style={[styles.typeBtnText, trxDiscountType === 'fixed' && { color: '#fff' }]}>Rp (Tetap)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.typeBtn, trxDiscountType === 'percentage' && { backgroundColor: colors.primary }]}
                                    onPress={() => setTrxDiscountType('percentage')}
                                >
                                    <Text style={[styles.typeBtnText, trxDiscountType === 'percentage' && { color: '#fff' }]}>% (Persen)</Text>
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                                value={trxDiscountInput}
                                onChangeText={setTrxDiscountInput}
                                keyboardType="numeric"
                                autoFocus
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    onPress={() => setShowTrxDiscountModal(false)}
                                    style={styles.modalBtn}
                                >
                                    <Text style={{ color: colors.textSecondary }}>Batal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setTransactionDiscount(parseFloat(trxDiscountInput) || 0, trxDiscountType);
                                        setShowTrxDiscountModal(false);
                                    }}
                                    style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: colors.primary }]}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Terapkan</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { padding: spacing.lg },
    itemCard: {
        padding: spacing.md,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemInfo: { flex: 2 },
    itemName: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
    },
    itemPrice: {
        fontSize: typography.fontSize.sm,
    },
    qtyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: borderRadius.md,
        marginHorizontal: spacing.sm,
    },
    qtyBtn: { padding: spacing.sm },
    qtyText: {
        fontWeight: typography.fontWeight.bold,
        marginHorizontal: spacing.xs,
        minWidth: 24,
        textAlign: 'center',
    },
    itemSubtotal: {
        flex: 1,
        textAlign: 'right',
        fontWeight: typography.fontWeight.bold,
        fontSize: typography.fontSize.md,
        marginRight: spacing.sm,
    },
    deleteBtn: { padding: spacing.xs },
    footer: {
        padding: spacing.xl,
        borderTopLeftRadius: borderRadius['2xl'],
        borderTopRightRadius: borderRadius['2xl'],
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    totalLabel: { fontSize: typography.fontSize.lg },
    totalValue: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: borderRadius.xl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        marginBottom: spacing.md,
    },
    input: {
        flex: 1,
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        paddingVertical: spacing.md,
    },
    quickMoneyContainer: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    quickMoneyBtn: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        marginRight: spacing.sm,
        borderWidth: 1,
    },
    quickMoneyText: {
        fontWeight: typography.fontWeight.semibold,
    },
    changeLabel: { fontSize: typography.fontSize.lg },
    changeValue: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold,
    },
    payBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        marginTop: spacing.lg,
    },
    payBtnText: {
        color: '#fff',
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
    },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: {
        marginTop: spacing.lg,
        fontSize: typography.fontSize.xl,
    },
    itemFinancials: {
        flex: 1.5,
        alignItems: 'flex-end',
    },
    discountInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    discountLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        marginRight: 4,
    },
    itemDiscountInput: {
        fontSize: 12,
        fontWeight: 'bold',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        minWidth: 40,
        textAlign: 'right',
        padding: 0,
    },
    summaryContainer: {
        marginBottom: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 14,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    rowLabelWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        width: '85%',
        padding: 24,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    typeChooser: {
        flexDirection: 'row',
        marginBottom: 20,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
    },
    typeBtn: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
    },
    typeBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    modalInput: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 15,
        fontSize: 24,
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalBtn: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
        borderRadius: 10,
    },
    modalBtnPrimary: {
        marginLeft: 12,
    },
});
