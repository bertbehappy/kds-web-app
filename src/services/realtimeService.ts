import { Order } from '../types/kds';

type KDSCallback = (event: KDSEvent) => void;

export type KDSEvent = 
  | { type: 'ORDER_CREATED'; payload: Order }
  | { type: 'ORDER_UPDATED'; payload: Order }
  | { type: 'ORDER_COMPLETED'; payload: string } // orderId
  | { type: 'ORDER_PRIORITY_CHANGED'; payload: { orderId: string, priority: number } };

class RealtimeService {
  private subscribers: Set<KDSCallback> = new Set();

  subscribe(callback: KDSCallback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  emit(event: KDSEvent) {
    this.subscribers.forEach(cb => cb(event));
  }

  // Simulate receiving an order from POS
  simulateNewOrder(order: Order) {
    console.log('[RealtimeService] New order received:', order.orderNumber);
    this.emit({ type: 'ORDER_CREATED', payload: order });
  }
}

export const realtimeService = new RealtimeService();
