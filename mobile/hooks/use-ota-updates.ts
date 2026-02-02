/**
 * useOTAUpdates Hook
 * Checks for OTA updates on app launch.
 * Strategy: check on launch, download in background, apply on next restart.
 */

import { useEffect, useState, useCallback } from 'react';
import * as Updates from 'expo-updates';

export type UpdateStatus = 'idle' | 'checking' | 'downloading' | 'ready' | 'error';

export function useOTAUpdates() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [error, setError] = useState<Error | null>(null);

  const checkForUpdate = useCallback(async () => {
    // Skip in development — expo-updates is not available in dev client
    if (__DEV__) return;

    try {
      setStatus('checking');
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        setStatus('downloading');
        await Updates.fetchUpdateAsync();
        setStatus('ready');
      } else {
        setStatus('idle');
      }
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    if (status === 'ready') {
      await Updates.reloadAsync();
    }
  }, [status]);

  // Check for updates on mount (app launch)
  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  return { status, error, checkForUpdate, applyUpdate };
}
