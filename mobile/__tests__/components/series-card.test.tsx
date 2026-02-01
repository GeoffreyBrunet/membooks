import { describe, it, expect, mock } from 'bun:test';
import React from 'react';
import { render } from '@testing-library/react-native';
import { SeriesCard } from '@/components/series-card';
import type { Series } from '@/types/book';

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
    secondary: '#4ECDC4',
    accent1: '#FFE66D',
  }),
}));

const mockSeries: Series = {
  id: 'series-1',
  name: 'Dune',
  author: 'Frank Herbert',
  totalVolumes: 6,
  bookType: 'novel',
  categories: ['sf'],
};

describe('SeriesCard', () => {
  it('renders series name', () => {
    const { getByText } = render(<SeriesCard series={mockSeries} ownedCount={3} readCount={2} />);
    expect(getByText('Dune')).toBeTruthy();
  });

  it('renders series author', () => {
    const { getByText } = render(<SeriesCard series={mockSeries} ownedCount={3} readCount={2} />);
    expect(getByText('Frank Herbert')).toBeTruthy();
  });

  it('renders progress text', () => {
    const { getByText } = render(<SeriesCard series={mockSeries} ownedCount={3} readCount={2} />);
    // The t() mock returns the key, so we check the key is rendered
    expect(getByText('detail.progress')).toBeTruthy();
  });

  it('renders read progress text', () => {
    const { getByText } = render(<SeriesCard series={mockSeries} ownedCount={3} readCount={2} />);
    expect(getByText('detail.readProgress')).toBeTruthy();
  });

  it('renders as a pressable link', () => {
    const { getByTestId } = render(<SeriesCard series={mockSeries} ownedCount={3} readCount={2} />);
    expect(getByTestId('link')).toBeTruthy();
  });
});
