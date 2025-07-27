export interface Asset {
  _id: string;
  id: string;
  name: string;
  type: 'Vehicle' | 'Property' | 'Electronics' | 'Investment' | 'Other';
  initialValue: number;
  currentValue: number;
  purchaseDate: string; // ISO String
  depreciationRate: number;
  totalExpenses?: number; // This will be calculated on the frontend
}

export interface Transaction {
  _id?: string;
  id?: string;
  profileId: string;
  groupId: string;
  assetId?: string; // For linking expenses to assets
  amount: number;
  date: string;
  description: string;
  type: 'income' | 'expense' | 'settlement_paid' | 'settlement_received';
  category: string;
  createdAt?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringDayOfMonth?: number;
}

// This is the new type that was missing from the export
export type TransactionFormData = Omit<Transaction, 'id' | '_id' | 'profileId' | 'groupId' | 'createdAt'>;

export interface MonthlyExpense {
  month: string;
  amount: number;
}

export interface CategoryExpense {
  category: string;
  amount: number;
  color: string;
}

export interface Budget {
  _id?: string;
  id?: string;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface FormErrors {
  amount?: string;
  date?: string;
  description?: string;
  category?: string;
}

export interface SpendingInsight {
  type: 'warning' | 'success' | 'info';
  title: string;
  description: string;
  icon: string;
}