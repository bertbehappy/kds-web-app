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
    <div className="fixed inset-0 bg-gray-500/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 p-8 rounded-xl max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Settings2 className="text-red-500" size={32} />
          <h2 className="text-2xl font-bold text-gray-900">站點選擇</h2>
        </div>
        
        <p className="text-gray-600 mb-8 font-medium">請選擇此 KDS 裝置要接收的廚房站點（可複選）：</p>
        
        <div className="space-y-4 mb-8">
          {STATIONS.map(station => (
            <button
              key={station.id}
              onClick={() => toggleStation(station.id)}
              className={`w-full p-4 rounded-lg border-2 flex justify-between items-center transition-all ${
                tempIds.includes(station.id)
                  ? 'bg-red-50 border-red-500 text-red-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="text-left leading-tight">
                <div className="text-xl font-bold">{station.name}</div>
                <div className="text-sm opacity-80 mt-1">負責: {station.categories.join(', ')}</div>
              </div>
              {tempIds.includes(station.id) && <Check size={24} className="text-red-600" />}
            </button>
          ))}
        </div>

        <button
          disabled={tempIds.length === 0}
          onClick={handleSave}
          className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition-colors shadow-sm"
        >
          儲存並進入系統
        </button>
      </motion.div>
    </div>
  );
};
