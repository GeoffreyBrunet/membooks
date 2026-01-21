/**
 * Camera Screen
 * Barcode scanning for ISBN lookup
 */

import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useBooks } from '@/contexts/books-context';
import { lookupISBN } from '@/services/isbn-lookup';
import { spacing, typography, borders, shadows, borderWidths, borderRadius } from '@/constants';

type ScanState = 'scanning' | 'searching' | 'success' | 'notFound' | 'alreadyOwned';

export default function CameraScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const { books, addBook } = useBooks();

  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [lastScannedISBN, setLastScannedISBN] = useState<string | null>(null);
  const [scannedBookTitle, setScannedBookTitle] = useState<string | null>(null);

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

      const isbn = result.data;

      // Prevent multiple scans of the same ISBN
      if (isbn === lastScannedISBN || scanState !== 'scanning') {
        return;
      }

      setLastScannedISBN(isbn);
      setScanState('searching');

      // Check if book already exists
      const existingBook = books.find((b) => b.id === `isbn-${isbn.replace(/[-\s]/g, '')}`);
      if (existingBook) {
        setScannedBookTitle(existingBook.title);
        setScanState('alreadyOwned');
        return;
      }

      // Lookup ISBN
      const book = await lookupISBN(isbn);

      if (book) {
        addBook(book);
        setScannedBookTitle(book.title);
        setScanState('success');
      } else {
        setScanState('notFound');
      }
    },
    [lastScannedISBN, scanState, books, addBook]
  );

  const resetScanner = useCallback(() => {
    setScanState('scanning');
    setLastScannedISBN(null);
    setScannedBookTitle(null);
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

  const getStatusColor = () => {
    switch (scanState) {
      case 'success':
        return colors.secondary;
      case 'notFound':
      case 'alreadyOwned':
        return colors.accent1;
      default:
        return colors.primary;
    }
  };

  const getStatusMessage = () => {
    switch (scanState) {
      case 'searching':
        return t('scanner.searching');
      case 'success':
        return `${t('scanner.bookAdded')}\n${scannedBookTitle}`;
      case 'notFound':
        return t('scanner.bookNotFound');
      case 'alreadyOwned':
        return `${t('scanner.alreadyOwned')}\n${scannedBookTitle}`;
      default:
        return t('scanner.scanning');
    }
  };

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8'],
        }}
        onBarcodeScanned={scanState === 'scanning' ? handleBarCodeScanned : undefined}
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
        <View style={[styles.scanFrame, { borderColor: getStatusColor() }]} />

        {/* Status card */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor() },
            ]}
          />
          <Text style={[styles.statusText, { color: colors.text }]}>
            {getStatusMessage()}
          </Text>

          {/* Scan another button */}
          {(scanState === 'success' || scanState === 'notFound' || scanState === 'alreadyOwned') && (
            <Pressable
              onPress={resetScanner}
              style={({ pressed }) => [
                styles.scanButton,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.border,
                  shadowColor: colors.shadow,
                },
                pressed && styles.scanButtonPressed,
              ]}
            >
              <Text style={[styles.scanButtonText, { color: colors.primaryText }]}>
                {t('scanner.scanAnother')}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
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
  statusCard: {
    width: '100%',
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    ...borders.card,
    ...shadows.md,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    ...typography.body,
    textAlign: 'center',
  },
  scanButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderWidth: borderWidths.medium,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  scanButtonPressed: {
    transform: [{ scale: 0.96 }, { translateY: 2 }],
    shadowOffset: { width: 0, height: 1 },
  },
  scanButtonText: {
    ...typography.button,
  },
});
