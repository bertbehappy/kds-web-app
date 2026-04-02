import { Order, OrderItem, ItemCategory, OrderType } from './kds';

const ITEM_NAMES: Record<ItemCategory, string[]> = {
  main: ['牛肉漢堡', '經典義大利麵', '香煎雞腿排', '海鮮燉飯', '厚切豬排飯', '素食沙拉'],
  drink: ['冰美式咖啡', '珍珠奶茶', '鮮榨柳橙汁', '熱拿鐵', '可口可樂', '檸檬紅茶'],
  dessert: ['提拉米蘇', '法式烤布蕾', '巧克力布朗尼', '草莓起司蛋糕', '香草冰淇淋'],
};

const NOTES = ['不要蔥', '去冰', '微辣', '加起司', '外帶餐具', '醬多'];

let orderCounter = 100;

export const generateMockOrder = (): Order => {
  const id = Math.random().toString(36).substr(2, 9);
  const orderNumber = (orderCounter++).toString();
  const types: OrderType[] = ['DINE_IN', 'TAKE_OUT', 'DELIVERY'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const items: OrderItem[] = [];
  const categories: ItemCategory[] = ['main', 'drink', 'dessert'];
  
  // Randomly pick 1-3 categories
  const selectedCategories = categories.filter(() => Math.random() > 0.3);
  if (selectedCategories.length === 0) selectedCategories.push('main');

  selectedCategories.forEach(cat => {
    const itemCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < itemCount; i++) {
      items.push({
        id: Math.random().toString(36).substr(2, 9),
        name: ITEM_NAMES[cat][Math.floor(Math.random() * ITEM_NAMES[cat].length)],
        quantity: Math.floor(Math.random() * 3) + 1,
        category: cat,
        note: Math.random() > 0.7 ? NOTES[Math.floor(Math.random() * NOTES.length)] : undefined,
        fulfilled: false,
      });
    }
  });

  return {
    id,
    orderNumber,
    type,
    tableNumber: type === 'DINE_IN' ? Math.floor(Math.random() * 20 + 1).toString() : undefined,
    takeoutNumber: type === 'TAKE_OUT' ? Math.floor(Math.random() * 100 + 1).toString() : undefined,
    deliveryPlatform: type === 'DELIVERY' ? (Math.random() > 0.5 ? 'Foodpanda' : 'UberEats') : undefined,
    deliveryId: type === 'DELIVERY' ? Math.random().toString(36).substr(2, 6).toUpperCase() : undefined,
    createdAt: Date.now(),
    items,
    note: Math.random() > 0.8 ? '整單備註：請儘速出餐' : undefined,
    priority: Date.now(),
  };
};

export const generateInitialOrders = (count: number): Order[] => {
  const orders: Order[] = [];
  for (let i = 0; i < count; i++) {
    const order = generateMockOrder();
    // Stagger creation times
    order.createdAt = Date.now() - (count - i) * 60000 * 2; 
    order.priority = order.createdAt;
    orders.push(order);
  }
  return orders;
};
