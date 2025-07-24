export interface Profile {
  _id?: string;
  id?: string;
  name: string;
  avatar?: string;
  color?: string;
  createdAt?: string;
}

export interface UserGroup {
  _id?: string;
  id?: string;
  name: string;
  type: 'family' | 'roommates' | 'personal' | 'other' | 'friends';
  profiles: Profile[];
  createdAt?: string;
}

export interface ProfileTransaction {
  _id?: string;
  id?: string;
  profileId: string;
  groupId: string;
  amount: number;
  date: string;
  description: string;
  type: 'income' | 'expense';
  category: string;
  createdAt?: string;
}

export interface ProfileBudget {
  _id?: string;
  id?: string;
  profileId: string;
  groupId: string;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  createdAt?: string;
}

export interface ViewMode {
  type: 'individual' | 'group';
  profileId?: string;
  groupId: string;
}

// New Types for Expense Splitting
export interface Balance {
  profileId: string;
  name: string;
  color?: string;
  paid: number;
  balance: number; // positive if owed, negative if owes
}

export interface Settlement {
  from: string; // Name of person who pays
  to: string;   // Name of person who receives
  amount: number;
}

export interface ExpenseSplitData {
  totalExpense: number;
  perPersonShare: number;
  balances: Balance[];
  settlements: Settlement[];
}