import { mock } from 'bun:test';

const mockDb = {
  execAsync: mock(),
  getAllAsync: mock(() => Promise.resolve([])),
  getFirstAsync: mock(() => Promise.resolve(null)),
  runAsync: mock(),
};

export function openDatabaseAsync() {
  return Promise.resolve(mockDb);
}

export const __mockDb = mockDb;
