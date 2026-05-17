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
