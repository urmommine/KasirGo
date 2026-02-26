import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import db from '../database/db';
import { borderRadius, getShadow, spacing, typography, useTheme } from '../theme';

interface Transaction {
    id: number;
    total: number;
    paid: number;
    change: number;
    discount_total: number;
    tax_total: number;
    discount_type: string;
    created_at: string;
}

interface TransactionItem {
    id: number;
    product_name: string;
    qty: number;
    price: number;
    subtotal: number;
    discount: number;
}

export default function HistoryScreen() {
    const { colors, mode } = useTheme();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);

    // Selection Mode State
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const fetchTransactions = useCallback(() => {
        try {
            const result = db.getAllSync<Transaction>('SELECT * FROM transactions ORDER BY id DESC');
            setTransactions(result);
        } catch (e: any) {
            if (e?.message?.includes('no such table')) {
                console.log('Transactions table not ready yet');
                setTransactions([]);
            } else {
                console.error(e);
            }
        }
    }, []
    );

    useFocusEffect(
        useCallback(() => {
            fetchTransactions();
        }, [fetchTransactions])
    );


    const openDetail = (transaction: Transaction) => {
        try {
            const items = db.getAllSync<TransactionItem>(
                `SELECT ti.*, p.name as product_name FROM transaction_items ti LEFT JOIN products p ON ti.product_id = p.id WHERE ti.transaction_id = ?`,
                [transaction.id]
            );
            setTransactionItems(items);
            setSelectedTransaction(transaction);
            setModalVisible(true);
        } catch (e) {
            console.error(e);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID') + ' ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
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
            'Hapus Transaksi',
            `Yakin ingin menghapus ${selectedIds.size} transaksi terpilih?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: () => {
                        const ids = Array.from(selectedIds);
                        const placeholders = ids.map(() => '?').join(',');
                        db.runSync(`DELETE FROM transaction_items WHERE transaction_id IN (${placeholders})`, ids);
                        db.runSync(`DELETE FROM transactions WHERE id IN (${placeholders})`, ids);
                        fetchTransactions();
                        exitSelectionMode();
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Transaction }) => {
        const isSelected = selectedIds.has(item.id);
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
                onPress={() => selectionMode ? toggleSelection(item.id) : openDetail(item)}
                onLongPress={() => handleLongPress(item.id)}
                activeOpacity={0.7}
            >
                {selectionMode && (
                    <TouchableOpacity style={styles.checkbox} onPress={() => toggleSelection(item.id)}>
                        <Ionicons
                            name={isSelected ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={isSelected ? colors.primary : colors.textMuted}
                        />
                    </TouchableOpacity>
                )}
                <View style={{ flex: 1 }}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardId, { color: colors.accent }]}>#{item.id}</Text>
                        <Text style={[styles.cardDate, { color: colors.textMuted }]}>{formatDate(item.created_at)}</Text>
                    </View>
                    <View style={styles.cardBody}>
                        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
                        <Text style={[styles.totalValue, { color: colors.success }]}>
                            Rp {item.total.toLocaleString('id-ID')}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: 'Riwayat Transaksi' }} />

            <FlatList
                data={transactions}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Belum ada transaksi.</Text>
                    </View>
                }
            />

            {/* Detail Modal */}
            <Modal visible={modalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Transaksi #{selectedTransaction?.id}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.itemsList}>
                            {transactionItems.map((item) => (
                                <View key={item.id.toString()} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.itemName, { color: colors.text }]}>
                                            {item.product_name || 'Produk dihapus'}
                                        </Text>
                                        <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                                            {item.qty} x Rp {item.price.toLocaleString('id-ID')}
                                            {item.discount > 0 && ` (-Rp ${item.discount.toLocaleString('id-ID')})`}
                                        </Text>
                                    </View>
                                    <Text style={[styles.itemSubtotal, { color: colors.text }]}>
                                        Rp {item.subtotal.toLocaleString('id-ID')}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>

                        {selectedTransaction && (
                            <View style={[styles.summaryContainer, { backgroundColor: colors.backgroundSecondary }]}>
                                {selectedTransaction.discount_total > 0 && (
                                    <View style={styles.summaryRow}>
                                        <Text style={[styles.summaryLabel, { color: colors.error }]}>Diskon</Text>
                                        <Text style={[styles.summaryValue, { color: colors.error }]}>
                                            - Rp {selectedTransaction.discount_total.toLocaleString('id-ID')}
                                        </Text>
                                    </View>
                                )}
                                {selectedTransaction.tax_total > 0 && (
                                    <View style={styles.summaryRow}>
                                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pajak</Text>
                                        <Text style={[styles.summaryValue, { color: colors.text }]}>
                                            Rp {selectedTransaction.tax_total.toLocaleString('id-ID')}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Bayar</Text>
                                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                                        Rp {selectedTransaction.total.toLocaleString('id-ID')}
                                    </Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Dibayar</Text>
                                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                                        Rp {selectedTransaction.paid.toLocaleString('id-ID')}
                                    </Text>
                                </View>
                                <View style={[styles.summaryRow, styles.changeRow, { borderTopColor: colors.border }]}>
                                    <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: '700' }]}>Kembalian</Text>
                                    <Text style={[styles.summaryValue, { color: colors.success }]}>
                                        Rp {selectedTransaction.change.toLocaleString('id-ID')}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.modalFooter}>
                            <Text style={[styles.dateFooter, { color: colors.textMuted }]}>
                                {selectedTransaction && formatDate(selectedTransaction.created_at)}
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>

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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { padding: spacing.lg },
    card: {
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    cardId: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
    cardDate: { fontSize: typography.fontSize.sm },
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: typography.fontSize.md },
    totalValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: spacing.lg, fontSize: typography.fontSize.lg },
    checkbox: { marginRight: spacing.md, padding: spacing.xs },
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
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl },
    modalContent: { borderRadius: borderRadius['2xl'], padding: spacing['2xl'], maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    modalTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
    itemsList: { marginBottom: spacing.xl },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1 },
    itemName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold },
    itemMeta: { fontSize: typography.fontSize.sm },
    itemSubtotal: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.medium },
    summaryContainer: { padding: spacing.lg, borderRadius: borderRadius.xl },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    summaryLabel: { fontSize: typography.fontSize.md },
    summaryValue: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold },
    changeRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1 },
    modalFooter: { marginTop: spacing.lg, alignItems: 'center' },
    dateFooter: { fontSize: typography.fontSize.sm },
});
