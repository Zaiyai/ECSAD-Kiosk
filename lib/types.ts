export type MealType = 'breakfast' | 'lunch';

export type OrderStatus = 'reviewing' | 'preparing' | 'served';

export interface BreakfastSelection {
  food: string[];
  coffee: string;
  drink: string;
}

export interface LunchSelection {
  food: string[];
  fruit: string[];
  rice: string;
  drink: string;
}

export interface OrderRecord {
  id: string;
  panelistName: string;
  deviceToken: string;
  meal: MealType;
  status: OrderStatus;
  food: string[];
  coffee?: string;
  fruit?: string[];
  rice?: string;
  drink: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrdersPayload {
  panelistName: string;
  deviceToken: string;
  breakfast?: BreakfastSelection;
  lunch?: LunchSelection;
}

export interface KitchenMetrics {
  totalActive: number;
  reviewing: number;
  preparing: number;
  served: number;
  allMeals: number;
  breakfastCount: number;
  lunchCount: number;
}
