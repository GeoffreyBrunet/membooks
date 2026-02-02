import { mock } from 'bun:test';

export const checkForUpdateAsync = mock(() =>
  Promise.resolve({ isAvailable: false })
);

export const fetchUpdateAsync = mock(() =>
  Promise.resolve({ isNew: true })
);

export const reloadAsync = mock(() => Promise.resolve());
