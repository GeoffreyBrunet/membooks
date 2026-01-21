/**
 * Mock Data - Books
 */

import type { Book, Series } from '@/types/book';

export const mockSeries: Series[] = [
  {
    id: 'series-1',
    name: 'Harry Potter',
    totalVolumes: 7,
    bookType: 'novel',
    categories: ['fantasy', 'adventure'],
  },
  {
    id: 'series-2',
    name: 'Le Seigneur des Anneaux',
    totalVolumes: 3,
    bookType: 'novel',
    categories: ['fantasy', 'adventure'],
  },
  {
    id: 'series-3',
    name: 'Dune',
    totalVolumes: 6,
    bookType: 'novel',
    categories: ['sf'],
  },
  {
    id: 'series-4',
    name: 'One Piece',
    totalVolumes: 109,
    bookType: 'manga',
    categories: ['adventure', 'fantasy'],
  },
];

export const mockBooks: Book[] = [
  // Harry Potter series (owned: 4/7)
  {
    id: 'book-1',
    title: "Harry Potter à l'école des sorciers",
    author: 'J.K. Rowling',
    bookType: 'novel',
    categories: ['fantasy', 'adventure'],
    seriesId: 'series-1',
    volumeNumber: 1,
  },
  {
    id: 'book-2',
    title: 'Harry Potter et la Chambre des Secrets',
    author: 'J.K. Rowling',
    bookType: 'novel',
    categories: ['fantasy', 'adventure'],
    seriesId: 'series-1',
    volumeNumber: 2,
  },
  {
    id: 'book-3',
    title: "Harry Potter et le Prisonnier d'Azkaban",
    author: 'J.K. Rowling',
    bookType: 'novel',
    categories: ['fantasy', 'adventure'],
    seriesId: 'series-1',
    volumeNumber: 3,
  },
  {
    id: 'book-4',
    title: 'Harry Potter et la Coupe de Feu',
    author: 'J.K. Rowling',
    bookType: 'novel',
    categories: ['fantasy', 'adventure'],
    seriesId: 'series-1',
    volumeNumber: 4,
  },
  // Le Seigneur des Anneaux (owned: 2/3)
  {
    id: 'book-5',
    title: "La Communauté de l'Anneau",
    author: 'J.R.R. Tolkien',
    bookType: 'novel',
    categories: ['fantasy', 'adventure'],
    seriesId: 'series-2',
    volumeNumber: 1,
  },
  {
    id: 'book-6',
    title: 'Les Deux Tours',
    author: 'J.R.R. Tolkien',
    bookType: 'novel',
    categories: ['fantasy', 'adventure'],
    seriesId: 'series-2',
    volumeNumber: 2,
  },
  // Dune (owned: 1/6)
  {
    id: 'book-7',
    title: 'Dune',
    author: 'Frank Herbert',
    bookType: 'novel',
    categories: ['sf'],
    seriesId: 'series-3',
    volumeNumber: 1,
  },
  // One Piece (owned: 3/109)
  {
    id: 'book-11',
    title: 'One Piece - Tome 1',
    author: 'Eiichiro Oda',
    bookType: 'manga',
    categories: ['adventure', 'fantasy'],
    seriesId: 'series-4',
    volumeNumber: 1,
  },
  {
    id: 'book-12',
    title: 'One Piece - Tome 2',
    author: 'Eiichiro Oda',
    bookType: 'manga',
    categories: ['adventure', 'fantasy'],
    seriesId: 'series-4',
    volumeNumber: 2,
  },
  {
    id: 'book-13',
    title: 'One Piece - Tome 3',
    author: 'Eiichiro Oda',
    bookType: 'manga',
    categories: ['adventure', 'fantasy'],
    seriesId: 'series-4',
    volumeNumber: 3,
  },
  // Standalone books
  {
    id: 'book-8',
    title: '1984',
    author: 'George Orwell',
    bookType: 'novel',
    categories: ['sf', 'thriller'],
  },
  {
    id: 'book-9',
    title: 'Le Petit Prince',
    author: 'Antoine de Saint-Exupéry',
    bookType: 'novel',
    categories: ['sliceOfLife'],
  },
  {
    id: 'book-10',
    title: "L'Étranger",
    author: 'Albert Camus',
    bookType: 'novel',
    categories: ['sliceOfLife'],
  },
];
