import React, { useState, useEffect } from 'react';
import { useOrderStore } from './store/useOrderStore';
import { STATIONS } from './types/kds';
import { StationSelector } from './components/StationSelector';
import { SettingsDialog } from './components/SettingsDialog';
import { KDSGrid } from './components/KDSGrid';
import { KDSItemAggregationGrid } from './components/KDSItemAggregationGrid';
import { DebugPanel } from './components/DebugPanel';
import { Settings, Clock, PauseCircle, PlayCircle, Scissors, ScanLine, LayoutList, Grip, RefreshCcw, Undo2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const { selectedStationIds, setStations, currentTab, setCurrentTab, isPaused, togglePause, activeToast, clearToast, orders, viewMode, setViewMode } = useOrderStore();
  const [showSelector, setShowSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatHeaderTime = (date: Date) => {
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  
  const formatHeaderDate = (date: Date) => {
    const d = date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
    const weekday = date.toLocaleDateString('zh-TW', { weekday: 'short' });
    return `${d} · ${weekday}`;
  };

  // Calculate dynamic tab badges
  const activeCategories = STATIONS
    .filter(s => selectedStationIds.includes(s.id))
    .flatMap(s => s.categories);

  const getFilteredCount = (status: 'WAITLIST' | 'PREP' | 'COMPLETED') => {
    return orders.filter(o => 
      o.status === status && 
      o.items.some(item => activeCategories.includes(item.category))
    ).length;
  };

  return (
    <div className="h-screen w-screen bg-gray-100 text-gray-800 flex flex-col overflow-hidden font-sans selection:bg-orange-200">
      
      {/* Top Header */}
      <header className="h-[60px] bg-white border-b border-gray-300 flex items-stretch shrink-0">
        <div className="w-[200px] bg-orange-100 flex items-center p-4 gap-3">
          <div className="text-orange-500">
            <Clock size={32} />
          </div>
          <div className="leading-tight">
            <div className="text-3xl font-bold tracking-tight text-gray-800">{formatHeaderTime(now)}</div>
            <div className="text-sm font-medium text-gray-600 tracking-wider mt-1">
              {formatHeaderDate(now)}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center px-4 overflow-x-auto gap-3">
          {STATIONS.map((s) => {
            const isActive = selectedStationIds.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => {
                  const el = document.getElementById(`station-btn-${s.id}`);
                  if (el) {
                    el.classList.add('scale-95');
                    setTimeout(() => el.classList.remove('scale-95'), 100);
                  }

                  // Toggle active station
                  let nextStations;
                  if (isActive) {
                    nextStations = selectedStationIds.filter(id => id !== s.id);
                  } else {
                    nextStations = [...selectedStationIds, s.id];
                  }
                  setStations(nextStations);
                }}
                id={`station-btn-${s.id}`}
                className={`px-6 py-2.5 rounded-full font-bold text-lg transition-transform cursor-pointer relative ${
                  isActive ? 'bg-red-600 text-white shadow-md hover:bg-red-700' : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
              >
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-ping" />
                )}
                {s.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pr-4 pl-2 bg-white">
          <button 
            onClick={togglePause}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg shadow-sm text-lg font-bold transition-colors ${
              isPaused ? 'bg-teal-500 text-white' : 'bg-[#e53935] text-white hover:bg-red-700'
            }`}
          >
            {isPaused ? <PlayCircle size={22} /> : <PauseCircle size={22} />}
            {isPaused ? '持續排入中 | 點擊暫停' : '暫停排入中 | 待排 6 張'}
          </button>
          
          <button 
            onClick={() => setShowSelector(true)}
            className="p-3 ml-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 border-2 border-gray-300 shadow-sm transition-colors flex items-center gap-2"
          >
            <RefreshCcw size={28} />
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 ml-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 border-2 border-gray-300 shadow-sm transition-colors"
          >
            <Settings size={28} />
          </button>
        </div>
      </header>

      {/* Warning bar if paused */}
      <AnimatePresence>
        {!isPaused && (
           <motion.div 
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             className="bg-red-100 text-red-600 py-3 border-b border-red-200 text-center text-base font-bold flex items-center justify-center gap-2 shrink-0"
           >
             <PauseCircle size={20} />
             已暫停排入 <span className="text-gray-600 font-medium ml-2">新進廚房單會暫存於「待排入區」頁籤，不會流入各站台。</span>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Sub Header (Tabs) */}
      <div className="h-[60px] bg-gray-100 flex items-end px-4 border-b border-gray-300 gap-2 shrink-0">
        {[
          { id: 'WAITLIST', label: '待排入區', icon: LayoutList, badge: getFilteredCount('WAITLIST') },
          { id: 'PREP', label: '製餐區', icon: Scissors, badge: getFilteredCount('PREP') },
          { id: 'COMPLETED', label: '已出餐區', icon: ScanLine, badge: getFilteredCount('COMPLETED') }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id as 'WAITLIST' | 'PREP' | 'COMPLETED')}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-lg transition-colors border-2 border-b-0 ${
              currentTab === tab.id 
                ? 'bg-white border-gray-300 text-gray-900 relative z-10 before:absolute before:-bottom-0.5 before:left-0 before:right-0 before:h-[3px] before:bg-white after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-[3px] after:bg-red-500' 
                : 'bg-white/50 border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={22} className={currentTab === tab.id ? (tab.id === 'WAITLIST' ? 'text-amber-500' : tab.id === 'PREP' ? 'text-gray-700' : 'text-gray-400') : ''} />
            {tab.label}
            {tab.badge > 0 && (
              <span className="ml-2 bg-gray-700 text-white text-[14px] px-2.5 py-0.5 rounded-full font-black">
                {tab.badge}
              </span>
            )}
          </button>
        ))}

        <div className="flex-1" />
        
        <div className="flex bg-white rounded-lg border-2 border-gray-300 p-1 mb-2 shadow-sm">
          <button 
            onClick={() => setViewMode('ORDER')}
            className={`px-4 py-1.5 text-base rounded flex items-center gap-2 font-bold transition-all cursor-pointer ${
              viewMode === 'ORDER' 
                ? 'bg-gray-700 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutList size={18} /> 依訂單
          </button>
          <button 
            onClick={() => setViewMode('ITEM')}
            className={`px-4 py-1.5 text-base rounded flex items-center gap-2 font-bold transition-all cursor-pointer ${
              viewMode === 'ITEM' 
                ? 'bg-gray-700 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Grip size={18} /> 依品項
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#f3f4f6]">
        {selectedStationIds.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white border-2 border-dashed border-gray-300 rounded-xl m-6 p-12 text-center shadow-sm">
            <div className="text-6xl mb-4 animate-bounce">🍽️</div>
            <div className="text-2xl font-black text-gray-800 mb-2">請選擇準備呈現的廚房站點</div>
            <p className="text-base text-gray-400 max-w-md">
              請點選上方標題列的 <span className="font-bold text-red-600 font-mono">「煎台」</span>、<span className="font-bold text-red-600 font-mono">「麵包台」</span> 或 <span className="font-bold text-red-600 font-mono">「點心台」</span> 按鈕，快速查看和管理對應站點的廚房餐點。
            </p>
          </div>
        ) : viewMode === 'ITEM' ? (
          <KDSItemAggregationGrid />
        ) : (
          <KDSGrid />
        )}

        {/* Global Toast Area */}
        <AnimatePresence>
          {activeToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-4 z-50 text-sm font-medium animate-bounce"
            >
              <span className="flex items-center gap-2">
                {!activeToast.hideUndo && <span className="text-gray-300">已完成</span>}
                {activeToast.hideUndo ? activeToast.message : activeToast.message.replace('已完成 ', '')}
              </span>
              {!activeToast.hideUndo && (
                <button 
                  onClick={() => {
                    const { undoFulfillItem } = useOrderStore.getState();
                    if (activeToast.orderId && activeToast.itemId) {
                      undoFulfillItem(activeToast.orderId, activeToast.itemId);
                    }
                  }}
                  className="bg-white text-gray-700 hover:bg-gray-100 px-3 py-1 rounded flex items-center gap-1 transition-colors"
                >
                  <Undo2 size={14} /> 回復
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Legend */}
      <footer className="h-[50px] bg-gray-200 border-t-2 border-gray-300 flex items-center px-4 text-sm font-bold text-gray-700 gap-6 shrink-0 z-10 w-full overflow-x-auto">
        <div className="whitespace-nowrap">※製餐等候時間</div>
        <div className="flex items-center gap-2 whitespace-nowrap"><span className="w-4 h-4 rounded-full bg-red-600"></span>{'>='} 30分</div>
        <div className="flex items-center gap-2 whitespace-nowrap"><span className="w-4 h-4 rounded-full bg-orange-500"></span>{'>='} 10 分</div>
        <div className="flex items-center gap-2 whitespace-nowrap"><span className="w-4 h-4 rounded-full bg-green-600"></span>{'<'} 10分</div>
        <div className="w-0.5 h-6 bg-gray-400 mx-4" />
        <div className="whitespace-nowrap">※餐點異動標示</div>
        <div className="flex items-center gap-2 whitespace-nowrap"><span className="w-4 h-4 rounded-full bg-gray-400"></span>餐點/訂單取消</div>
        <div className="flex items-center gap-2 whitespace-nowrap"><span className="w-4 h-4 rounded-full bg-amber-600"></span>數量異動</div>
      </footer>

      {/* Overlays */}
      {showSelector && <StationSelector onClose={() => setShowSelector(false)} />}
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      <DebugPanel />
      
    </div>
  );
}

