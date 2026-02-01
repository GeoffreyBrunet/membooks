import { mock } from 'bun:test';

const store: Record<string, string> = {};

const AsyncStorage = {
  getItem: mock((key: string) => Promise.resolve(store[key] ?? null)),
  setItem: mock((key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  }),
  removeItem: mock((key: string) => {
    delete store[key];
    return Promise.resolve();
  }),
  clear: mock(() => {
    Object.keys(store).forEach((key) => delete store[key]);
    return Promise.resolve();
  }),
  getAllKeys: mock(() => Promise.resolve(Object.keys(store))),
};

export default AsyncStorage;
