import React, { useState, useMemo, useEffect } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { STATIONS } from '../types/kds';
import { ChevronLeft, ChevronRight, Check, History, Archive, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const KDSItemAggregationGrid: React.FC = () => {
  const { orders, selectedStationIds, currentTab, settings, fulfillItem, undoFulfillItem } = useOrderStore();
  const [page, setPage] = useState(0);
  const [now, setNow] = useState(Date.now());

  // Update current time every second to refresh elapsed timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const itemsPerPage = {
    '3x1': 3,
    '3x2': 6,
    '4x1': 4,
    '4x2': 8,
  }[settings.layout] || 6;

  const gridClasses = {
    '3x1': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    '3x2': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    '4x1': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    '4x2': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[settings.layout] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  // Compute aggregated items
  const aggregatedItems = useMemo(() => {
    const activeCategories = STATIONS
      .filter(s => selectedStationIds.includes(s.id))
      .flatMap(s => s.categories);

    const groups: {
      [key: string]: {
        name: string;
        modifiers: string[];
        note: string;
        totalQuantity: number;
        category: string;
        occurrences: Array<{
          orderId: string;
          orderNumber: string;
          sequence: number;
          itemId: string;
          quantity: number;
          createdAt: number;
        }>;
      };
    } = {};

    orders.forEach(order => {
      // Check if order belongs to the current tab
      let matchTab = false;
      if (currentTab === 'PREP') {
        const hasPrepItems = order.items.some(item => 
          activeCategories.includes(item.category) && (item.status === 'PENDING' || (item.status === 'CANCELLED' && !item.removedFromPrep))
        );
        matchTab = hasPrepItems && order.status !== 'COMPLETED';
      } else if (currentTab === 'WAITLIST') {
        const hasVisibleItems = order.items.some(item => 
          activeCategories.includes(item.category) && (item.status === 'PENDING' || (item.status === 'CANCELLED' && !item.removedFromPrep))
        );
        matchTab = order.status === 'WAITLIST' && hasVisibleItems;
      } else {
        // COMPLETED tab
        const hasPrepItems = order.items.some(item => 
          activeCategories.includes(item.category) && (item.status === 'PENDING' || (item.status === 'CANCELLED' && !item.removedFromPrep))
        );
        matchTab = order.status === 'COMPLETED' || (!hasPrepItems && order.status !== 'WAITLIST');
      }

      if (!matchTab) return;

      order.items.forEach(item => {
        if (!activeCategories.includes(item.category)) return;

        // For PREP & WAITLIST aggregator, we aggregate PENDING items.
        // For COMPLETED aggregator, we aggregate COMPLETED items.
        let isMatch = false;
        if (currentTab === 'COMPLETED') {
          isMatch = item.status === 'COMPLETED';
        } else {
          isMatch = item.status === 'PENDING';
        }

        if (!isMatch) return;

        const modKey = (item.modifiers || []).sort().join(',');
        const noteKey = item.note || '';
        const key = `${item.name}-${modKey}-${noteKey}`;

        if (!groups[key]) {
          groups[key] = {
            name: item.name,
            modifiers: item.modifiers || [],
            note: item.note || '',
            totalQuantity: 0,
            category: item.category,
            occurrences: []
          };
        }

        groups[key].totalQuantity += item.quantity;
        groups[key].occurrences.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          sequence: order.sequence,
          itemId: item.id,
          quantity: item.quantity,
          createdAt: order.createdAt
        });
      });
    });

    // Sort aggregated clusters based on the oldest occurrence (longest waiting time)
    return Object.values(groups).sort((a, b) => {
      const minA = Math.min(...a.occurrences.map(o => o.createdAt));
      const minB = Math.min(...b.occurrences.map(o => o.createdAt));
      return minA - minB;
    });
  }, [orders, selectedStationIds, currentTab]);

  const totalPages = Math.ceil(aggregatedItems.length / itemsPerPage);
  if (page >= totalPages && totalPages > 0) {
    setPage(totalPages - 1);
  }

  const currentItems = aggregatedItems.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const handleBulkFulfill = (occurrences: typeof aggregatedItems[0]['occurrences']) => {
    occurrences.forEach(occ => {
      if (currentTab === 'COMPLETED') {
        undoFulfillItem(occ.orderId, occ.itemId);
      } else {
        fulfillItem(occ.orderId, occ.itemId);
      }
    });
  };

  if (aggregatedItems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
        <Clock size={80} className="opacity-20 animate-pulse" />
        <p className="text-3xl font-bold tracking-wider">目前分頁無彙總品項</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden pb-4 px-4 pt-2 relative">
      
      {/* Grid container */}
      <div className={`flex-1 grid ${gridClasses} gap-4 content-start min-h-0 overflow-y-auto`}>
        <AnimatePresence mode="popLayout">
          {currentItems.map((cluster) => {
            const modKey = cluster.modifiers.sort().join(',');
            const clusterKey = `${cluster.name}-${modKey}-${cluster.note}`;
            
            // Find oldest occurrence to determine emergency color
            const oldestTime = Math.min(...cluster.occurrences.map(o => o.createdAt));
            const elapsedMins = Math.floor((now - oldestTime) / 60000);

            let bgBorderClass = 'border-l-green-600';
            let bgHeaderClass = 'bg-green-50 text-green-800';
            let timerColor = 'text-green-600';
            
            if (currentTab !== 'COMPLETED') {
              if (elapsedMins >= settings.warningTime2) {
                bgBorderClass = `border-l-${settings.warningColor2}-600`;
                bgHeaderClass = 'bg-red-50 text-red-800';
                timerColor = 'text-red-600 font-bold';
              } else if (elapsedMins >= settings.warningTime1) {
                bgBorderClass = `border-l-${settings.warningColor1}-500`;
                bgHeaderClass = 'bg-orange-50 text-orange-800';
                timerColor = 'text-orange-500 font-bold';
              }
            } else {
              bgBorderClass = 'border-l-gray-400';
              bgHeaderClass = 'bg-gray-100 text-gray-600';
              timerColor = 'text-gray-400';
            }

            return (
              <motion.div
                key={clusterKey}
                layoutId={`agg-item-${clusterKey}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "bg-white rounded-xl shadow-md border border-gray-200 border-l-[12px] flex flex-col overflow-hidden h-[340px]",
                  bgBorderClass
                )}
              >
                {/* Header */}
                <div className={cn("p-4 flex items-center justify-between border-b border-gray-100 shrink-0", bgHeaderClass)}>
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className={cn(
                      "font-black tracking-tight truncate leading-tight",
                      settings.fontSize === 'large' ? "text-3xl" : "text-xl"
                    )}>
                      {cluster.name}
                    </h3>
                    
                    {cluster.modifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {cluster.modifiers.map((mod, idx) => (
                          <span 
                            key={idx} 
                            className={cn(
                              "bg-white/80 border border-gray-200/50 rounded-md font-semibold text-gray-700",
                              settings.fontSize === 'large' ? "text-base px-2.5 py-1" : "text-xs px-2 py-0.5"
                            )}
                          >
                            {mod}
                          </span>
                        ))}
                      </div>
                    )}

                    {cluster.note && (
                      <div className={cn(
                        "font-bold text-amber-700 flex items-center gap-1 mt-1",
                        settings.fontSize === 'large' ? "text-base" : "text-xs"
                      )}>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        {cluster.note}
                      </div>
                    )}
                  </div>

                  {/* Cumulative Quantity Badge */}
                  <div className={cn(
                    "rounded-xl font-black flex items-center justify-center shadow-inner border shrink-0 scale-105",
                    currentTab === 'COMPLETED' 
                      ? "bg-gray-100 border-gray-300 text-gray-700" 
                      : "bg-red-500 text-white border-red-600 animate-pulse",
                    settings.fontSize === 'large' ? "w-20 h-20 text-5xl" : "w-14 h-14 text-3xl"
                  )}>
                    {cluster.totalQuantity}
                  </div>
                </div>

                {/* Sub-orders List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/50">
                  <div className={cn(
                    "text-gray-400 font-bold uppercase tracking-wider mb-1.5 flex justify-between px-1",
                    settings.fontSize === 'large' ? "text-sm" : "text-xs"
                  )}>
                    <span>關聯訂單</span>
                    <span>等待時間 / 數量</span>
                  </div>
                  
                  {cluster.occurrences.map((occ) => {
                    const elapsed = Math.floor((now - occ.createdAt) / 1000);
                    const orderElapsedMins = Math.floor(elapsed / 60);
                    
                    return (
                      <div 
                        key={occ.orderId + '-' + occ.itemId}
                        className="flex items-center justify-between border border-gray-200 bg-white hover:bg-gray-50 p-2.5 rounded-lg shadow-sm transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "bg-gray-800 text-white font-extrabold rounded",
                            settings.fontSize === 'large' ? "px-3.5 py-1.5 text-lg" : "px-2.5 py-1 text-base"
                          )}>
                            #{occ.sequence}
                          </span>
                          <span className={cn(
                            "text-gray-400 font-medium",
                            settings.fontSize === 'large' ? "text-sm" : "text-xs"
                          )}>
                            {occ.orderNumber}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          {currentTab !== 'COMPLETED' && (
                            <span className={cn(
                              "font-semibold",
                              timerColor,
                              settings.fontSize === 'large' ? "text-lg" : "text-sm"
                            )}>
                              {orderElapsedMins}分
                            </span>
                          )}
                          <span className={cn(
                            "bg-red-50 text-red-600 border border-red-100 font-black rounded",
                            settings.fontSize === 'large' ? "px-3 py-1 text-xl" : "px-2 py-0.5 text-lg"
                          )}>
                            {occ.quantity}份
                          </span>

                          <button
                            onClick={() => {
                              if (currentTab === 'COMPLETED') {
                                undoFulfillItem(occ.orderId, occ.itemId);
                              } else {
                                fulfillItem(occ.orderId, occ.itemId);
                              }
                            }}
                            className={cn(
                              "border rounded flex flex-col items-center justify-center active:scale-95 transition-all shadow-sm leading-[1.2]",
                              currentTab === 'COMPLETED'
                                ? "border-gray-800 bg-white hover:bg-gray-100 text-gray-900 font-normal"
                                : "border-green-300 hover:border-green-400 text-green-600 bg-green-50 hover:bg-green-100",
                              settings.fontSize === 'large' ? "w-20 h-20 text-lg font-medium p-1" : "w-12 h-12 text-xs p-1"
                            )}
                          >
                            {currentTab === 'COMPLETED' ? (
                              <>
                                <span>重回</span>
                                <span>製餐</span>
                              </>
                            ) : (
                              <Check size={settings.fontSize === 'large' ? 24 : 20} className="font-black" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bulk Fulfill Footer */}
                <div className="p-3 border-t border-gray-100 bg-white shrink-0">
                  <button
                    onClick={() => handleBulkFulfill(cluster.occurrences)}
                    className={cn(
                      "w-full font-black rounded-xl py-3 flex items-center justify-center gap-2 shadow transition-all active:scale-95",
                      currentTab === 'COMPLETED'
                        ? "bg-slate-700 hover:bg-slate-800 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    )}
                  >
                    {currentTab === 'COMPLETED' ? (
                      <>
                        <History size={18} /> 整批重回製餐
                      </>
                    ) : (
                      <>
                        <Check size={18} /> 整批完成銷單 ({cluster.totalQuantity} 份)
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pagination control */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 bg-gradient-to-t from-gray-100 to-transparent pt-4 pb-1 shrink-0">
          <button 
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1 text-gray-400 disabled:opacity-30 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-200",
                  i === page ? 'bg-red-600 w-5' : 'bg-gray-400 hover:bg-gray-600'
                )}
              />
            ))}
          </div>

          <button 
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1 text-gray-400 disabled:opacity-30 hover:text-gray-800 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
};
