export type OrderType = 'DINE_IN' | 'TAKE_OUT' | 'DELIVERY';
export type ItemCategory = 'main' | 'drink' | 'dessert';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  category: ItemCategory;
  note?: string;
  fulfilled: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  tableNumber?: string;
  takeoutNumber?: string;
  deliveryPlatform?: 'Foodpanda' | 'UberEats';
  deliveryId?: string;
  createdAt: number; // timestamp
  items: OrderItem[];
  note?: string;
  priority: number; // Lower is higher priority
}

export interface StationConfig {
  id: string;
  name: string;
  categories: ItemCategory[];
}

export const STATIONS: StationConfig[] = [
  { id: 'main_station', name: '主餐站', categories: ['main'] },
  { id: 'drink_station', name: '飲料站', categories: ['drink'] },
  { id: 'dessert_station', name: '甜點站', categories: ['dessert'] },
];

export type FulfillmentMode = 'SINGLE' | 'CONFIRM';
