export type OrderType = 'DINE_IN' | 'TAKE_OUT' | 'DELIVERY';
export type ItemCategory = 'main' | 'drink' | 'dessert';
export type OrderStatus = 'WAITLIST' | 'PREP' | 'COMPLETED' | 'CANCELLED';
export type ItemStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  category: ItemCategory;
  modifiers?: string[];
  note?: string;
  status: ItemStatus;
  isAddOn?: boolean;
}

export interface Order {
  id: string;
  sequence: number;
  orderNumber: string;
  type: OrderType;
  tableNumber?: string;
  takeoutNumber?: string;
  deliveryPlatform?: 'Foodpanda' | 'UberEats';
  deliveryId?: string;
  createdAt: number; // timestamp
  items: OrderItem[];
  note?: string;
  status: OrderStatus;
  isAddOn?: boolean;
  priority: number; // Lower is higher priority
}

export interface StationConfig {
  id: string;
  name: string;
  categories: ItemCategory[];
}

export const STATIONS: StationConfig[] = [
  { id: 'grill', name: '煎台', categories: ['main'] },
  { id: 'bread', name: '麵包台', categories: ['main'] },
  { id: 'dessert', name: '點心台', categories: ['dessert'] },
  { id: 'drink', name: '飲料台', categories: ['drink'] },
];

export type FulfillmentMode = 'SINGLE' | 'CONFIRM';
