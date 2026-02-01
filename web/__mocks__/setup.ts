// Register happy-dom for full DOM support (needed by component tests)
import { GlobalRegistrator } from "@happy-dom/global-registrator";
GlobalRegistrator.register();

// In-memory localStorage mock (overrides happy-dom's localStorage)
const store = new Map<string, string>();

const localStorageMock: Storage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); },
  removeItem: (key: string) => { store.delete(key); },
  clear: () => { store.clear(); },
  get length() { return store.size; },
  key: (index: number) => [...store.keys()][index] ?? null,
};

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true, configurable: true });

// Mock fetch
globalThis.fetch = (() => { throw new Error("fetch not mocked"); }) as any;
