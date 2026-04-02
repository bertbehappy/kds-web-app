import React, { useState, useMemo } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { STATIONS, Order } from '../types/kds';
import { OrderCard } from './OrderCard';
import { ChevronLeft, ChevronRight, ListFilter, GripVertical } from 'lucide-react';
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-3 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 bg-slate-800/80 rounded border border-slate-700 text-slate-400 hover:text-white transition-opacity"
      >
        <GripVertical size={16} />
      </div>
      <OrderCard order={order} stationItems={order.stationItems} />
    </div>
  );
};

export const KDSGrid: React.FC = () => {
  const { orders, selectedStationIds, reorderOrders } = useOrderStore();
  const [page, setPage] = useState(0);
  const itemsPerPage = 6;

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

  // Filter orders based on selected stations
  const filteredOrders = useMemo(() => {
    const activeCategories = STATIONS
      .filter(s => selectedStationIds.includes(s.id))
      .flatMap(s => s.categories);

    return orders
      .map(order => {
        const stationItems = order.items.filter(item => 
          activeCategories.includes(item.category) && !item.fulfilled
        );
        return { ...order, stationItems };
      })
      .filter(order => order.stationItems.length > 0)
      .sort((a, b) => a.priority - b.priority);
  }, [orders, selectedStationIds]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentOrders = filteredOrders.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const handlePrev = () => setPage(p => Math.max(0, p - 1));
  const handleNext = () => setPage(p => Math.min(totalPages - 1, p + 1));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = filteredOrders.findIndex((o) => o.id === active.id);
      const newIndex = filteredOrders.findIndex((o) => o.id === over.id);
      
      const newFiltered = arrayMove(filteredOrders, oldIndex, newIndex);
      reorderOrders(newFiltered.map(o => o.id));
    }
  };

  if (filteredOrders.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
        <ListFilter size={64} className="opacity-20" />
        <p className="text-2xl font-bold">暫無訂單</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      {/* Grid */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-rows-2 gap-4">
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

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <span className="text-slate-400 font-bold">
            第 {page + 1} 頁 / 共 {totalPages || 1} 頁
          </span>
          <span className="text-slate-600 text-sm">
            (總計 {filteredOrders.length} 張訂單)
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={handlePrev}
            className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-all active:scale-90"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            disabled={page >= totalPages - 1}
            onClick={handleNext}
            className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-all active:scale-90"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
