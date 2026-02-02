import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { renderHook, act } from '@testing-library/react-native';

const easJson = JSON.parse(
  readFileSync(resolve(import.meta.dir, '../eas.json'), 'utf-8')
);
const appJson = JSON.parse(
  readFileSync(resolve(import.meta.dir, '../app.json'), 'utf-8')
);
const packageJson = JSON.parse(
  readFileSync(resolve(import.meta.dir, '../package.json'), 'utf-8')
);

describe('OTA Updates — app.json configuration', () => {
  test('should have expo-updates in dependencies', () => {
    expect(packageJson.dependencies['expo-updates']).toBeDefined();
  });

  test('should have runtimeVersion with appVersion policy', () => {
    expect(appJson.expo.runtimeVersion).toBeDefined();
    expect(appJson.expo.runtimeVersion.policy).toBe('appVersion');
  });

  test('should have updates URL pointing to EAS', () => {
    expect(appJson.expo.updates).toBeDefined();
    expect(appJson.expo.updates.url).toContain('u.expo.dev');
    expect(appJson.expo.updates.url).toContain(appJson.expo.extra.eas.projectId);
  });
});

describe('OTA Updates — eas.json channels', () => {
  test('development profile should have development channel', () => {
    expect(easJson.build.development.channel).toBe('development');
  });

  test('preview profile should have preview channel', () => {
    expect(easJson.build.preview.channel).toBe('preview');
  });

  test('production profile should have production channel', () => {
    expect(easJson.build.production.channel).toBe('production');
  });
});

describe('OTA Updates — package.json scripts', () => {
  test('should have update:preview script', () => {
    expect(packageJson.scripts['update:preview']).toContain('eas update');
    expect(packageJson.scripts['update:preview']).toContain('--channel preview');
  });

  test('should have update:production script', () => {
    expect(packageJson.scripts['update:production']).toContain('eas update');
    expect(packageJson.scripts['update:production']).toContain('--channel production');
  });
});

describe('useOTAUpdates hook', () => {
  const Updates = require('expo-updates');

  beforeEach(() => {
    // Reset __DEV__ to false for hook tests (hook skips in dev)
    (globalThis as any).__DEV__ = false;
    Updates.checkForUpdateAsync.mockClear();
    Updates.fetchUpdateAsync.mockClear();
    Updates.reloadAsync.mockClear();
  });

  test('should skip update check in dev mode', async () => {
    (globalThis as any).__DEV__ = true;
    const { useOTAUpdates } = require('@/hooks/use-ota-updates');

    const { result } = renderHook(() => useOTAUpdates());

    // Allow effects to run
    await act(async () => {});

    expect(Updates.checkForUpdateAsync).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  test('should check for update on mount when not in dev', async () => {
    Updates.checkForUpdateAsync.mockImplementation(() =>
      Promise.resolve({ isAvailable: false })
    );
    const { useOTAUpdates } = require('@/hooks/use-ota-updates');

    renderHook(() => useOTAUpdates());

    await act(async () => {});

    expect(Updates.checkForUpdateAsync).toHaveBeenCalled();
  });

  test('should download update when available', async () => {
    Updates.checkForUpdateAsync.mockImplementation(() =>
      Promise.resolve({ isAvailable: true })
    );
    Updates.fetchUpdateAsync.mockImplementation(() =>
      Promise.resolve({ isNew: true })
    );
    const { useOTAUpdates } = require('@/hooks/use-ota-updates');

    const { result } = renderHook(() => useOTAUpdates());

    await act(async () => {});

    expect(Updates.fetchUpdateAsync).toHaveBeenCalled();
    expect(result.current.status).toBe('ready');
  });

  test('should handle check error gracefully', async () => {
    Updates.checkForUpdateAsync.mockImplementation(() =>
      Promise.reject(new Error('Network error'))
    );
    const { useOTAUpdates } = require('@/hooks/use-ota-updates');

    const { result } = renderHook(() => useOTAUpdates());

    await act(async () => {});

    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toBe('Network error');
  });

  test('applyUpdate should call reloadAsync when ready', async () => {
    Updates.checkForUpdateAsync.mockImplementation(() =>
      Promise.resolve({ isAvailable: true })
    );
    Updates.fetchUpdateAsync.mockImplementation(() =>
      Promise.resolve({ isNew: true })
    );
    const { useOTAUpdates } = require('@/hooks/use-ota-updates');

    const { result } = renderHook(() => useOTAUpdates());

    await act(async () => {});

    expect(result.current.status).toBe('ready');

    await act(async () => {
      await result.current.applyUpdate();
    });

    expect(Updates.reloadAsync).toHaveBeenCalled();
  });
});
