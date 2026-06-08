import React from 'react';
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  scrollable?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  scrollable = true,
}) => {
  const { colors } = useTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Pressable
            style={[
              styles.content,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
            onPress={(e) => e.stopPropagation()} // Prevent closing on content tap
          >
            {/* Grab Bar */}
            <View style={[styles.grabBar, { backgroundColor: colors.border }]} />

            {/* Header */}
            {title && (
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>DONE</Text>
                </Pressable>
              </View>
            )}

            {/* Body */}
            {scrollable ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={styles.fixedContent}>{children}</View>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  content: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  grabBar: {
    width: 48,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(100, 116, 139, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  fixedContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
export default Modal;
