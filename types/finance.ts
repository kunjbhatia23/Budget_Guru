export interface Transaction {
  _id?: string;
  id?: string;
  profileId: string; // ADDED
  groupId: string;   // ADDED
  amount: number;
  date: string;
  description: string;
  type: 'income' | 'expense' | 'settlement_paid' | 'settlement_received';
  category: string;
  createdAt?: string;
}

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