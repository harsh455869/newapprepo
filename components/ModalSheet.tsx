import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Theme } from '@/theme';
import { X } from 'lucide-react-native';

interface ModalSheetProps {
  theme: Theme;
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function ModalSheet({ theme, visible, title, onClose, children }: ModalSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth || 0.5 },
  title: { fontSize: 20, fontWeight: '600' },
  closeBtn: { padding: 8 },
  content: { flex: 1, padding: 20 },
});
