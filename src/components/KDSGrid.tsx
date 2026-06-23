import React, { useState, useMemo } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { STATIONS, Order } from '../types/kds';
import { OrderCard } from './OrderCard';
import { ChevronLeft, ChevronRight, ListFilter, GripVertical, CircleDashed } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  order: Order & { stationItems: any[] };
}

const SortableOrderCard: React.FC<SortableItemProps> = ({ order }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group h-full">
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1.5 bg-white/90 shadow text-gray-400 hover:text-gray-800 transition-opacity border border-gray-200 rounded-sm"
      >
        <GripVertical size={20} />
      </div>
      <OrderCard order={order} stationItems={order.stationItems} />
    </div>
  );
};

export const KDSGrid: React.FC = () => {
  const { orders, selectedStationIds, reorderOrders, currentTab, settings } = useOrderStore();
  const [page, setPage] = useState(0);

  // Dynamic grid configuration
  const gridClasses = {
    '3x1': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    '3x2': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    '4x1': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    '4x2': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[settings.layout] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  const itemsPerPage = {
    '3x1': 3,
    '3x2': 6,
    '4x1': 4,
    '4x2': 8,
  }[settings.layout] || 6;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter orders based on selected stations and current tab
  const filteredOrders = useMemo(() => {
    const activeCategories = STATIONS
      .filter(s => selectedStationIds.includes(s.id))
      .flatMap(s => s.categories);

    return orders
      .map(order => {
        const stationItems = order.items.filter(item => 
          activeCategories.includes(item.category)
        );
        return { ...order, stationItems };
      })
      .filter(order => order.stationItems.length > 0)
      .filter(order => {
        if (currentTab === 'PREP') {
          // Keep in PREP if order status is not COMPLETED and there's either:
          // - at least one pending item, OR
          // - at least one cancelled item that hasn't been clicked "移除".
          const hasPrepItems = order.stationItems.some(item => 
            item.status === 'PENDING' || 
            (item.status === 'CANCELLED' && !item.removedFromPrep)
          );
          return hasPrepItems && order.status !== 'COMPLETED';
        } else if (currentTab === 'WAITLIST') {
          return order.status === 'WAITLIST';
        } else {
          // COMPLETED tab:
          const hasPrepItems = order.stationItems.some(item => 
            item.status === 'PENDING' || 
            (item.status === 'CANCELLED' && !item.removedFromPrep)
          );
          return order.status === 'COMPLETED' || (!hasPrepItems && order.status !== 'WAITLIST');
        }
      })
      .sort((a, b) => a.priority - b.priority);
  }, [orders, selectedStationIds, currentTab]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  // Auto-cap page if items decrease
  if (page >= totalPages && totalPages > 0) {
    setPage(totalPages - 1);
  }
  const currentOrders = filteredOrders.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = filteredOrders.findIndex((o) => o.id === String(active.id));
      const newIndex = filteredOrders.findIndex((o) => o.id === String(over.id));
      
      const newFiltered = arrayMove<Order & { stationItems: any[] }>(filteredOrders, oldIndex, newIndex);
      reorderOrders(newFiltered.map(o => o.id));
    }
  };

  if (filteredOrders.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
        <CircleDashed size={80} className="opacity-20" />
        <p className="text-3xl font-bold tracking-wider">目前分頁無訂單</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden pb-4 px-2 pt-2 relative">
      {/* Grid */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className={`flex-1 grid ${gridClasses} gap-4 content-start min-h-0`}>
          <SortableContext 
            items={currentOrders.map(o => o.id)} 
            strategy={rectSortingStrategy}
          >
            <AnimatePresence mode="popLayout">
              {currentOrders.map((order) => (
                <SortableOrderCard 
                  key={order.id} 
                  order={order} 
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </div>
      </DndContext>

      {/* Pagination Dots */}
      {totalPages > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center gap-3 bg-gradient-to-t from-gray-100 to-transparent pt-4 pb-2">
           <button 
             onClick={() => setPage(p => Math.max(0, p - 1))}
             disabled={page === 0}
             className="p-1 text-gray-400 disabled:opacity-30 hover:text-gray-800"
           >
             <ChevronLeft size={24} />
           </button>
           
           <div className="flex gap-2">
             {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i === page ? 'bg-red-600' : 'bg-gray-400 hover:bg-gray-600'
                  }`}
                />
             ))}
           </div>

           <button 
             onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
             disabled={page >= totalPages - 1}
             className="p-1 text-gray-400 disabled:opacity-30 hover:text-gray-800"
           >
             <ChevronRight size={24} />
           </button>
        </div>
      )}
    </div>
  );
};
