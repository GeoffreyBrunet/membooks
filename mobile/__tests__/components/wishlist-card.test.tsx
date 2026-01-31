import { describe, it, expect, mock, beforeEach } from 'bun:test';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WishlistCard } from '@/components/wishlist-card';
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
    primary: '#FF6B6B',
    primaryText: '#000000',
  }),
}));

const mockMoveToOwned = mock(() => Promise.resolve());
const mockRemoveBook = mock(() => Promise.resolve());

mock.module('@/contexts/books-context', () => ({
  useBooks: () => ({
    moveToOwned: mockMoveToOwned,
    removeBook: mockRemoveBook,
  }),
}));

const wishlistBook: Book = {
  id: 'book-1',
  title: 'Dune',
  author: 'Frank Herbert',
  bookType: 'novel',
  categories: ['sf'],
  isRead: false,
  inWishlist: true,
};

beforeEach(() => {
  mockMoveToOwned.mockReset().mockResolvedValue(undefined);
  mockRemoveBook.mockReset().mockResolvedValue(undefined);
});

describe('WishlistCard', () => {
  it('renders book title', () => {
    const { getByText } = render(<WishlistCard book={wishlistBook} />);
    expect(getByText('Dune')).toBeTruthy();
  });

  it('renders book author', () => {
    const { getByText } = render(<WishlistCard book={wishlistBook} />);
    expect(getByText('Frank Herbert')).toBeTruthy();
  });

  it('renders move to owned button', () => {
    const { getByText } = render(<WishlistCard book={wishlistBook} />);
    expect(getByText('wishlist.moveToOwned')).toBeTruthy();
  });

  it('renders remove button', () => {
    const { getByText } = render(<WishlistCard book={wishlistBook} />);
    expect(getByText('wishlist.remove')).toBeTruthy();
  });

  it('calls moveToOwned when button is pressed', async () => {
    const { getByText } = render(<WishlistCard book={wishlistBook} />);

    fireEvent.press(getByText('wishlist.moveToOwned'));

    await waitFor(() => {
      expect(mockMoveToOwned).toHaveBeenCalledWith('book-1');
    });
  });

  it('calls removeBook when remove button is pressed', async () => {
    const { getByText } = render(<WishlistCard book={wishlistBook} />);

    fireEvent.press(getByText('wishlist.remove'));

    await waitFor(() => {
      expect(mockRemoveBook).toHaveBeenCalledWith('book-1');
    });
  });
});
