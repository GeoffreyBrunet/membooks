// In-memory localStorage mock
const store = new Map<string, string>();

const localStorageMock: Storage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); },
  removeItem: (key: string) => { store.delete(key); },
  clear: () => { store.clear(); },
  get length() { return store.size; },
  key: (index: number) => [...store.keys()][index] ?? null,
};

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

// Mock fetch
globalThis.fetch = (() => { throw new Error("fetch not mocked"); }) as any;

// Mock window.location
const locationMock = { href: "", assign: () => {} };
Object.defineProperty(globalThis, "window", {
  value: { location: locationMock },
  writable: true,
});
