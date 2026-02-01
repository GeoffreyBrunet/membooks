import React from 'react';
import { mock } from 'bun:test';

export function Link({ children, ...props }: any) {
  return React.createElement('View', { ...props, testID: 'link' }, children);
}

Link.displayName = 'Link';

export function useRouter() {
  return {
    push: mock(),
    replace: mock(),
    back: mock(),
    canGoBack: mock(() => false),
  };
}

export function useLocalSearchParams() {
  return {};
}

export function useSegments() {
  return [];
}
