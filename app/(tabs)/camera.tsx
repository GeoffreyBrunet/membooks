/**
 * Camera Screen
 * Barcode scanning for ISBN lookup with confirmation popup
 */

import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useBooks } from '@/contexts/books-context';
import { lookupISBN } from '@/services/isbn-lookup';
import { spacing, typography, shadows, borderWidths, borderRadius } from '@/constants';
import type { Book } from '@/types/book';

type ScanState = 'scanning' | 'searching' | 'found' | 'notFound' | 'alreadyOwned' | 'added';

export default function CameraScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const { books, addBook } = useBooks();

  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [foundBook, setFoundBook] = useState<Book | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      // Only handle EAN-13 and EAN-8 (ISBN barcodes)
      if (result.type !== 'ean13' && result.type !== 'ean8') {
        return;
      }

      // Prevent scanning while modal is open or searching
      if (showModal || scanState !== 'scanning') {
        return;
      }

      const isbn = result.data;
      setScanState('searching');

      // Check if book already exists
      const cleanISBN = isbn.replace(/[-\s]/g, '');
      const existingBook = books.find((b) => b.id === `isbn-${cleanISBN}`);
      if (existingBook) {
        setFoundBook(existingBook);
        setScanState('alreadyOwned');
        setShowModal(true);
        return;
      }

      // Lookup ISBN
      const book = await lookupISBN(isbn);

      if (book) {
        setFoundBook(book);
        setScanState('found');
        setShowModal(true);
      } else {
        setScanState('notFound');
        setShowModal(true);
      }
    },
    [showModal, scanState, books]
  );

  const handleAddBook = useCallback(async () => {
    if (foundBook) {
      await addBook(foundBook);
      setScanState('added');
      // Auto-close after showing success
      setTimeout(() => {
        setShowModal(false);
        setFoundBook(null);
        setScanState('scanning');
      }, 1500);
    }
  }, [foundBook, addBook]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setFoundBook(null);
    setScanState('scanning');
  }, []);

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.text }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          {t('common.error')}
        </Text>
      </View>
    );
  }

  const getFrameColor = () => {
    if (scanState === 'searching') return colors.accent1;
    if (showModal) return colors.secondary;
    return colors.primary;
  };

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8'],
        }}
        onBarcodeScanned={!showModal && scanState === 'scanning' ? handleBarCodeScanned : undefined}
      />

      {/* Overlay */}
      <View
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          },
        ]}
      >
        {/* Scan frame */}
        <View style={[styles.scanFrame, { borderColor: getFrameColor() }]} />

        {/* Status indicator */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.statusText, { color: colors.text }]}>
            {scanState === 'searching' ? t('scanner.searching') : t('scanner.scanning')}
          </Text>
        </View>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            {/* Modal Header */}
            <View
              style={[
                styles.modalHeader,
                {
                  backgroundColor:
                    scanState === 'added'
                      ? colors.secondary
                      : scanState === 'notFound' || scanState === 'alreadyOwned'
                      ? colors.accent1
                      : colors.primary,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.modalHeaderText, { color: colors.text }]}>
                {scanState === 'added'
                  ? t('scanner.bookAdded')
                  : scanState === 'notFound'
                  ? t('scanner.bookNotFound')
                  : scanState === 'alreadyOwned'
                  ? t('scanner.alreadyOwned')
                  : t('scanner.bookFound')}
              </Text>
            </View>

            {/* Book Info */}
            {foundBook && scanState !== 'notFound' && (
              <View style={styles.bookInfo}>
                <Text style={[styles.bookTitle, { color: colors.text }]}>
                  {foundBook.title}
                </Text>
                <Text style={[styles.bookAuthor, { color: colors.textSecondary }]}>
                  {foundBook.author}
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.modalActions}>
              {scanState === 'found' && (
                <>
                  <Text style={[styles.confirmText, { color: colors.textSecondary }]}>
                    {t('scanner.addToLibrary')}
                  </Text>
                  <View style={styles.buttonRow}>
                    <Pressable
                      onPress={handleCloseModal}
                      style={({ pressed }) => [
                        styles.button,
                        styles.cancelButton,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={[styles.buttonText, { color: colors.text }]}>
                        {t('common.cancel')}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleAddBook}
                      style={({ pressed }) => [
                        styles.button,
                        styles.addButton,
                        {
                          backgroundColor: colors.primary,
                          borderColor: colors.border,
                          shadowColor: colors.shadow,
                        },
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={[styles.buttonText, { color: colors.primaryText }]}>
                        {t('scanner.add')}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}

              {(scanState === 'notFound' || scanState === 'alreadyOwned') && (
                <Pressable
                  onPress={handleCloseModal}
                  style={({ pressed }) => [
                    styles.button,
                    styles.singleButton,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.border,
                      shadowColor: colors.shadow,
                    },
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={[styles.buttonText, { color: colors.primaryText }]}>
                    {t('common.close')}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  text: {
    ...typography.body,
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  scanFrame: {
    width: 280,
    height: 160,
    borderWidth: 4,
    borderRadius: borderRadius.lg,
    marginTop: spacing['3xl'],
  },
  statusBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderWidth: borderWidths.medium,
    borderRadius: borderRadius.md,
  },
  statusText: {
    ...typography.label,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderWidth: borderWidths.medium,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  modalHeader: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: borderWidths.medium,
  },
  modalHeaderText: {
    ...typography.subtitle,
    textAlign: 'center',
  },
  bookInfo: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  bookTitle: {
    ...typography.title,
  },
  bookAuthor: {
    ...typography.body,
  },
  modalActions: {
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.md,
  },
  confirmText: {
    ...typography.body,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: borderWidths.medium,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
  },
  addButton: {
    flex: 1,
    ...shadows.sm,
  },
  singleButton: {
    ...shadows.sm,
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }, { translateY: 2 }],
    shadowOffset: { width: 0, height: 1 },
  },
  buttonText: {
    ...typography.button,
  },
});
