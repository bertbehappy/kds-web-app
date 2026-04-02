import React, { useState } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { STATIONS } from '../types/kds';
import { Check, Settings2 } from 'lucide-react';
import { motion } from 'motion/react';

export const StationSelector: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { selectedStationIds, setStations } = useOrderStore();
  const [tempIds, setTempIds] = useState<string[]>(selectedStationIds);

  const toggleStation = (id: string) => {
    setTempIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (tempIds.length === 0) return;
    setStations(tempIds);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border-2 border-slate-700 p-8 rounded-3xl max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Settings2 className="text-blue-400" size={32} />
          <h2 className="text-3xl font-black text-white">站點選擇</h2>
        </div>
        
        <p className="text-slate-400 mb-8">請選擇此 KDS 裝置要接收的廚房站點（可複選）：</p>
        
        <div className="space-y-4 mb-8">
          {STATIONS.map(station => (
            <button
              key={station.id}
              onClick={() => toggleStation(station.id)}
              className={`w-full p-5 rounded-2xl border-2 flex justify-between items-center transition-all ${
                tempIds.includes(station.id)
                  ? 'bg-blue-600/20 border-blue-500 text-white'
                  : 'bg-slate-800 border-transparent text-slate-400 hover:bg-slate-750'
              }`}
            >
              <div className="text-left">
                <div className="text-xl font-bold">{station.name}</div>
                <div className="text-sm opacity-60">類別: {station.categories.join(', ')}</div>
              </div>
              {tempIds.includes(station.id) && <Check size={24} />}
            </button>
          ))}
        </div>

        <button
          disabled={tempIds.length === 0}
          onClick={handleSave}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xl rounded-2xl transition-all shadow-lg shadow-blue-900/20"
        >
          進入系統
        </button>
      </motion.div>
    </div>
  );
};
