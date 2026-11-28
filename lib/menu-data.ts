import type { BreakfastSelection, LunchSelection, OrderStatus } from './types';

export interface FoodOption {
  id: string;
  label: string;
  description: string;
  image: string;
  alt: string;
}

export interface SimpleOption {
  id: string;
  label: string;
  description?: string;
}

export const ECSAD_LOGO_SRC = '/ecsad-logo.png';

export const STATUS_PREVIEW_IMAGES = {
  breakfast:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAULgaaKZX3_gsdo3W8yzmx8HCw8O8NkWLrqhwyqACYYN398b2GRgZJl5FcgmApcJk6c6KnBtsAnJ-tuaWVp7cKuOk-oJRaJoQmBYHKLmStNVIEQvA0ofMMgX9qngrcH6Yhjhwqrp95_YlNLyluyJXAt917qvJPdkwi9UYX81errPoAJcKsUXNC79HJHMRnTS7__gd1jvwVLedX2msdYbZw3SkXgFR5WJ1dDKbxv80',
  lunch:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDQPH2HqBl9al3r4gKkGlXnjHPp2xraXvkdItYHQRbasAI2OjoWyUk3cRno5GSZITqR4UpboEpqsmC__KbtCce0yEYmOmirmixTKLcbTyIa_V5ZAk4Yx2W90bE7txXoKoslnFysxxzgLcORhQaN3TOCtah_iXFtltrcYQb3LSv5dzTMYSgnGoVyDiiYHwmTfXJallAIByuiVofR67ZKIslaIpYgjEOhXBBQcWOwVvQ',
} as const;

export const BREAKFAST_FOOD_OPTIONS: FoodOption[] = [
  {
    id: 'Pandesal',
    label: 'Pandesal',
    description: 'Classic Filipino bread roll',
    image:
      '/assets/pandesal.webp',
    alt: 'Warm, freshly baked Filipino pandesal bread rolls in a woven basket',
  },
  {
    id: 'Pancake',
    label: 'Pancake',
    description: 'Golden stack of buttermilk pancakes',
    image:
      '/assets/pancake.webp',
    alt: 'Fluffy golden buttermilk pancakes stacked neatly on a ceramic plate with butter and maple syrup',
  },
  {
    id: 'Scrambled Egg',
    label: 'Scrambled Egg',
    description: 'Soft-folded, seasoned to order',
    image: '/assets/eggs.png',
    alt: 'Soft, creamy folded scrambled eggs garnished with fresh chopped chives on a white ceramic plate',
  },
];

export const BREAKFAST_COFFEE_OPTIONS: SimpleOption[] = [
  { id: 'Coffee Black', label: 'Coffee Black', description: '' },
  { id: 'Coffee White', label: 'Coffee White', description: '' },
  { id: 'Coffee Mix', label: 'Coffee Mix', description: '' },
  { id: 'No Coffee', label: 'No Coffee', description: '' },
];

export const BREAKFAST_DRINK_OPTIONS: SimpleOption[] = [
  { id: 'Water', label: 'Water' },
  { id: 'Orange Juice', label: 'Orange Juice' },
];

export const LUNCH_FOOD_OPTIONS: FoodOption[] = [
  {
    id: 'Shanghai',
    label: 'Shanghai',
    description: 'Savory fried spring rolls',
    image: '/assets/shanghai.jxl',
    alt: 'Crispy golden lumpiang shanghai spring rolls',
  },
  {
    id: 'Siomai Steamed',
    label: 'Siomai Steamed',
    description: 'Pork dumplings',
    image: '/assets/siomai.jxl',
    alt: 'Steamed pork siomai dumplings',
  },
  {
    id: 'Buchi',
    label: 'Buchi',
    description: 'Sweet sesame lotus pastry',
    image: '/assets/buchi.webp',
    alt: 'Sweet sesame buchi pastry',
  },
  {
    id: 'Chicken',
    label: 'Chicken',
    description: 'Crispy golden fried chicken',
    image: '/assets/chicken.jpg',
    alt: 'Crispy golden fried chicken',
  },
];

export const LUNCH_FRUIT_OPTIONS: SimpleOption[] = [
  { id: 'Apples', label: 'Apples', description: 'Fresh sliced apples' },
  { id: 'Oranges', label: 'Oranges', description: 'Fresh citrus wedges' },
  { id: 'Bananas', label: 'Bananas', description: 'Fresh sweet banana' },
];

export const LUNCH_RICE_OPTIONS: SimpleOption[] = [
  { id: 'Plain Rice', label: 'Plain Rice', description: '' },
  { id: 'Chaopan Rice', label: 'Chaopan Rice', description: 'Fried rice & egg' },
];

export const LUNCH_DRINK_OPTIONS: SimpleOption[] = [
  { id: 'Coke', label: 'Coke' },
  { id: 'Royal', label: 'Royal' },
  { id: 'Water', label: 'Water' },
];

export const DEFAULT_BREAKFAST_SELECTION: BreakfastSelection = {
  food: ['Pandesal', 'Scrambled Egg'],
  coffee: 'Coffee Black',
  drink: 'Water',
};

export const DEFAULT_LUNCH_SELECTION: LunchSelection = {
  food: ['Shanghai', 'Siomai Steamed'],
  fruit: [],
  rice: 'Chaopan Rice',
  drink: 'Royal',
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  reviewing: 'Reviewing',
  preparing: 'Preparing',
  served: 'Served',
  voided: 'Voided',
};

export function formatRelativeTime(isoDate: string, nowMs = Date.now()): string {
  const createdMs = new Date(isoDate).getTime();
  const diffSeconds = Math.max(0, Math.floor((nowMs - createdMs) / 1000));
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}h ago`;
}
