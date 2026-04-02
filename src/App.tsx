import React, { useState, useEffect } from 'react';
import { useOrderStore } from './store/useOrderStore';
import { STATIONS } from './types/kds';
import { StationSelector } from './components/StationSelector';
import { KDSGrid } from './components/KDSGrid';
import { DebugPanel } from './components/DebugPanel';
import { Settings, Clock, ChefHat } from 'lucide-react';

export default function App() {
  const { selectedStationIds } = useOrderStore();
  const [showSelector, setShowSelector] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeStations = STATIONS.filter(s => selectedStationIds.includes(s.id));

  // If no stations selected, force selector
  if (selectedStationIds.length === 0) {
    return <StationSelector />;
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="h-20 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <ChefHat size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">KDS 廚房系統</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Kitchen Display System</p>
            </div>
          </div>
          
          <div className="h-10 w-px bg-slate-800 mx-2" />
          
          <div className="flex gap-2">
            {activeStations.map(s => (
              <span key={s.id} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-sm font-bold text-blue-400">
                {s.name}
              </span>
            ))}
            <button 
              onClick={() => setShowSelector(true)}
              className="p-1.5 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl font-mono font-black text-white">
              {now.toLocaleTimeString('zh-TW', { hour12: false })}
            </div>
            <div className="text-xs text-slate-500 font-bold">
              {now.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <KDSGrid />
      </main>

      {/* Overlays */}
      {showSelector && <StationSelector onClose={() => setShowSelector(false)} />}
      <DebugPanel />

      {/* Global styles for scrollbars and such */}
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}} />
    </div>
  );
}
