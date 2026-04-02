import { create } from 'zustand';
import { Order, StationConfig, FulfillmentMode, STATIONS } from '../types/kds';
import { generateInitialOrders } from '../services/mockData';
import { realtimeService } from '../services/realtimeService';

interface OrderState {
  orders: Order[];
  selectedStationIds: string[];
  fulfillmentMode: FulfillmentMode;
  
  // Actions
  setStations: (ids: string[]) => void;
  setFulfillmentMode: (mode: FulfillmentMode) => void;
  addOrder: (order: Order) => void;
  fulfillItem: (orderId: string, itemId: string) => void;
  reorderOrders: (orderIds: string[]) => void;
  clearOrders: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: generateInitialOrders(12),
  selectedStationIds: JSON.parse(localStorage.getItem('kds_stations') || '[]'),
  fulfillmentMode: (localStorage.getItem('kds_mode') as FulfillmentMode) || 'SINGLE',

  setStations: (ids) => {
    localStorage.setItem('kds_stations', JSON.stringify(ids));
    set({ selectedStationIds: ids });
  },

  setFulfillmentMode: (mode) => {
    localStorage.setItem('kds_mode', mode);
    set({ fulfillmentMode: mode });
  },

  addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),

  fulfillItem: (orderId, itemId) => set((state) => {
    const newOrders = state.orders.map(order => {
      if (order.id !== orderId) return order;
      
      const newItems = order.items.map(item => {
        if (item.id !== itemId) return item;
        return { ...item, fulfilled: true };
      });

      return { ...order, items: newItems };
    });

    // Filter out orders that have no unfulfilled items for the current stations
    // This logic is actually better handled in the selector/component level 
    // but we update the state here.
    return { orders: newOrders };
  }),

  reorderOrders: (orderIds) => set((state) => {
    const orderMap = new Map(state.orders.map(o => [o.id, o]));
    const reordered = orderIds.map(id => orderMap.get(id)).filter(Boolean) as Order[];
    
    // Update priorities based on new order
    const updated = reordered.map((order, index) => ({
      ...order,
      priority: index // Simple priority based on index for demo
    }));

    // Keep orders that weren't in the reorder list (if any)
    const remaining = state.orders.filter(o => !orderIds.includes(o.id));
    
    return { orders: [...updated, ...remaining] };
  }),

  clearOrders: () => set({ orders: [] }),
}));

// Initialize realtime listener
realtimeService.subscribe((event) => {
  if (event.type === 'ORDER_CREATED') {
    useOrderStore.getState().addOrder(event.payload);
  }
});
