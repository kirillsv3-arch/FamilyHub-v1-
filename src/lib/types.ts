/**
 * FIRESTORE DATA ARCHITECTURE
 * 
 * 1. users
 *    - Collection: `users`
 *    - Document ID: `uid` (from Firebase Auth)
 *    - Fields:
 *      - uid: string
 *      - name: string
 *      - email: string
 *      - dob: string (ISO date or similar)
 *      - familyId: string | null
 *      - createdAt: timestamp
 * 
 * 2. families
 *    - Collection: `families`
 *    - Document ID: auto-generated or custom unique string
 */

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  dob: string;
  familyId: string | null;
  partnerId?: string | null;
  createdAt: any;
  emotions?: EmotionState;
  statusTag?: StatusTag;
  nutrientGoals?: NutrientGoals;
}

export interface NutrientGoals {
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

export interface EmotionState {
  mood: number;    // 1-10
  stress: number;  // 1-10
  energy: number;  // 1-10
  sleep: number;   // 1-10
  updatedAt: any;
}

export interface StatusTag {
  text: string;
  emoji: string;
  updatedAt: any;
}

export interface HeartStats {
  sent: number;
  received: number;
  period: 'all' | 'month';
  lastSentAt?: any;
}

export interface HeartSignal {
  id: string;
  senderId: string;
  receiverId: string;
  count: number;
  timestamp: any;
}

export interface Family {
  id: string;
  name: string;
  code: string;
  createdAt: any;
  creatorId: string;
  currency?: number; // Shared family coins
  inShop?: {
    [uid: string]: {
      userName: string;
      shopId: string;
      shopName: string;
      timestamp: any;
    }
  }
}

export interface ShoppingItem {
  id: string;
  title: string;
  completed: boolean;
  familyId: string;
  createdBy: string;
  createdAt: any;
  shopId: string;
  priority: 'normal' | 'urgent';
  price?: number;
  link?: string;
  isOrdered?: boolean;
  quantity?: number;
  unit?: string;
  metadata?: {
    source?: string; // e.g., "из меню: Обед"
    recipeId?: string;
  }
}

export interface Recipe {
  id: string;
  title: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  link?: string;
  comment?: string;
  ingredients: RecipeIngredient[];
  familyId: string;
  createdBy: string;
  createdAt: any;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
}

export interface MealPlan {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId: string;
  recipeTitle: string;
  familyId: string;
  nutrients: {
    calories: number;
    proteins: number;
    fats: number;
    carbs: number;
  };
  ingredients: {
    name: string;
    amount: number;
    unit: string;
    haveAtHome: boolean;
  }[];
}

export interface Tamagotchi {
  familyId: string;
  level: number;
  xp: number;
  satiety: number;   // 0-100
  happiness: number; // 0-100
  energy: number;    // 0-100
  stage: 'egg' | 'kitten' | 'junior' | 'adult';
  items: string[];   // Purchased item IDs
  lastChecked: any;  // Timestamp
}

export interface TamagotchiItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'hat' | 'decor' | 'furniture' | 'food';
}

export interface WishlistItem {
  id: string;
  title: string;
  price?: number;
  isMaterial: boolean;
  familyId: string;
  ownerId: string;
  createdAt: any;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  date: string;
  matrix: 'urgent-important' | 'urgent-unimportant' | 'unurgent-important' | 'unurgent-unimportant';
  familyId: string;
  createdBy: string;
  assigneeId?: string;
  completed: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  subcategoryId?: string;
  description: string;
  date: any;
  familyId: string;
  userId: string;
  userName: string;
  isRecurring?: boolean;
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  limit?: number;
  familyId: string;
  subcategories?: { id: string, name: string }[];
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  wishlistId?: string;
  familyId: string;
}

export interface Loan {
  id: string;
  name: string;
  type: 'consumer' | 'card';
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  paymentDate: number;
  interestRate?: number;
  paymentType?: 'annuity' | 'differentiated';
  startDate?: any;
  familyId: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'personal' | 'holiday' | 'birthday';
  familyId: string;
  userId?: string;
}

export interface RecurringTemplate {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  dayOfMonth: number;
  familyId: string;
}
