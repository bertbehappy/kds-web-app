# KDS 廚房顯示系統 (Kitchen Display System) - Preview 版

這是一個專為餐飲門市設計的 KDS Web 應用原型，用於 POS 系統串接展示與內部評估。

## 核心功能
- **即時進單模擬**：內建 Mock Data 生成器，模擬 POS 送單流程。
- **站點分流邏輯**：根據商品類別（主餐、飲料、甜點）自動分流至對應站點。
- **多站點切換**：支援單一裝置接收多個站點，並記憶設定。
- **訂單看板**：3x2 網格佈局，支援分頁與滑動切換。
- **銷單模式**：支援「單選即刪除」與「多選後確認」兩種模式。
- **動態計時器**：即時顯示訂單等待時間，並以顏色區分緊急程度。
- **Demo 控制面板**：方便展示時手動新增、批次新增或清空訂單。

## 技術架構
- **前端框架**：React 19 + Vite
- **狀態管理**：Zustand (輕量、高效)
- **樣式處理**：Tailwind CSS (Kitchen Dark Mode 風格)
- **動畫效果**：Motion (流暢的卡片遞補與狀態切換)
- **圖示庫**：Lucide React

## 模組說明
- `src/types/kds.ts`: 定義訂單、商品、站點等資料模型。
- `src/services/mockData.ts`: 負責產生隨機測試訂單。
- `src/services/realtimeService.ts`: 抽象化即時通訊層，目前模擬 WebSocket 事件。
- `src/store/useOrderStore.ts`: 核心狀態管理，處理訂單增刪、站點設定持久化。
- `src/components/`: 包含看板網格、訂單卡片、站點選擇器等 UI 元件。

## 未來正式版擴充建議
1. **通訊層替換**：
   - 將 `realtimeService.ts` 中的模擬邏輯替換為真實的 `SignalR` 或 `WebSocket` 客戶端。
   - 監聽後端推播的 `ORDER_CREATED` 等事件。
2. **API 整合**：
   - 銷單動作（Fulfill）應呼叫後端 API 以同步狀態至 POS 或其他 KDS。
   - 站點設定可改為從 API 獲取門市配置。
3. **IIS 部署**：
   - 執行 `npm run build` 產出靜態檔案。
   - 在 Windows IIS 中建立網站，將實體路徑指向 `dist` 資料夾。
   - 若有路由需求，需配置 `web.config` 進行 URL Rewrite。
4. **效能優化**：
   - 針對大量訂單情境，可加入虛擬列表（Virtual List）或更精細的渲染控制。

## 使用說明
1. 首次開啟請選擇要接收的站點。
2. 點擊右下角「齒輪」圖示開啟 Demo 面板。
3. 使用「新增訂單」模擬 POS 送單。
4. 點擊卡片中的商品進行銷單。
