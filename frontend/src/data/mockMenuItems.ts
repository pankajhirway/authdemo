/**
 * Mock menu items data for the restaurant ordering demo.
 * Provides realistic items with proper categorization, pricing, and images.
 */

import type { MenuItem } from "../types/menu";

/**
 * Realistic mock menu items for the demo ordering interface.
 * Includes appetizers, entrees, drinks, and desserts with proper pricing.
 */
export const mockMenuItems: MenuItem[] = [
  // APPETIZERS
  {
    id: "app-001",
    name: "Crispy Calamari",
    description:
      "Lightly breaded and fried squid rings served with marinara sauce and lemon wedge",
    price: 14.99,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 15,
    calories: 420,
    ingredients: [
      "Calamari",
      "Flour",
      "Eggs",
      "Panko breadcrumbs",
      "Marinara sauce",
      "Lemon",
    ],
  },
  {
    id: "app-002",
    name: "Bruschetta Trio",
    description:
      "Three toasted baguette slices topped with fresh tomato basil, olive tapenade, and whipped ricotta",
    price: 11.99,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: true,
      vegan: false,
      glutenFree: false,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 12,
    calories: 280,
    ingredients: [
      "Baguette",
      "Tomatoes",
      "Fresh basil",
      "Kalamata olives",
      "Ricotta cheese",
      "Olive oil",
    ],
  },
  {
    id: "app-003",
    name: "Spicy Buffalo Wings",
    description:
      "Crispy chicken wings tossed in house-made buffalo sauce, served with blue cheese dip and celery",
    price: 13.99,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: false,
      vegan: false,
      glutenFree: true,
      containsNuts: false,
      spicy: true,
    },
    prepTimeMinutes: 18,
    calories: 550,
    ingredients: [
      "Chicken wings",
      "Hot sauce",
      "Butter",
      "Blue cheese",
      "Celery",
    ],
  },
  {
    id: "app-004",
    name: "Garden Fresh Salad",
    description:
      "Mixed greens, cucumber, cherry tomatoes, red onion, and house vinaigrette",
    price: 9.99,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: true,
      vegan: true,
      glutenFree: true,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 8,
    calories: 150,
    ingredients: [
      "Mixed greens",
      "Cucumber",
      "Cherry tomatoes",
      "Red onion",
      "Olive oil",
      "Balsamic vinegar",
    ],
  },

  // ENTREES
  {
    id: "ent-001",
    name: "Grilled Ribeye Steak",
    description:
      "12oz prime ribeye grilled to perfection, served with garlic mashed potatoes and sautéed vegetables",
    price: 38.99,
    category: "entrees",
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: false,
      vegan: false,
      glutenFree: true,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 25,
    calories: 850,
    ingredients: [
      "Ribeye steak",
      "Garlic",
      "Potatoes",
      "Butter",
      "Mixed vegetables",
      "Rosemary",
    ],
  },
  {
    id: "ent-002",
    name: "Pan-Seared Salmon",
    description:
      "Fresh Atlantic salmon with lemon caper butter sauce, wild rice, and roasted asparagus",
    price: 28.99,
    category: "entrees",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: false,
      vegan: false,
      glutenFree: true,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 22,
    calories: 620,
    ingredients: [
      "Salmon fillet",
      "Capers",
      "Lemon",
      "Butter",
      "Wild rice",
      "Asparagus",
    ],
  },
  {
    id: "ent-003",
    name: "Truffle Mushroom Risotto",
    description:
      "Creamy Arborio rice with wild mushrooms, truffle oil, and aged Parmesan",
    price: 22.99,
    category: "entrees",
    image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: true,
      vegan: false,
      glutenFree: false,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 20,
    calories: 580,
    ingredients: [
      "Arborio rice",
      "Wild mushrooms",
      "Truffle oil",
      "Parmesan cheese",
      "Shallots",
      "White wine",
      "Vegetable broth",
    ],
  },
  {
    id: "ent-004",
    name: "Herb-Crusted Chicken",
    description:
      "Free-range chicken breast with herb crust, served with roasted fingerling potatoes and green beans",
    price: 24.99,
    category: "entrees",
    image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 23,
    calories: 520,
    ingredients: [
      "Chicken breast",
      "Panko breadcrumbs",
      "Fresh herbs",
      "Fingerling potatoes",
      "Green beans",
      "Garlic",
    ],
  },
  {
    id: "ent-005",
    name: "Eggplant Parmesan",
    description:
      "Breaded eggplant layered with marinara and mozzarella, served over spaghetti",
    price: 19.99,
    category: "entrees",
    image: "https://images.unsplash.com/photo-1625944525904-3a8c6aef87ff?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: true,
      vegan: false,
      glutenFree: false,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 20,
    calories: 680,
    ingredients: [
      "Eggplant",
      "Mozzarella cheese",
      "Marinara sauce",
      "Parmesan cheese",
      "Spaghetti",
      "Basil",
    ],
  },
  {
    id: "ent-006",
    name: "Thai Basil Stir Fry",
    description:
      "Spicy stir-fried vegetables and tofu in Thai basil sauce with jasmine rice",
    price: 17.99,
    category: "entrees",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: true,
      vegan: true,
      glutenFree: true,
      containsNuts: false,
      spicy: true,
    },
    prepTimeMinutes: 15,
    calories: 420,
    ingredients: [
      "Tofu",
      "Thai basil",
      "Bell peppers",
      "Snap peas",
      "Jasmine rice",
      "Soy sauce",
      "Chili garlic sauce",
    ],
  },

  // DRINKS
  {
    id: "drk-001",
    name: "Fresh Lemonade",
    description: "House-made lemonade with fresh mint",
    price: 4.99,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: true,
      vegan: true,
      glutenFree: true,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 5,
    calories: 120,
    ingredients: ["Fresh lemons", "Sugar", "Water", "Fresh mint"],
  },
  {
    id: "drk-002",
    name: "Craft Iced Tea",
    description: "Premium black tea infused with peach, served over ice",
    price: 3.99,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: true,
      vegan: true,
      glutenFree: true,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 3,
    calories: 80,
    ingredients: ["Black tea", "Peach puree", "Ice"],
  },
  {
    id: "drk-003",
    name: "Espresso",
    description: "Double shot of premium Italian espresso",
    price: 3.49,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: true,
      vegan: true,
      glutenFree: true,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 4,
    calories: 5,
    ingredients: ["Espresso beans"],
  },
  {
    id: "drk-004",
    name: "Cappuccino",
    description:
      "Espresso with steamed milk and velvety foam, dusted with cocoa",
    price: 4.99,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: true,
      vegan: false,
      glutenFree: true,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 6,
    calories: 90,
    ingredients: ["Espresso", "Whole milk", "Cocoa powder"],
  },

  // DESSERTS
  {
    id: "des-001",
    name: "Classic Tiramisu",
    description:
      "Espresso-soaked ladyfingers with mascarpone cream and cocoa dusting",
    price: 9.99,
    category: "desserts",
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: true,
      vegan: false,
      glutenFree: false,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 5,
    calories: 450,
    ingredients: [
      "Ladyfingers",
      "Mascarpone cheese",
      "Espresso",
      "Cocoa powder",
      "Eggs",
      "Sugar",
    ],
  },
  {
    id: "des-002",
    name: "New York Cheesecake",
    description:
      "Creamy vanilla cheesecake on graham cracker crust with berry compote",
    price: 8.99,
    category: "desserts",
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: true,
      vegan: false,
      glutenFree: false,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 5,
    calories: 580,
    ingredients: [
      "Cream cheese",
      "Graham crackers",
      "Fresh berries",
      "Sugar",
      "Vanilla extract",
      "Eggs",
    ],
  },
  {
    id: "des-003",
    name: "Chocolate Lava Cake",
    description:
      "Warm chocolate cake with molten center, served with vanilla gelato",
    price: 10.99,
    category: "desserts",
    image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: true,
      vegan: false,
      glutenFree: false,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 15,
    calories: 720,
    ingredients: [
      "Dark chocolate",
      "Butter",
      "Eggs",
      "Sugar",
      "Flour",
      "Vanilla gelato",
    ],
  },
  {
    id: "des-004",
    name: "Fresh Fruit Sorbet Trio",
    description: "Three scoops: mango, raspberry, and lemon sorbet",
    price: 7.99,
    category: "desserts",
    image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=300&fit=crop",
    available: true,
    dietary: {
      vegetarian: true,
      vegan: true,
      glutenFree: true,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 3,
    calories: 280,
    ingredients: ["Mango puree", "Raspberries", "Lemons", "Sugar", "Water"],
  },
];

/**
 * Get all unique menu categories.
 */
export function getMenuCategories(): string[] {
  return Array.from(new Set(mockMenuItems.map((item) => item.category)));
}

/**
 * Get menu items by category.
 */
export function getMenuItemsByCategory(
  category: string
): MenuItem[] {
  return mockMenuItems.filter((item) => item.category === category);
}

/**
 * Get menu item by ID.
 */
export function getMenuItemById(id: string): MenuItem | undefined {
  return mockMenuItems.find((item) => item.id === id);
}

/**
 * Search menu items by query string.
 */
export function searchMenuItems(query: string): MenuItem[] {
  const lowerQuery = query.toLowerCase();
  return mockMenuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter menu items based on various criteria.
 */
export function filterMenuItems(filters: {
  category?: string;
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  maxPrice?: number;
  availableOnly?: boolean;
}): MenuItem[] {
  return mockMenuItems.filter((item) => {
    if (filters.category && filters.category !== "all" && item.category !== filters.category) {
      return false;
    }
    if (filters.vegetarian && !item.dietary.vegetarian) {
      return false;
    }
    if (filters.vegan && !item.dietary.vegan) {
      return false;
    }
    if (filters.glutenFree && !item.dietary.glutenFree) {
      return false;
    }
    if (filters.maxPrice && item.price > filters.maxPrice) {
      return false;
    }
    if (filters.availableOnly && !item.available) {
      return false;
    }
    return true;
  });
}
