import React from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { playNotificationSound } from '../utils/audio';

interface SettingsDialogProps {
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ onClose }) => {
  const { settings, updateSettings } = useOrderStore();
  const [localSettings, setLocalSettings] = React.useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-500/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans text-gray-800">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-50 border-2 border-blue-400 p-0 max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="bg-[#e4ebf5] px-4 py-3 border-b border-gray-300 font-bold text-gray-800 tracking-wide text-lg flex justify-between items-center shrink-0">
          <span>設定</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 font-bold text-gray-700 tracking-wide">
            單據狀態轉換設定
          </div>
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 text-base sm:text-lg font-medium bg-white shrink-0">
            <div className="flex flex-wrap items-center gap-3 border-b border-dashed border-gray-300 pb-6">
              <span>預定單於取餐前</span>
              <select 
                value={localSettings.autoPrepTime}
                onChange={(e) => setLocalSettings(s => ({ ...s, autoPrepTime: Number(e.target.value) }))}
                className="border border-gray-300 rounded px-3 py-1 bg-white text-blue-600 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
              </select>
              <span>分鐘自動排入製餐區</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer w-full sm:w-auto">
                <input 
                  type="checkbox" 
                  checked={localSettings.autoFulfill}
                  onChange={(e) => setLocalSettings(s => ({ ...s, autoFulfill: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                />
                <span>啟用自動銷單，進入製餐區達</span>
              </label>
              <select 
                value={localSettings.autoFulfillTime}
                onChange={(e) => setLocalSettings(s => ({ ...s, autoFulfillTime: Number(e.target.value) }))}
                disabled={!localSettings.autoFulfill}
                className="border border-gray-300 rounded px-3 py-1 bg-white text-gray-500 focus:outline-none disabled:bg-gray-100"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={60}>60</option>
              </select>
              <span className={!localSettings.autoFulfill ? 'text-gray-400' : ''}>分鐘後自動銷單並提示</span>
            </div>
          </div>

          <div className="bg-gray-100 px-4 py-2 border-y border-gray-300 font-bold text-gray-700 tracking-wide">
            顯示設定
          </div>
          
          <div className="p-4 sm:p-6 space-y-5 text-base sm:text-lg font-medium bg-white shrink-0">
            <label className="flex items-start sm:items-center gap-2 cursor-pointer pb-2">
              <input 
                type="checkbox" 
                checked={localSettings.showComboName}
                onChange={(e) => setLocalSettings(s => ({ ...s, showComboName: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-teal-500 mt-1 sm:mt-0 shrink-0"
              />
              <span>套餐商品需要顯示套餐名稱</span>
            </label>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="w-40 shrink-0">訂單字級</span>
              <div className="flex rounded border border-gray-300 overflow-hidden w-fit">
                <button 
                  onClick={() => setLocalSettings(s => ({ ...s, fontSize: 'default' }))}
                  className={`px-4 py-1.5 ${localSettings.fontSize === 'default' ? 'bg-[#f8b163] text-white font-bold' : 'bg-white hover:bg-gray-50'}`}
                >
                  預設
                </button>
                <div className="w-px bg-gray-300"></div>
                <button 
                  onClick={() => setLocalSettings(s => ({ ...s, fontSize: 'large' }))}
                  className={`px-4 py-1.5 ${localSettings.fontSize === 'large' ? 'bg-[#f8b163] text-white font-bold' : 'bg-white hover:bg-gray-50'}`}
                >
                  大
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="w-40 shrink-0">行列數</span>
              <div className="flex rounded border border-gray-300 overflow-hidden w-fit">
                <button 
                  onClick={() => setLocalSettings(s => ({ ...s, layout: '3x1' }))}
                  className={`px-4 py-1.5 ${localSettings.layout === '3x1' ? 'bg-[#f8b163] text-white font-bold' : 'bg-white hover:bg-gray-50'}`}
                >
                  3x1
                </button>
                <div className="w-px bg-gray-300"></div>
                <button 
                  onClick={() => setLocalSettings(s => ({ ...s, layout: '4x1' }))}
                  className={`px-4 py-1.5 ${localSettings.layout === '4x1' ? 'bg-[#f8b163] text-white font-bold' : 'bg-white hover:bg-gray-50'}`}
                >
                  4x1
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="w-40 shrink-0">訂單調整通知音效</span>
              <select 
                value={localSettings.notificationSound}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalSettings(s => ({ ...s, notificationSound: val }));
                  playNotificationSound(val);
                }}
                className="border border-gray-300 rounded px-4 py-1.5 bg-white text-teal-600 focus:outline-none w-fit"
              >
                <option value="default">預設</option>
                <option value="bell">鈴聲</option>
                <option value="chime">風鈴</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="w-40 shrink-0">資訊刷新頻率</span>
              <div className="flex items-center gap-3">
                <select 
                  value={localSettings.refreshInterval}
                  onChange={(e) => setLocalSettings(s => ({ ...s, refreshInterval: Number(e.target.value) }))}
                  className="border border-gray-300 rounded px-4 py-1.5 bg-white text-teal-600 focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={30}>30</option>
                </select>
                <span>秒</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 px-4 py-2 border-y border-gray-300 font-bold text-gray-700 tracking-wide">
            等待時間標註
          </div>
          
          <div className="p-4 sm:p-6 space-y-4 text-base sm:text-lg font-medium bg-white shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              <span>訂單進入製餐區後，</span>
              <select 
                value={localSettings.warningTime1}
                onChange={(e) => setLocalSettings(s => ({ ...s, warningTime1: Number(e.target.value) }))}
                className="border border-gray-300 rounded px-4 py-1 bg-white text-teal-600 focus:outline-none"
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
              <span>分鐘後，標註為</span>
              <select 
                value={localSettings.warningColor1}
                onChange={(e) => setLocalSettings(s => ({ ...s, warningColor1: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-1 bg-white focus:outline-none flex items-center justify-center font-bold text-orange-500"
              >
                <option value="orange">🟧</option>
                <option value="yellow">🟨</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span>訂單進入製餐區後，</span>
              <select 
                value={localSettings.warningTime2}
                onChange={(e) => setLocalSettings(s => ({ ...s, warningTime2: Number(e.target.value) }))}
                className="border border-gray-300 rounded px-4 py-1 bg-white text-teal-600 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
              <span>分鐘後，標註為</span>
              <select 
                value={localSettings.warningColor2}
                onChange={(e) => setLocalSettings(s => ({ ...s, warningColor2: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-1 bg-white focus:outline-none flex items-center justify-center text-red-500"
              >
                <option value="red">🟥</option>
                <option value="orange">🟧</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 flex justify-end gap-3 border-t border-blue-400 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 rounded hover:bg-gray-50 font-bold text-gray-700 bg-white"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#e05634] hover:bg-red-600 text-white font-bold rounded shadow-sm"
          >
            儲存
          </button>
        </div>
      </motion.div>
    </div>
  );
};
