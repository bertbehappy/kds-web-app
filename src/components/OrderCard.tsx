import React, { useState, useEffect } from 'react';
import { Order, OrderItem, STATIONS } from '../types/kds';
import { useOrderStore } from '../store/useOrderStore';
import { Clock, User, Utensils, Coffee, Truck, MessageSquare, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OrderCardProps {
  order: Order;
  stationItems: OrderItem[];
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, stationItems }) => {
  const { fulfillItem, fulfillmentMode } = useOrderStore();
  const [elapsed, setElapsed] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - order.createdAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (elapsed > 600) return 'text-red-500'; // > 10 mins
    if (elapsed > 300) return 'text-yellow-500'; // > 5 mins
    return 'text-green-400';
  };

  const handleItemClick = (itemId: string) => {
    if (fulfillmentMode === 'SINGLE') {
      fulfillItem(order.id, itemId);
    } else {
      setSelectedItems(prev => {
        const next = new Set(prev);
        if (next.has(itemId)) next.delete(itemId);
        else next.add(itemId);
        return next;
      });
    }
  };

  const handleConfirmFulfill = () => {
    selectedItems.forEach(itemId => fulfillItem(order.id, itemId));
    setSelectedItems(new Set());
  };

  const unfulfilledItems = stationItems.filter(item => !item.fulfilled);

  if (unfulfilledItems.length === 0) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden flex flex-col h-full shadow-2xl"
    >
      {/* Header */}
      <div className={cn(
        "p-3 flex justify-between items-start border-b border-slate-700",
        order.type === 'DELIVERY' ? "bg-purple-900/30" : "bg-slate-800/50"
      )}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white">#{order.orderNumber}</span>
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-bold uppercase",
              order.type === 'DINE_IN' ? "bg-blue-500 text-white" : 
              order.type === 'TAKE_OUT' ? "bg-orange-500 text-white" : "bg-purple-500 text-white"
            )}>
              {order.type === 'DINE_IN' ? '內用' : order.type === 'TAKE_OUT' ? '外帶' : '外送'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            {order.type === 'DINE_IN' && <><Utensils size={14} /> 桌號 {order.tableNumber}</>}
            {order.type === 'TAKE_OUT' && <><User size={14} /> 取餐號 {order.takeoutNumber}</>}
            {order.type === 'DELIVERY' && <><Truck size={14} /> {order.deliveryPlatform} {order.deliveryId}</>}
          </div>
        </div>
        <div className={cn("flex items-center gap-1 font-mono text-xl font-bold", getTimerColor())}>
          <Clock size={18} />
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {unfulfilledItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={cn(
              "w-full text-left p-3 rounded-lg transition-all active:scale-95 flex justify-between items-center group",
              selectedItems.has(item.id) 
                ? "bg-green-600/40 border-2 border-green-500" 
                : "bg-slate-800 hover:bg-slate-750 border-2 border-transparent"
            )}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-slate-100">{item.name}</span>
                <span className="text-2xl font-black text-orange-400">x{item.quantity}</span>
              </div>
              {item.note && (
                <div className="text-yellow-400 text-sm mt-1 flex items-center gap-1">
                  <MessageSquare size={12} /> {item.note}
                </div>
              )}
            </div>
            {fulfillmentMode === 'CONFIRM' && (
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                selectedItems.has(item.id) ? "bg-green-500 border-green-500" : "border-slate-600"
              )}>
                {selectedItems.has(item.id) && <CheckCircle2 size={16} className="text-white" />}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      {order.note && (
        <div className="p-2 bg-slate-950/50 border-t border-slate-800 text-pink-400 text-sm italic">
          備註: {order.note}
        </div>
      )}

      {fulfillmentMode === 'CONFIRM' && selectedItems.size > 0 && (
        <button
          onClick={handleConfirmFulfill}
          className="m-2 p-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={20} />
          確認完成 ({selectedItems.size})
        </button>
      )}
    </motion.div>
  );
};
