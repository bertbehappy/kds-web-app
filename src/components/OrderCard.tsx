import React, { useState, useEffect } from 'react';
import { Order, OrderItem } from '../types/kds';
import { useOrderStore } from '../store/useOrderStore';
import { Hourglass, ChevronDown, ChevronUp, Check, XCircle, Undo2 } from 'lucide-react';
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
  const { fulfillItem, undoFulfillItem, settings } = useOrderStore();
  const [elapsed, setElapsed] = useState(0);
  const [notesOpen, setNotesOpen] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - order.createdAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const elapsedMins = Math.floor(elapsed / 60);

  const getTimerBorderColor = () => {
    if (elapsedMins >= settings.warningTime2) return `border-l-${settings.warningColor2}-600`;
    if (elapsedMins >= settings.warningTime1) return `border-l-${settings.warningColor1}-500`;
    return 'border-l-green-600';
  };

  const getTimerTextColor = () => {
    if (elapsedMins >= settings.warningTime2) return `text-${settings.warningColor2}-600`;
    if (elapsedMins >= settings.warningTime1) return `text-${settings.warningColor1}-500`;
    return 'text-green-600';
  };

  const pendingItems = stationItems.filter(item => item.status === 'PENDING');
  const completedItems = stationItems.filter(item => item.status === 'COMPLETED' || item.status === 'CANCELLED');
  
  if (stationItems.length === 0) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "bg-white border-2 border-gray-200 shadow-sm flex flex-col h-[calc(100%-1rem)] mt-2 mx-1 border-l-[8px]",
        getTimerBorderColor()
      )}
    >
      {/* Header */}
      <div className="p-4 pb-3 flex flex-col gap-3 border-b-2 border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex items-end gap-3 leading-none">
            <span className="text-2xl font-bold text-gray-600">{order.sequence}.</span>
            <span className="text-2xl font-bold text-gray-700">{order.type === 'DINE_IN' ? '內用' : order.type === 'TAKE_OUT' ? '外帶' : '外送'}</span>
            <span className="text-3xl font-black text-gray-900 border-2 border-gray-400 px-3 py-1 rounded-md leading-none shrink-0 tracking-wider bg-gray-50">
              {order.orderNumber}
            </span>
          </div>
          <div className={cn("flex items-center gap-1.5 font-bold text-2xl whitespace-nowrap", getTimerTextColor())}>
            <Hourglass size={24} />
            {elapsedMins}分
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-4 py-1.5 bg-blue-100 text-blue-900 text-xl rounded font-bold shadow-sm">
            {order.tableNumber || order.takeoutNumber || '-'}
          </span>
          {order.isAddOn && (
            <span className="px-3 py-1 bg-amber-600 text-white text-base rounded-full font-bold shadow-sm">
              加點 1
            </span>
          )}
          {order.status === 'CANCELLED' && (
            <span className="text-red-600 flex items-center gap-1.5 font-bold text-lg ml-auto">
              <XCircle size={22} /> 已取消
            </span>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="px-4 py-2 bg-gray-50">
        <button 
          onClick={() => setNotesOpen(!notesOpen)}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 flex items-center justify-between rounded shadow-sm transition-colors"
        >
          <span className="text-base font-bold tracking-wide">備註 {order.note ? '' : '(無)'}</span>
          {notesOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        <AnimatePresence>
          {notesOpen && order.note && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 p-3 border-2 border-gray-300 text-gray-700 text-lg font-medium bg-white rounded shadow-sm min-h-[80px]"
            >
              {order.note}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-0 relative">
        {order.status === 'CANCELLED' && (
           <div className="absolute inset-0 bg-gray-50/90 z-20 flex items-center justify-center">
              <button 
                onClick={() => {
                   // mock remove display
                   pendingItems.forEach(i => fulfillItem(order.id, i.id));
                }}
                className="text-red-600 flex items-center gap-2 bg-white px-6 py-3 border-2 border-red-200 shadow-md rounded-xl font-bold text-xl hover:bg-red-50 transition-colors"
              >
                <XCircle size={28} /> 移除顯示
              </button>
           </div>
        )}

        {/* Render Pending Items */}
        {pendingItems.map((item, idx) => (
          <div key={item.id} className={cn("py-4 flex items-start gap-4", idx > 0 && "border-t-2 border-gray-100")}>
            <div className={cn(
              "shrink-0 flex items-center justify-center font-bold border-2 border-gray-300 rounded-md bg-gray-50 text-gray-800 shadow-sm",
              settings.fontSize === 'large' ? "w-12 h-12 text-3xl" : "w-10 h-10 text-xl"
            )}>
              {item.quantity}
            </div>
            <div className="flex-1">
              <div className={cn(
                "font-bold text-gray-900 leading-tight tracking-tight",
                settings.fontSize === 'large' ? "text-3xl mb-2" : "text-xl mb-1"
              )}>
                {item.name}
              </div>
              {item.modifiers?.map((m, i) => (
                <div key={i} className={cn("text-gray-500 font-medium", settings.fontSize === 'large' ? "text-lg mb-1" : "text-sm")}>{m}</div>
              ))}
              {item.note && (
                <div className={cn("text-amber-700 font-bold flex items-center gap-1.5", settings.fontSize === 'large' ? "text-lg mt-1.5" : "text-sm mt-1")}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  {item.note}
                </div>
              )}
            </div>
            <button
              onClick={() => fulfillItem(order.id, item.id)}
              className={cn(
                "shrink-0 border-4 border-gray-300 rounded-xl shadow-sm hover:bg-green-50 transition-colors flex items-center justify-center group active:scale-95",
                settings.fontSize === 'large' ? "w-16 h-16" : "w-12 h-12"
              )}
            >
              <Check size={settings.fontSize === 'large' ? 40 : 28} className="text-transparent group-hover:text-green-300 transition-colors" />
            </button>
          </div>
        ))}

        {/* Render Completed/Cancelled Items with Strikethrough */}
        {completedItems.map((item, idx) => (
          <div key={item.id} className={cn("py-4 flex items-start gap-4 opacity-40 relative group", (idx > 0 || pendingItems.length > 0) && "border-t-2 border-gray-100")}>
             <div className="absolute top-[32px] left-0 right-20 h-[3px] bg-red-600 z-10 rounded-full" />
            <div className={cn(
              "flex items-center justify-center font-bold border-2 border-gray-300 rounded-md bg-gray-50 text-gray-800 shadow-sm",
              settings.fontSize === 'large' ? "w-12 h-12 text-3xl" : "w-10 h-10 text-xl"
            )}>
              {item.quantity}
            </div>
            <div className="flex-1">
               <div className={cn(
                 "font-bold text-gray-900 leading-tight tracking-tight",
                 settings.fontSize === 'large' ? "text-3xl mb-2" : "text-xl mb-1"
               )}>
                 {item.name}
               </div>
               {item.modifiers?.map((m, i) => (
                <div key={i} className={cn("text-gray-500 font-medium", settings.fontSize === 'large' ? "text-lg mb-1" : "text-sm")}>{m}</div>
              ))}
              {item.note && (
                <div className={cn("text-gray-500 font-bold", settings.fontSize === 'large' ? "text-lg mt-1.5" : "text-sm mt-1")}>{item.note}</div>
              )}
            </div>
            <button
              title="取消完成"
              onClick={() => undoFulfillItem(order.id, item.id)}
              className={cn(
                "shrink-0 border-4 border-gray-300 rounded-xl shadow-sm bg-gray-100 flex items-center justify-center active:scale-95",
                settings.fontSize === 'large' ? "w-16 h-16" : "w-12 h-12"
              )}
            >
              <Check size={settings.fontSize === 'large' ? 40 : 28} className="text-green-600 group-hover:hidden" />
              <Undo2 size={settings.fontSize === 'large' ? 32 : 24} className="text-gray-600 hidden group-hover:block" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer Button */}
      {pendingItems.length > 0 && (
         <div className="p-3 border-t-2 border-gray-100 mt-auto shrink-0 bg-gray-50">
           <button 
             onClick={() => {
               pendingItems.forEach(item => fulfillItem(order.id, item.id));
             }}
             className="w-full py-3.5 flex justify-center items-center gap-2 text-green-700 bg-green-50 hover:bg-green-100 font-bold text-xl rounded-lg transition-colors border-2 border-green-200 shadow-sm active:scale-95"
           >
             <Check size={28} /> 標記全部完成 ({pendingItems.length})
           </button>
         </div>
      )}
    </motion.div>
  );
};
