import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db from '../database/db';
import { borderRadius, getShadow, spacing, typography, useTheme } from '../theme';

interface Category {
    id: number;
    name: string;
    created_at: string;
}

export default function CategoryScreen() {
    const { colors, mode } = useTheme();
    const [categories, setCategories] = useState<Category[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formName, setFormName] = useState('');

    const fetchCategories = useCallback(() => {
        try {
            const result = db.getAllSync<Category>('SELECT * FROM categories ORDER BY name ASC');
            setCategories(result);
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSave = () => {
        if (!formName) {
            Alert.alert('Error', 'Nama kategori wajib diisi!');
            return;
        }

        try {
            if (editingCategory) {
                db.runSync('UPDATE categories SET name = ? WHERE id = ?', [formName, editingCategory.id]);
            } else {
                db.runSync('INSERT INTO categories (name) VALUES (?)', [formName]);
            }
            fetchCategories();
            closeModal();
        } catch (e) {
            Alert.alert('Error', 'Gagal menyimpan kategori');
        }
    };

    const handleDelete = (id: number) => {
        // Check if category is used by products
        const productsUsingCategory = db.getAllSync('SELECT id FROM products WHERE category_id = ?', [id]);
        if (productsUsingCategory.length > 0) {
            Alert.alert('Peringatan', 'Kategori ini masih digunakan oleh produk. Ubah kategori produk tersebut sebelum menghapus kategori ini.');
            return;
        }

        Alert.alert('Hapus Kategori', 'Yakin ingin menghapus kategori ini?', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus',
                style: 'destructive',
                onPress: () => {
                    db.runSync('DELETE FROM categories WHERE id = ?', [id]);
                    fetchCategories();
                }
            }
        ]);
    };

    const openModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormName(category.name);
        } else {
            setEditingCategory(null);
            setFormName('');
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingCategory(null);
    };

    const renderItem = ({ item }: { item: Category }) => (
        <View style={[styles.card, { backgroundColor: colors.cardBackground }, getShadow(mode, 'sm')]}>
            <View style={styles.cardInfo}>
                <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => openModal(item)} style={styles.actionBtn}>
                    <Ionicons name="create-outline" size={24} color={colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={24} color={colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: 'Kelola Kategori' }} />

            <FlatList
                data={categories}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>Belum ada kategori.</Text>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }, getShadow(mode, 'lg')]}
                onPress={() => openModal()}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="fade" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
                            </Text>
                            <TouchableOpacity onPress={closeModal}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Nama Kategori</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                                value={formName}
                                onChangeText={setFormName}
                                placeholder="Contoh: Makanan, Minuman"
                                placeholderTextColor={colors.textMuted}
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>Simpan</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { padding: spacing.lg, paddingBottom: 100 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.md,
    },
    cardInfo: { flex: 1 },
    categoryName: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold },
    cardActions: { flexDirection: 'row' },
    actionBtn: { padding: spacing.sm, marginLeft: spacing.sm },
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
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl },
    modalContent: { borderRadius: borderRadius['2xl'], padding: spacing['2xl'] },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing['2xl'] },
    modalTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
    formGroup: { marginBottom: spacing.xl },
    label: { fontSize: typography.fontSize.sm, marginBottom: spacing.sm, fontWeight: typography.fontWeight.medium },
    input: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md, fontSize: typography.fontSize.lg },
    saveBtn: { borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
    emptyText: { textAlign: 'center', marginTop: 50 },
});
