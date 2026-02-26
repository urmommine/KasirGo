import dayjs from 'dayjs';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import db from '../database/db';

interface Transaction {
    id: number;
    total: number;
    paid: number;
    change: number;
    created_at: string;
}

interface TransactionItem {
    product_name: string;
    qty: number;
    price: number;
    subtotal: number;
}

interface ReportData {
    transactions: Transaction[];
    totalSales: number;
    totalProfit: number;
    totalTransactions: number;
    averageTransaction: number;
    chartData: { labels: string[]; datasets: { data: number[] }[] };
    startDate: string;
    endDate: string;
}

export const getReportData = (startDate: string, endDate: string): ReportData => {
    try {
        const transactions = db.getAllSync<Transaction>(
            `SELECT * FROM transactions 
             WHERE created_at >= ? AND created_at <= ? 
             ORDER BY created_at DESC`,
            [`${startDate} 00:00:00`, `${endDate} 23:59:59`]
        );

        const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);

        // Calculate Profit
        const items = db.getAllSync<{ price: number; cost_price: number; qty: number; discount: number }>(
            `SELECT ti.price, ti.cost_price, ti.qty, ti.discount 
             FROM transaction_items ti
             JOIN transactions t ON ti.transaction_id = t.id
             WHERE t.created_at >= ? AND t.created_at <= ?`,
            [`${startDate} 00:00:00`, `${endDate} 23:59:59`]
        );

        const totalProfit = items.reduce((sum, item) => {
            const netPrice = item.price - item.discount;
            const profitPerItem = netPrice - item.cost_price;
            return sum + (profitPerItem * item.qty);
        }, 0);

        const averageTransaction = transactions.length > 0 ? totalSales / transactions.length : 0;

        // Prepare Chart Data (Daily)
        const dailyData: { [key: string]: number } = {};
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        let current = start;

        while (current.isBefore(end) || current.isSame(end, 'day')) {
            dailyData[current.format('YYYY-MM-DD')] = 0;
            current = current.add(1, 'day');
        }

        transactions.forEach(t => {
            const date = dayjs(t.created_at).format('YYYY-MM-DD');
            if (dailyData[date] !== undefined) {
                dailyData[date] += t.total;
            }
        });

        const labels = Object.keys(dailyData).map(d => dayjs(d).format('DD/MM'));
        const values = Object.values(dailyData);

        const chartData = {
            labels,
            datasets: [{ data: values }]
        };

        return {
            transactions,
            totalSales,
            totalProfit,
            totalTransactions: transactions.length,
            averageTransaction,
            chartData,
            startDate,
            endDate,
        };
    } catch (e) {
        console.error(e);
        return {
            transactions: [],
            totalSales: 0,
            totalProfit: 0,
            totalTransactions: 0,
            averageTransaction: 0,
            chartData: { labels: [], datasets: [{ data: [] }] },
            startDate,
            endDate,
        };
    }
};

export const generatePdfHtml = (data: ReportData, storeName: string): string => {
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID') + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const transactionsRows = data.transactions.map(t => `
        <tr>
            <td>#${t.id}</td>
            <td>${formatDate(t.created_at)}</td>
            <td style="text-align: right;">Rp ${t.total.toLocaleString('id-ID')}</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #4F46E5; margin-bottom: 5px; }
            .subtitle { color: #6B7280; margin-bottom: 20px; }
            .summary { background: #F3F4F6; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
            .summary-grid { display: flex; gap: 20px; }
            .summary-item { flex: 1; }
            .summary-label { font-size: 12px; color: #6B7280; }
            .summary-value { font-size: 24px; font-weight: bold; color: #1F2937; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; }
            th { background: #F9FAFB; font-weight: 600; }
            .total-row { font-weight: bold; background: #EFF6FF; }
        </style>
    </head>
    <body>
        <h1>${storeName}</h1>
        <p class="subtitle">Laporan Penjualan: ${data.startDate} s/d ${data.endDate}</p>
        
        <div class="summary">
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">Total Transaksi</div>
                    <div class="summary-value">${data.totalTransactions}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Penjualan</div>
                    <div class="summary-value" style="color: #10B981;">Rp ${data.totalSales.toLocaleString('id-ID')}</div>
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>No. Transaksi</th>
                    <th>Waktu</th>
                    <th style="text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${transactionsRows}
                <tr class="total-row">
                    <td colspan="2">TOTAL</td>
                    <td style="text-align: right;">Rp ${data.totalSales.toLocaleString('id-ID')}</td>
                </tr>
            </tbody>
        </table>
    </body>
    </html>
    `;
};

export const exportToPdf = async (html: string) => {
    try {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri);
        return true;
    } catch (e) {
        console.error('PDF Export Error:', e);
        return false;
    }
};

export const exportToCsv = async (data: ReportData, filename: string) => {
    try {
        let csv = 'No,Tanggal,Total\n';
        data.transactions.forEach((t, index) => {
            csv += `${index + 1},${t.created_at},${t.total}\n`;
        });
        csv += `\nTotal Transaksi,${data.totalTransactions}\n`;
        csv += `Total Penjualan,${data.totalSales}\n`;

        const file = new File(Paths.cache, `${filename}.csv`);
        if (!file.exists) {
            file.create();
        }
        file.write(csv);
        await Sharing.shareAsync(file.uri);
        return true;
    } catch (e) {
        console.error('CSV Export Error:', e);
        return false;
    }
};
