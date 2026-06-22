import { create } from 'zustand';
import { Order, StationConfig, FulfillmentMode, STATIONS, OrderItem } from '../types/kds';
import { generateInitialOrders } from '../services/mockData';
import { realtimeService } from '../services/realtimeService';

interface ActionToast {
  id: string;
  message: string;
  orderId: string;
  itemId?: string;
  timer?: any;
  hideUndo?: boolean;
}

interface SettingsState {
  autoPrepTime: number;
  autoFulfill: boolean;
  autoFulfillTime: number;
  showComboName: boolean;
  fontSize: 'default' | 'large' | 'small';
  layout: '3x1' | '3x2' | '4x1' | '4x2';
  notificationSound: string;
  refreshInterval: number;
  warningTime1: number;
  warningColor1: string;
  warningTime2: number;
  warningColor2: string;
}

interface OrderState {
  orders: Order[];
  selectedStationIds: string[];
  settings: SettingsState;
  fulfillmentMode: FulfillmentMode;
  currentTab: 'WAITLIST' | 'PREP' | 'COMPLETED';
  isPaused: boolean;
  activeToast: ActionToast | null;
  viewMode: 'ORDER' | 'ITEM';
  
  // Actions
  setStations: (ids: string[]) => void;
  updateSettings: (settings: Partial<SettingsState>) => void;
  setFulfillmentMode: (mode: FulfillmentMode) => void;
  setViewMode: (mode: 'ORDER' | 'ITEM') => void;
  setCurrentTab: (tab: 'WAITLIST' | 'PREP' | 'COMPLETED') => void;
  togglePause: () => void;
  addOrder: (order: Order) => void;
  fulfillItem: (orderId: string, itemId: string) => void;
  undoFulfillItem: (orderId: string, itemId: string) => void;
  removeCancelledItem: (orderId: string, itemId: string) => void;
  reorderOrders: (orderIds: string[]) => void;
  clearOrders: () => void;
  clearToast: () => void;
}

const getInitialStations = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('kds_stations') || '["dessert"]');
    const valid = saved.filter((id: string) => STATIONS.some(s => s.id === id));
    if (valid.length === 0) return ['dessert'];
    return valid;
  } catch {
    return ['dessert'];
  }
};

const getInitialSettings = (): SettingsState => {
  try {
    const saved = JSON.parse(localStorage.getItem('kds_settings') || '{}');
    return {
      autoPrepTime: 30,
      autoFulfill: false,
      autoFulfillTime: 30,
      showComboName: true,
      fontSize: 'large',
      layout: '3x1',
      notificationSound: 'default',
      refreshInterval: 5,
      warningTime1: 5,
      warningColor1: 'orange',
      warningTime2: 10,
      warningColor2: 'red',
      ...saved
    };
  } catch {
    return {
      autoPrepTime: 30,
      autoFulfill: false,
      autoFulfillTime: 30,
      showComboName: true,
      fontSize: 'large',
      layout: '3x1',
      notificationSound: 'default',
      refreshInterval: 5,
      warningTime1: 5,
      warningColor1: 'orange',
      warningTime2: 10,
      warningColor2: 'red'
    };
  }
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: generateInitialOrders(18),
  selectedStationIds: getInitialStations(),
  settings: getInitialSettings(),
  fulfillmentMode: (localStorage.getItem('kds_mode') as FulfillmentMode) || 'SINGLE',
  currentTab: 'PREP',
  isPaused: false,
  activeToast: null,
  viewMode: 'ORDER',

  setStations: (ids) => {
    localStorage.setItem('kds_stations', JSON.stringify(ids));
    set({ selectedStationIds: ids });
  },

  updateSettings: (newSettings) => set((state) => {
    const updated = { ...state.settings, ...newSettings };
    localStorage.setItem('kds_settings', JSON.stringify(updated));
    return { settings: updated };
  }),

  setFulfillmentMode: (mode) => {
    localStorage.setItem('kds_mode', mode);
    set({ fulfillmentMode: mode });
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  setCurrentTab: (tab) => set({ currentTab: tab }),
  
  togglePause: () => set(state => ({ isPaused: !state.isPaused })),

  addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),

  fulfillItem: (orderId, itemId) => {
    let completedItemName = '';
    
    set((state) => {
      const newOrders = state.orders.map(order => {
        if (order.id !== orderId) return order;
        
        const newItems = order.items.map(item => {
          if (item.id !== itemId) return item;
          completedItemName = item.name;
          return { ...item, status: 'COMPLETED' as const };
        });

        const allCompleted = newItems.every(i => i.status === 'COMPLETED' || i.status === 'CANCELLED');
        return { ...order, items: newItems, status: allCompleted ? 'COMPLETED' : order.status };
      });

      return { orders: newOrders };
    });

    // Show toast for undo
    if (completedItemName) {
      const state = get();
      if (state.activeToast?.timer) clearTimeout(state.activeToast.timer);
      
      const timer = setTimeout(() => {
        set({ activeToast: null });
      }, 5000);

      set({
        activeToast: {
          id: Date.now().toString(),
          message: `已完成 1 ${completedItemName}`,
          orderId,
          itemId,
          timer
        }
      });
    }
  },

  undoFulfillItem: (orderId, itemId) => {
    set((state) => {
      if (state.activeToast?.timer) clearTimeout(state.activeToast.timer);
      
      const newOrders = state.orders.map(order => {
        if (order.id !== orderId) return order;
        
        const newItems = order.items.map(item => {
          if (item.id !== itemId) return item;
          return { ...item, status: 'PENDING' as const };
        });

        return { ...order, items: newItems, status: 'PREP' as const }; // Revert order status if needed
      });

      return { orders: newOrders, activeToast: null };
    });
  },

  removeCancelledItem: (orderId, itemId) => {
    set((state) => {
      const newOrders = state.orders.map(order => {
        if (order.id !== orderId) return order;
        
        const newItems = order.items.map(item => {
          if (item.id !== itemId) return item;
          return { ...item, removedFromPrep: true };
        });

        return { ...order, items: newItems };
      });

      return { orders: newOrders };
    });

    // Show specific toast for return (退菜移除) without undo button
    const state = get();
    if (state.activeToast?.timer) clearTimeout(state.activeToast.timer);
    
    const timer = setTimeout(() => {
      set({ activeToast: null });
    }, 4000);

    set({
      activeToast: {
        id: Date.now().toString(),
        message: '已將前台刪除品項移出視線',
        orderId,
        itemId,
        timer,
        hideUndo: true
      }
    });
  },

  reorderOrders: (orderIds) => set((state) => {
    const orderMap = new Map(state.orders.map(o => [o.id, o]));
    const reordered = orderIds.map(id => orderMap.get(id)).filter(Boolean) as Order[];
    
    const updated = reordered.map((order, index) => ({
      ...order,
      priority: index
    }));

    const remaining = state.orders.filter(o => !orderIds.includes(o.id));
    
    return { orders: [...updated, ...remaining] };
  }),

  clearOrders: () => set({ orders: [] }),
  clearToast: () => set((state) => {
    if (state.activeToast?.timer) clearTimeout(state.activeToast.timer);
    return { activeToast: null };
  })
}));

realtimeService.subscribe((event) => {
  if (event.type === 'ORDER_CREATED') {
    useOrderStore.getState().addOrder(event.payload);
  }
});