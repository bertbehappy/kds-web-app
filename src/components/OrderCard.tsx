import React, { useState, useEffect } from 'react';
import { Order, OrderItem } from '../types/kds';
import { useOrderStore } from '../store/useOrderStore';
import { Hourglass, ChevronDown, ChevronUp, Check, XCircle, Undo2, X } from 'lucide-react';
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
  const { fulfillItem, undoFulfillItem, removeCancelledItem, settings, currentTab } = useOrderStore();
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
  
  const isPrepView = currentTab === 'PREP' || currentTab === 'WAITLIST';

  const completedItemsToRender = isPrepView 
    ? [] 
    : stationItems.filter(item => item.status === 'COMPLETED');

  const cancelledItemsToRender = isPrepView
    ? stationItems.filter(item => item.status === 'CANCELLED' && !item.removedFromPrep)
    : stationItems.filter(item => item.status === 'CANCELLED');
  
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
      <div className="p-4 pb-3 flex flex-col gap-3 border-b-2 border-gray-100 bg-[#fafafa]">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div className="flex items-end gap-3 leading-none pr-2">
            <span className={cn("font-bold text-gray-600", settings.fontSize === 'large' ? "text-3xl" : "text-xl")}>{order.sequence}.</span>
            <span className={cn("font-bold text-gray-700", settings.fontSize === 'large' ? "text-3xl" : "text-xl")}>{order.type === 'DINE_IN' ? '內用' : order.type === 'TAKE_OUT' ? '外帶' : '外送'}</span>
            <span className={cn(
              "font-black text-gray-900 border-2 border-gray-400 rounded-md leading-none shrink-0 tracking-wider bg-white shadow-sm",
              settings.fontSize === 'large' ? "text-4xl px-4 py-1.5" : "text-2xl px-2.5 py-1"
            )}>
              {order.orderNumber}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {currentTab === 'WAITLIST' && stationItems.every(i => i.status === 'CANCELLED') ? (
              <button
                onClick={() => {
                  stationItems.forEach(i => {
                    if (i.status === 'CANCELLED') removeCancelledItem(order.id, i.id);
                  });
                }}
                className={cn(
                  "font-bold bg-white text-red-600 border-2 border-red-200 hover:bg-red-50 rounded flex items-center justify-center gap-1 shadow-sm transition-colors",
                  settings.fontSize === 'large' ? "px-4 py-2 text-xl" : "px-3 py-1.5 text-lg"
                )}
              >
                <X size={settings.fontSize === 'large' ? 24 : 20} className="stroke-[3]" /> 移除顯示
              </button>
            ) : currentTab === 'WAITLIST' && pendingItems.length > 0 ? (
              <button
                onClick={() => {
                  pendingItems.forEach(i => fulfillItem(order.id, i.id));
                }}
                className={cn(
                  "font-bold bg-white text-green-600 border-2 border-green-500 hover:bg-green-50 rounded flex items-center justify-center gap-1 shadow-sm transition-colors",
                  settings.fontSize === 'large' ? "px-4 py-2 text-xl" : "px-3 py-1.5 text-lg"
                )}
              >
                <Check size={settings.fontSize === 'large' ? 24 : 20} className="stroke-[3]" /> 全部完成 {pendingItems.length}
              </button>
            ) : (
              <div className={cn(
                "flex items-center gap-1.5 font-bold whitespace-nowrap", 
                getTimerTextColor(),
                settings.fontSize === 'large' ? "text-3xl" : "text-xl"
              )}>
                <Hourglass size={settings.fontSize === 'large' ? 26 : 20} />
                {elapsedMins}分
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <span className={cn(
            "bg-blue-100 text-blue-900 rounded font-bold shadow-sm",
            settings.fontSize === 'large' ? "px-5 py-2 text-2xl" : "px-3 py-1.5 text-lg"
          )}>
            {order.tableNumber || order.takeoutNumber || '-'}
          </span>
          {order.isAddOn && (
            <span className={cn(
              "bg-amber-600 text-white rounded-full font-bold shadow-sm",
              settings.fontSize === 'large' ? "px-4 py-1.5 text-lg" : "px-3 py-1 text-sm"
            )}>
              加點 1
            </span>
          )}
          {order.status === 'CANCELLED' && (
            <span className={cn(
              "text-red-600 flex items-center gap-1.5 font-bold ml-auto",
              settings.fontSize === 'large' ? "text-xl" : "text-base"
            )}>
              <XCircle size={settings.fontSize === 'large' ? 24 : 18} /> 已取消
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
          <span className={cn("font-bold tracking-wide", settings.fontSize === 'large' ? "text-lg" : "text-sm")}>備註 {order.note ? '' : '(無)'}</span>
          {notesOpen ? <ChevronUp size={settings.fontSize === 'large' ? 22 : 18} /> : <ChevronDown size={settings.fontSize === 'large' ? 22 : 18} />}
        </button>
        <AnimatePresence>
          {notesOpen && order.note && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn(
                "mt-2 border-2 border-gray-300 text-gray-700 font-medium bg-white rounded shadow-sm",
                settings.fontSize === 'large' ? "p-4 text-xl min-h-[90px]" : "p-3 text-base min-h-[70px]"
              )}
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
              settings.fontSize === 'large' ? "w-14 h-14 text-4xl" : "w-10 h-10 text-xl"
            )}>
              {item.quantity}
            </div>
            <div className="flex-1">
              <div className={cn(
                "font-bold text-gray-900 leading-tight tracking-tight",
                settings.fontSize === 'large' ? "text-3xl mb-2" : "text-lg mb-1"
              )}>
                {item.name}
              </div>
              {item.modifiers?.map((m, i) => (
                <div key={i} className={cn("text-gray-500 font-medium", settings.fontSize === 'large' ? "text-xl mb-1" : "text-sm")}>{m}</div>
              ))}
              {item.note && (
                <div className={cn("text-amber-700 font-bold flex items-center gap-1.5", settings.fontSize === 'large' ? "text-xl mt-1.5" : "text-sm mt-1")}>
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

        {/* Render Cancelled/Refunded Items (退菜異動) */}
        {cancelledItemsToRender.map((item, idx) => (
          <div key={item.id} className={cn("py-4 flex items-start gap-4 relative", (idx > 0 || pendingItems.length > 0) && "border-t-2 border-gray-100")}>
            {/* 刪除線 overlay */}
            <div className="absolute top-[28px] left-0 right-24 h-[3px] bg-red-600/80 z-10 rounded-full" />
            
            <div className={cn(
              "shrink-0 flex items-center justify-center font-bold border-2 border-red-300 rounded-md bg-red-50 text-red-700 shadow-sm z-20",
              settings.fontSize === 'large' ? "w-14 h-14 text-4xl" : "w-10 h-10 text-xl"
            )}>
              {item.quantity}
            </div>
            
            <div className="flex-1 z-20">
              <div className={cn(
                "font-bold text-red-600 line-through leading-tight tracking-tight",
                settings.fontSize === 'large' ? "text-3xl mb-2" : "text-lg mb-1"
              )}>
                {item.name}
              </div>
              {item.modifiers?.map((m, i) => (
                <div key={i} className={cn("text-red-500 line-through font-medium", settings.fontSize === 'large' ? "text-xl mb-1" : "text-sm")}>
                  {m}
                </div>
              ))}
              {item.note && (
                <div className={cn("text-red-400 font-bold", settings.fontSize === 'large' ? "text-xl mt-1.5" : "text-sm mt-1")}>
                  {item.note}
                </div>
              )}
            </div>

            {isPrepView ? (
              <button
                onClick={() => removeCancelledItem(order.id, item.id)}
                className={cn(
                  "shrink-0 border-2 border-red-400 rounded-xl shadow-sm bg-red-50 hover:bg-red-100 text-red-600 font-black tracking-wide flex items-center justify-center active:scale-95 transition-all z-20",
                  settings.fontSize === 'large' ? "w-20 h-16 text-xl" : "w-16 h-12 text-base"
                )}
              >
                移除
              </button>
            ) : (
              <span className="text-red-600 font-black self-center px-3 py-1 bg-red-50 border border-red-200 rounded-md text-base z-20">
                已退菜
              </span>
            )}
          </div>
        ))}

        {/* Render Completed Items (僅在已出餐區顯示) */}
        {completedItemsToRender.map((item, idx) => (
          <div key={item.id} className={cn("py-4 flex items-start gap-4 opacity-50 relative group", (idx > 0 || pendingItems.length > 0 || cancelledItemsToRender.length > 0) && "border-t-2 border-gray-100")}>
            <div className={cn(
              "flex items-center justify-center font-bold border-2 border-gray-300 rounded-md bg-gray-50 text-gray-800 shadow-sm",
              settings.fontSize === 'large' ? "w-14 h-14 text-4xl" : "w-10 h-10 text-xl"
            )}>
              {item.quantity}
            </div>
            <div className="flex-1">
               <div className={cn(
                 "font-bold text-gray-700 leading-tight tracking-tight",
                 settings.fontSize === 'large' ? "text-3xl mb-2" : "text-lg mb-1"
               )}>
                 {item.name}
               </div>
               {item.modifiers?.map((m, i) => (
                <div key={i} className={cn("text-gray-400 font-medium", settings.fontSize === 'large' ? "text-xl mb-1" : "text-sm")}>{m}</div>
              ))}
              {item.note && (
                <div className={cn("text-gray-400 font-bold", settings.fontSize === 'large' ? "text-xl mt-1.5" : "text-sm mt-1")}>{item.note}</div>
              )}
            </div>
            <button
              onClick={() => undoFulfillItem(order.id, item.id)}
              className={cn(
                "shrink-0 border border-gray-800 rounded bg-white flex flex-col items-center justify-center active:scale-95 hover:bg-gray-100 transition-colors text-gray-900 leading-[1.2]",
                settings.fontSize === 'large' ? "w-20 h-20 text-xl font-medium" : "w-12 h-12 text-xs font-normal"
              )}
            >
              <span>重回</span>
              <span>製餐</span>
            </button>
          </div>
        ))}
      </div>

      {/* Footer Button */}
      {currentTab !== 'WAITLIST' && pendingItems.length > 0 && (
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
