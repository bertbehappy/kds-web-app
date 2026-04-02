import React, { useState } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { generateMockOrder } from '../services/mockData';
import { realtimeService } from '../services/realtimeService';
import { Plus, Trash2, Settings, Zap, Play, Pause } from 'lucide-react';

export const DebugPanel: React.FC = () => {
  const { clearOrders, fulfillmentMode, setFulfillmentMode } = useOrderStore();
  const [isOpen, setIsOpen] = useState(false);
  const [autoGen, setAutoGen] = useState(false);

  React.useEffect(() => {
    let interval: any;
    if (autoGen) {
      interval = setInterval(() => {
        realtimeService.simulateNewOrder(generateMockOrder());
      }, 15000);
    }
    return () => clearInterval(interval);
  }, [autoGen]);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-slate-800 text-slate-400 rounded-full hover:text-white shadow-lg border border-slate-700 z-40"
      >
        <Settings size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl z-40 overflow-hidden">
      <div className="p-4 bg-slate-800 flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Zap size={16} className="text-yellow-400" />
          Demo 控制面板
        </h3>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase">訂單模擬</p>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => realtimeService.simulateNewOrder(generateMockOrder())}
              className="flex items-center justify-center gap-1 p-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-bold"
            >
              <Plus size={16} /> 新增訂單
            </button>
            <button 
              onClick={() => {
                for(let i=0; i<5; i++) setTimeout(() => realtimeService.simulateNewOrder(generateMockOrder()), i * 200);
              }}
              className="flex items-center justify-center gap-1 p-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg font-bold"
            >
              <Plus size={16} /> 批次新增
            </button>
          </div>
          <button 
            onClick={() => setAutoGen(!autoGen)}
            className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-bold transition-colors ${
              autoGen ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {autoGen ? <Pause size={16} /> : <Play size={16} />}
            自動進單 (15s)
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase">系統設定</p>
          <div className="flex bg-slate-800 p-1 rounded-lg">
            <button 
              onClick={() => setFulfillmentMode('SINGLE')}
              className={`flex-1 p-2 text-xs font-bold rounded-md transition-all ${
                fulfillmentMode === 'SINGLE' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'
              }`}
            >
              單選模式
            </button>
            <button 
              onClick={() => setFulfillmentMode('CONFIRM')}
              className={`flex-1 p-2 text-xs font-bold rounded-md transition-all ${
                fulfillmentMode === 'CONFIRM' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'
              }`}
            >
              多選模式
            </button>
          </div>
        </div>

        <button 
          onClick={clearOrders}
          className="w-full flex items-center justify-center gap-2 p-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm rounded-lg font-bold border border-red-900/50"
        >
          <Trash2 size={16} /> 清空所有訂單
        </button>
      </div>
    </div>
  );
};
