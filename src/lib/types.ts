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
 *    - Fields:
 *      - id: string
 *      - name: string (e.g., "Family Name")
 *      - code: string (unique 6-digit code for joining)
 *      - createdAt: timestamp
 *      - creatorId: string (uid of the user who created it)
 *
 * 3. shoppingList
 *    - Collection: `shoppingList`
 *    - Document ID: auto-generated
 *    - Fields:
 *      - id: string
 *      - title: string
 *      - completed: boolean
 *      - familyId: string (scoped to family)
 *      - createdBy: string (uid)
 *      - createdAt: timestamp
 *      - shopId: string (e.g., 'plan', 'magnit', 'lenta', etc.)
 *      - priority: 'normal' | 'urgent'
 */

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  dob: string;
  familyId: string | null;
  createdAt: any;
}

export interface Family {
  id: string;
  name: string;
  code: string;
  createdAt: any;
  creatorId: string;
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
}

export interface WishlistItem {
  id: string;
  title: string;
  price?: number;
  isMaterial: boolean;
  familyId: string;
  ownerId: string; // The person whose wish it is
  createdAt: any;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  matrix: 'urgent-important' | 'urgent-unimportant' | 'unurgent-important' | 'unurgent-unimportant';
  familyId: string;
  createdBy: string;
  completed: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  description: string;
  date: any;
  familyId: string;
  userId: string;
  userName: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  limit?: number;
  familyId: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  wishlistId?: string; // Optional link to a wish
  familyId: string;
}

export interface Loan {
  id: string;
  name: string;
  type: 'consumer' | 'card';
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  paymentDate: number; // Day of month (1-31)
  familyId: string;
}
