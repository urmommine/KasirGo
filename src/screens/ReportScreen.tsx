import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import db from '../database/db';
import { borderRadius, getShadow, spacing, typography, useTheme } from '../theme';
import { exportToCsv, exportToPdf, generatePdfHtml, getReportData } from '../utils/reportUtils';

type DateRange = 'today' | 'week' | 'month' | 'all';

export default function ReportScreen() {
    const { colors, mode } = useTheme();
    const [selectedRange, setSelectedRange] = useState<DateRange>('today');
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [storeName, setStoreName] = useState('Toko');
    const [reportData, setReportData] = useState<any>(null);
    const [todayIncome, setTodayIncome] = useState(0);

    const fetchTodayIncome = useCallback(() => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const result = db.getAllSync<{ total: number }>(`SELECT SUM(total) as total FROM transactions WHERE created_at LIKE ?`, [`${today}%`]);
            setTodayIncome(result[0]?.total || 0);
        } catch (e) {
            console.error('Failed to fetch today income:', e);
        }
    }, []);

    const loadReportData = useCallback(() => {
        const { start, end } = getDateRange();
        const data = getReportData(start, end);
        setReportData(data);
    }, [selectedRange]);

    const fetchData = useCallback(() => {
        fetchTodayIncome();
        loadReportData();
    }, [fetchTodayIncome, loadReportData]);

    useFocusEffect(
        useCallback(() => {
            try {
                const settings = db.getAllSync<{ store_name: string }>('SELECT store_name FROM settings WHERE id = 1');
                if (settings.length > 0) setStoreName(settings[0].store_name);
            } catch (e) { }
            fetchData();
        }, [fetchData])
    );

    useEffect(() => {
        loadReportData();
    }, [selectedRange, loadReportData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
        setRefreshing(false);
    }, [fetchData]);

    const getDateRange = (): { start: string; end: string } => {
        const today = new Date();
        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        switch (selectedRange) {
            case 'today':
                return { start: formatDate(today), end: formatDate(today) };
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                return { start: formatDate(weekAgo), end: formatDate(today) };
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(today.getMonth() - 1);
                return { start: formatDate(monthAgo), end: formatDate(today) };
            case 'all':
                return { start: '2020-01-01', end: formatDate(today) };
            default:
                return { start: formatDate(today), end: formatDate(today) };
        }
    };

    const handleExportPdf = async () => {
        if (!reportData || reportData.transactions.length === 0) {
            Alert.alert('Info', 'Tidak ada data untuk diekspor.');
            return;
        }
        setIsLoading(true);
        const html = generatePdfHtml(reportData, storeName);
        const success = await exportToPdf(html);
        setIsLoading(false);
        if (!success) Alert.alert('Error', 'Gagal mengekspor PDF.');
    };

    const handleExportCsv = async () => {
        if (!reportData || reportData.transactions.length === 0) {
            Alert.alert('Info', 'Tidak ada data untuk diekspor.');
            return;
        }
        setIsLoading(true);
        const { start, end } = getDateRange();
        const success = await exportToCsv(reportData, `laporan_${start}_${end}`);
        setIsLoading(false);
        if (!success) Alert.alert('Error', 'Gagal mengekspor CSV.');
    };

    const RangeButton = ({ label, value }: { label: string; value: DateRange }) => (
        <TouchableOpacity
            style={[
                styles.rangeBtn,
                {
                    backgroundColor: selectedRange === value ? colors.primary : colors.cardBackground,
                    borderColor: selectedRange === value ? colors.primary : colors.border,
                },
            ]}
            onPress={() => setSelectedRange(value)}
        >
            <Text
                style={[
                    styles.rangeBtnText,
                    { color: selectedRange === value ? '#fff' : colors.textSecondary },
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.primary}
                    colors={[colors.primary]}
                />
            }
        >
            <Stack.Screen options={{ title: 'Laporan Penjualan' }} />

            {/* Today's Income Card (Migrated from Home) */}
            <View style={[styles.dashboardCard, { backgroundColor: colors.primary }, getShadow(mode, 'lg')]}>
                <View style={styles.dashboardHeader}>
                    <View style={[styles.iconBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Ionicons name="wallet" size={24} color="#fff" />
                    </View>
                    <Text style={styles.dashboardTitle}>Pendapatan Hari Ini</Text>
                </View>
                <Text style={styles.dashboardValue}>
                    Rp {todayIncome.toLocaleString('id-ID')}
                </Text>
            </View>

            {/* Main Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.cardBackground }, getShadow(mode, 'sm')]}>
                    <View style={[styles.statIcon, { backgroundColor: colors.successLight }]}>
                        <Ionicons name="trending-up" size={20} color={colors.success} />
                    </View>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Untung</Text>
                    <Text style={[styles.statValue, { color: colors.success }]}>
                        Rp {(reportData?.totalProfit || 0).toLocaleString('id-ID')}
                    </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.cardBackground }, getShadow(mode, 'sm')]}>
                    <View style={[styles.statIcon, { backgroundColor: colors.accentLight }]}>
                        <Ionicons name="stats-chart" size={20} color={colors.accent} />
                    </View>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Rata-rata Trx</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                        Rp {Math.round(reportData?.averageTransaction || 0).toLocaleString('id-ID')}
                    </Text>
                </View>
            </View>

            {/* Chart Section */}
            {reportData?.chartData?.datasets[0]?.data?.length > 0 && (
                <View style={[styles.chartContainer, { backgroundColor: colors.cardBackground }, getShadow(mode, 'sm')]}>
                    <Text style={[styles.chartTitle, { color: colors.text }]}>Tren Penjualan</Text>
                    <LineChart
                        data={reportData.chartData}
                        width={Dimensions.get('window').width - spacing.xl * 4}
                        height={220}
                        chartConfig={{
                            backgroundColor: colors.cardBackground,
                            backgroundGradientFrom: colors.cardBackground,
                            backgroundGradientTo: colors.cardBackground,
                            decimalPlaces: 0,
                            color: (opacity = 1) => colors.primary,
                            labelColor: (opacity = 1) => colors.textMuted,
                            style: { borderRadius: 16 },
                            propsForDots: { r: "4", strokeWidth: "2", stroke: colors.primary },
                            formatYLabel: (val) => {
                                const n = parseInt(val);
                                if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
                                if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
                                return val;
                            }
                        }}
                        bezier
                        style={{ marginVertical: 8, borderRadius: 16 }}
                        fromZero
                    />
                </View>
            )}

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistik Penjualan</Text>

            {/* Date Range Selector */}
            <View style={styles.rangeContainer}>
                <RangeButton label="Hari Ini" value="today" />
                <RangeButton label="7 Hari" value="week" />
                <RangeButton label="30 Hari" value="month" />
                <RangeButton label="Semua" value="all" />
            </View>

            {/* Summary Card */}
            <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }, getShadow(mode, 'md')]}>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.accentLight }]}>
                            <Ionicons name="receipt-outline" size={24} color={colors.accent} />
                        </View>
                        <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Transaksi</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>
                            {reportData?.totalTransactions || 0}
                        </Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.summaryItem}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.successLight }]}>
                            <Ionicons name="wallet-outline" size={24} color={colors.success} />
                        </View>
                        <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total Penjualan</Text>
                        <Text style={[styles.summaryValue, { color: colors.success }]}>
                            Rp {(reportData?.totalSales || 0).toLocaleString('id-ID')}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Export Section */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ekspor Laporan</Text>

            <TouchableOpacity
                style={[styles.exportBtn, { backgroundColor: colors.primary }]}
                onPress={handleExportPdf}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Ionicons name="document-text" size={24} color="#fff" />
                        <Text style={styles.exportBtnText}>Ekspor PDF</Text>
                    </>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.exportBtn,
                    styles.exportBtnSecondary,
                    { backgroundColor: colors.cardBackground, borderColor: colors.primary },
                ]}
                onPress={handleExportCsv}
                disabled={isLoading}
            >
                <Ionicons name="grid" size={24} color={colors.primary} />
                <Text style={[styles.exportBtnText, { color: colors.primary }]}>Ekspor CSV</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    contentContainer: { padding: spacing.xl },
    dashboardCard: {
        padding: spacing.xl,
        borderRadius: borderRadius['2xl'],
        marginBottom: spacing['3xl'],
    },
    dashboardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    iconBadge: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    dashboardTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        color: 'rgba(255,255,255,0.9)',
    },
    dashboardValue: {
        fontSize: typography.fontSize['4xl'],
        fontWeight: typography.fontWeight.bold,
        color: '#fff',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    statCard: {
        flex: 1,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    statLabel: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        marginBottom: 2,
    },
    statValue: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    chartContainer: {
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        marginBottom: spacing['2xl'],
    },
    chartTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        marginBottom: spacing.lg,
    },
    rangeContainer: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
    rangeBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
    },
    rangeBtnText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
    summaryCard: {
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        marginBottom: spacing['2xl'],
    },
    summaryRow: { flexDirection: 'row' },
    summaryItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    divider: { width: 1, marginHorizontal: spacing.lg },
    summaryLabel: { fontSize: typography.fontSize.sm, marginTop: spacing.sm },
    summaryValue: { fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, marginTop: spacing.xs },
    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.md,
        gap: spacing.md,
    },
    exportBtnSecondary: {
        borderWidth: 2,
    },
    exportBtnText: { color: '#fff', fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
});
