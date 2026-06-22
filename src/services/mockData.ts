import { Order, OrderItem, ItemCategory, OrderType } from '../types/kds';

const ITEM_NAMES: Record<ItemCategory, string[]> = {
  main: ['茄香烤雞腿佐魷魚圈', '義大利麵套餐', '經典牛肉漢堡', '燻雞起司三明治'],
  drink: ['冰檸檬紅茶', '原味拿鐵', '鮮榨柳橙汁', '可口可樂'],
  dessert: ['巧克力布朗尼', '蒙布朗', '巧克力千層', '法式烤布蕾'],
};

const MODIFIERS = ['- 醬多', '- 2x 奶油', '- 飲料去冰', '- 醬少'];
const NOTES = ['* 備註：全熟', '* 備註：不要冰淇淋', '* 備註：餐具', '* 備註：醬改旁邊'];

let orderCounter = 240;
let seqCounter = 1;

export const generateMockOrder = (): Order => {
  const id = Math.random().toString(36).substr(2, 9);
  const orderNumber = (orderCounter++).toString().padStart(4, '0');
  const sequence = seqCounter++;
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
        quantity: 1, // keeping mostly 1 as per screenshot
        category: cat,
        modifiers: Math.random() > 0.5 ? [MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)]] : [],
        note: Math.random() > 0.5 ? !cat.includes('main') ? '* 備註：不要冰淇淋' : NOTES[Math.floor(Math.random() * NOTES.length)] : undefined,
        status: Math.random() > 0.9 ? 'CANCELLED' : 'PENDING',
        isAddOn: Math.random() > 0.8,
      });
    }
  });

  return {
    id,
    sequence,
    orderNumber,
    type,
    tableNumber: type === 'DINE_IN' ? `1F-${Math.floor(Math.random() * 10 + 1)}` : undefined,
    takeoutNumber: type === 'TAKE_OUT' || type === 'DELIVERY' ? `#${Math.floor(Math.random() * 1000 + 1000)}` : undefined,
    createdAt: Date.now(),
    items,
    note: Math.random() > 0.7 ? '註：不用餐具不用餐具不用餐具不用餐具' : undefined,
    status: Math.random() > 0.8 ? 'WAITLIST' : 'PREP',
    isAddOn: Math.random() > 0.8,
    priority: Date.now(),
  };
};

export const generateInitialOrders = (count: number): Order[] => {
  const orders: Order[] = [];
  for (let i = 0; i < count; i++) {
    const order = generateMockOrder();
    // Stagger creation times to create varying wait times (1 to 40 mins ago)
    const minutesAgo = Math.floor(Math.random() * 40) + 1;
    order.createdAt = Date.now() - minutesAgo * 60000; 
    order.priority = order.createdAt;
    orders.push(order);
  }
  return orders;
};
