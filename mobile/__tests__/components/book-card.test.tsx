import { describe, it, expect, mock } from 'bun:test';
import React from 'react';
import { render } from '@testing-library/react-native';
import { BookCard } from '@/components/book-card';
import type { Book } from '@/types/book';

// Mock hooks
mock.module('@/hooks/use-theme-colors', () => ({
  useThemeColors: () => ({
    background: '#F5F5F0',
    backgroundSecondary: '#FFFFFF',
    text: '#000000',
    textSecondary: '#444444',
    border: '#000000',
    shadow: '#000000',
    secondary: '#4ECDC4',
    accent1: '#FFE66D',
  }),
}));

// expo-router Link is already mocked globally

const readBook: Book = {
  id: 'book-1',
  title: 'Dune',
  author: 'Frank Herbert',
  bookType: 'novel',
  categories: ['sf'],
  isRead: true,
  inWishlist: false,
};

const unreadBook: Book = {
  id: 'book-2',
  title: 'Foundation',
  author: 'Isaac Asimov',
  bookType: 'novel',
  categories: ['sf'],
  isRead: false,
  inWishlist: false,
};

describe('BookCard', () => {
  it('renders book title', () => {
    const { getByText } = render(<BookCard book={readBook} />);
    expect(getByText('Dune')).toBeTruthy();
  });

  it('renders book author', () => {
    const { getByText } = render(<BookCard book={readBook} />);
    expect(getByText('Frank Herbert')).toBeTruthy();
  });

  it('shows read badge for read books', () => {
    const { getByText } = render(<BookCard book={readBook} />);
    expect(getByText('status.read')).toBeTruthy();
  });

  it('shows unread badge for unread books', () => {
    const { getByText } = render(<BookCard book={unreadBook} />);
    expect(getByText('status.unread')).toBeTruthy();
  });

  it('renders as a pressable link', () => {
    const { getByTestId } = render(<BookCard book={readBook} />);
    // The Link component wraps the Pressable. Our mock renders as a View with testID='link'
    expect(getByTestId('link')).toBeTruthy();
  });
});
