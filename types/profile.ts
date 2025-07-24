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