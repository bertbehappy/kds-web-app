import React, { useState, useEffect } from 'react';
import { useOrderStore } from './store/useOrderStore';
import { STATIONS } from './types/kds';
import { SettingsDialog } from './components/SettingsDialog';
import { KDSGrid } from './components/KDSGrid';
import { KDSItemAggregationGrid } from './components/KDSItemAggregationGrid';
import { DebugPanel } from './components/DebugPanel';
import { Settings, Clock, PauseCircle, PlayCircle, Scissors, ScanLine, LayoutList, Grip, Maximize, Undo2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const { selectedStationIds, setStations, currentTab, setCurrentTab, isPaused, togglePause, activeToast, clearToast, orders, viewMode, setViewMode } = useOrderStore();
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

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Calculate dynamic tab badges
  const activeCategories = STATIONS
    .filter(s => selectedStationIds.includes(s.id))
    .flatMap(s => s.categories);

  const getFilteredCount = (tabStatus: 'WAITLIST' | 'PREP' | 'COMPLETED') => {
    return orders
      .map(o => {
        const stationItems = o.items.filter(item => activeCategories.includes(item.category));
        return { ...o, stationItems };
      })
      .filter(o => o.stationItems.length > 0)
      .filter(o => {
        if (tabStatus === 'PREP') {
          const hasPrepItems = o.stationItems.some(item => 
            item.status === 'PENDING' || 
            (item.status === 'CANCELLED' && !item.removedFromPrep)
          );
          return hasPrepItems && o.status !== 'COMPLETED';
        } else if (tabStatus === 'WAITLIST') {
          const hasVisibleItems = o.stationItems.some(item => 
            item.status === 'PENDING' || 
            (item.status === 'CANCELLED' && !item.removedFromPrep)
          );
          return o.status === 'WAITLIST' && hasVisibleItems;
        } else {
          const hasPrepItems = o.stationItems.some(item => 
            item.status === 'PENDING' || 
            (item.status === 'CANCELLED' && !item.removedFromPrep)
          );
          return o.status === 'COMPLETED' || (!hasPrepItems && o.status !== 'WAITLIST');
        }
      }).length;
  };

  return (
    <div className="h-screen w-screen bg-gray-100 text-gray-800 flex flex-col overflow-hidden font-sans selection:bg-orange-200">
      
      {/* Top Header */}
      <header className="min-h-[60px] bg-white border-b border-gray-300 flex flex-col md:flex-row items-stretch shrink-0">
        <div className="w-full md:w-[150px] lg:w-[200px] bg-white flex items-center p-3 gap-2 shrink-0 justify-between md:justify-start border-b md:border-b-0 md:border-r border-gray-200">
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 text-orange-500 hidden sm:flex items-center justify-center p-2 rounded-lg">
              <Clock size={32} strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="text-2xl sm:text-3xl font-black tracking-tighter text-gray-900">{formatHeaderTime(now)}</div>
              <div className="text-[10px] sm:text-xs font-bold text-gray-500 tracking-wider">
                {formatHeaderDate(now)}
              </div>
            </div>
          </div>
          <div className="flex bg-gray-100 rounded-lg border border-gray-300 p-1 md:hidden shrink-0">
            <button 
              onClick={() => setViewMode('ORDER')}
              className={`px-3 py-1 text-sm rounded flex items-center gap-1.5 font-bold transition-all ${
                viewMode === 'ORDER' 
                  ? 'bg-gray-700 text-white shadow-sm' 
                  : 'text-gray-600 bg-transparent'
              }`}
            >
              <LayoutList size={16} /> 單
            </button>
            <button 
              onClick={() => setViewMode('ITEM')}
              className={`px-3 py-1 text-sm rounded flex items-center gap-1.5 font-bold transition-all ${
                viewMode === 'ITEM' 
                  ? 'bg-gray-700 text-white shadow-sm' 
                  : 'text-gray-600 bg-transparent'
              }`}
            >
              <Grip size={16} /> 品
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center px-4 py-3 md:py-0 overflow-x-auto bg-[#fff1e0]">
          <div className="flex items-center gap-1 bg-white p-1.5 md:p-2 rounded-2xl shadow-sm border border-orange-100">
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
                    let nextStations = [s.id];
                    setStations(nextStations);
                  }}
                  id={`station-btn-${s.id}`}
                  className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full font-bold text-sm md:text-lg transition-transform cursor-pointer tracking-wide shrink-0 ${
                    isActive ? 'bg-[#ef340f] text-white shadow' : 'bg-transparent text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 pr-4 pl-4 md:pl-2 py-2 md:py-0 bg-[#fff1e0] md:bg-[#fff1e0] border-t md:border-t-0 border-orange-200 justify-end md:justify-start">
          <button 
            onClick={togglePause}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg shadow-sm text-sm sm:text-lg font-bold transition-colors shrink-0 ${
              isPaused ? 'bg-teal-500 text-white hover:bg-teal-600' : 'bg-[#e53935] text-white hover:bg-red-700'
            }`}
          >
            {isPaused ? <PlayCircle size={20} className="sm:w-[22px] sm:h-[22px]" /> : <PauseCircle size={20} className="sm:w-[22px] sm:h-[22px]" />}
            <span className="hidden sm:inline">{isPaused ? `已暫停排入 | 待排 ${getFilteredCount('WAITLIST')} 張` : '持續排入中 | 點擊暫停'}</span>
            <span className="sm:hidden">{isPaused ? '已暫停' : '排入中'}</span>
          </button>
          
          <button 
            onClick={toggleFullScreen}
            className="p-2 sm:p-3 ml-1 sm:ml-2 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-900 border border-gray-300 md:border-2 shadow-sm transition-colors flex items-center shrink-0"
          >
            <Maximize size={20} className="sm:w-[28px] sm:h-[28px]" />
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 sm:p-3 ml-1 sm:ml-2 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-900 border border-gray-300 md:border-2 shadow-sm transition-colors shrink-0"
          >
            <Settings size={20} className="sm:w-[28px] sm:h-[28px]" />
          </button>
        </div>
      </header>

      {/* Warning bar if paused */}
      <AnimatePresence>
        {isPaused && (
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
      <div className="bg-gray-100 flex items-end px-2 sm:px-4 border-b border-gray-300 gap-1 sm:gap-2 shrink-0 overflow-x-auto whitespace-nowrap pt-2 sm:h-[60px] sm:pt-0">
        {[
          { id: 'WAITLIST', label: '待排入區', icon: LayoutList, badge: getFilteredCount('WAITLIST') },
          { id: 'PREP', label: '製餐區', icon: Scissors, badge: getFilteredCount('PREP') },
          { id: 'COMPLETED', label: '已出餐區', icon: ScanLine, badge: getFilteredCount('COMPLETED') }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id as 'WAITLIST' | 'PREP' | 'COMPLETED')}
            className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-t-xl font-bold text-sm sm:text-lg transition-colors border-2 border-b-0 shrink-0 ${
              currentTab === tab.id 
                ? 'bg-white border-gray-300 text-gray-900 relative z-10 before:absolute before:-bottom-0.5 before:left-0 before:right-0 before:h-[3px] before:bg-white after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-[3px] after:bg-red-500' 
                : 'bg-white/50 border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={20} className={`sm:w-[22px] sm:h-[22px] ${currentTab === tab.id ? (tab.id === 'WAITLIST' ? 'text-amber-500' : tab.id === 'PREP' ? 'text-gray-700' : 'text-gray-400') : ''}`} />
            {tab.label}
            {tab.badge > 0 && (
              <span className="ml-1 sm:ml-2 bg-gray-700 text-white text-[12px] sm:text-[14px] px-2 sm:px-2.5 py-0.5 rounded-full font-black">
                {tab.badge}
              </span>
            )}
          </button>
        ))}

        <div className="flex-1" />
        
        <div className="hidden md:flex bg-white rounded-lg border-2 border-gray-300 p-1 mb-2 shadow-sm shrink-0">
          <button 
            onClick={() => setViewMode('ORDER')}
            className={`px-3 sm:px-4 py-1 sm:py-1.5 text-sm sm:text-base rounded flex items-center gap-1.5 sm:gap-2 font-bold transition-all cursor-pointer ${
              viewMode === 'ORDER' 
                ? 'bg-gray-700 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutList size={18} /> 依訂單
          </button>
          <button 
            onClick={() => setViewMode('ITEM')}
            className={`px-3 sm:px-4 py-1 sm:py-1.5 text-sm sm:text-base rounded flex items-center gap-1.5 sm:gap-2 font-bold transition-all cursor-pointer ${
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
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-5 py-3 shadow-xl flex items-center gap-6 z-50 text-base sm:text-lg font-bold"
            >
              <span className="flex items-center gap-3">
                {activeToast.quantity && activeToast.itemName ? (
                  <>
                    <span className="border border-white rounded shrink-0 w-8 h-8 flex items-center justify-center font-bold text-lg">{activeToast.quantity}</span>
                    <span className="tracking-wide">{activeToast.itemName} 已完成</span>
                  </>
                ) : (
                  <span className="tracking-wide">{activeToast.message}</span>
                )}
              </span>
              {!activeToast.hideUndo && (
                <button 
                  onClick={() => {
                    const { undoFulfillItem } = useOrderStore.getState();
                    if (activeToast.orderId && activeToast.itemId) {
                      undoFulfillItem(activeToast.orderId, activeToast.itemId);
                    }
                  }}
                  className="bg-black text-white border border-white hover:bg-gray-800 px-4 py-1.5 rounded flex items-center gap-1 transition-colors shrink-0 whitespace-nowrap"
                >
                  <Undo2 size={18} /> 回復狀態
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
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      <DebugPanel />
      
    </div>
  );
}

