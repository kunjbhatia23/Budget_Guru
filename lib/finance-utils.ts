// Update file: lib/finance-utils.ts
import { Transaction, MonthlyExpense, CategoryExpense, Budget, SpendingInsight } from '@/types/finance';
import { VALIDATION_CONFIG, UI_CONFIG } from './constants';

export function formatCurrency(amount: number, currencyCode: string = 'INR', locale: string = 'en-IN'): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '';
  }

  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);

  try {
    const formattedAmount = new Intl.NumberFormat(locale, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absoluteAmount);

    return isNegative ? `- Rs ${formattedAmount}` : `Rs ${formattedAmount}`;
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `${isNegative ? '-' : ''}Rs ${absoluteAmount.toFixed(2)}`;
  }
}

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const getMonthlyExpenses = (transactions: Transaction[]): MonthlyExpense[] => {
  try {
    const monthlyData: { [key: string]: number } = {};
    
    transactions
      .filter(transaction => transaction.type === 'expense' && transaction.amount > 0)
      .forEach(transaction => {
        try {
          const date = new Date(transaction.date);
          if (isNaN(date.getTime())) return;
          
          const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          
          if (!monthlyData[monthName]) {
            monthlyData[monthName] = 0;
          }
          monthlyData[monthName] += transaction.amount;
        } catch (error) {
          console.warn('Error processing transaction date:', transaction.date);
        }
      });

    return Object.entries(monthlyData)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => {
        try {
          return new Date(a.month).getTime() - new Date(b.month).getTime();
        } catch {
          return 0;
        }
      })
      .slice(-6);
  } catch (error) {
    console.error('Error calculating monthly expenses:', error);
    return [];
  }
};

export const getCategoryExpenses = (transactions: Transaction[]): CategoryExpense[] => {
  try {
    const categoryData: { [key: string]: number } = {};
    
    transactions
      .filter(transaction => 
        transaction.type === 'expense' && 
        transaction.amount > 0 && 
        transaction.category?.trim()
      )
      .forEach(transaction => {
        const category = transaction.category.trim();
        if (!categoryData[category]) {
          categoryData[category] = 0;
        }
        categoryData[category] += transaction.amount;
      });

    return Object.entries(categoryData)
      .map(([category, amount], index) => ({
        category,
        amount,
        color: UI_CONFIG.chartColors[index % UI_CONFIG.chartColors.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  } catch (error) {
    console.error('Error calculating category expenses:', error);
    return [];
  }
};

export const calculateBudgetStatus = (budgets: Budget[], transactions: Transaction[]): Budget[] => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyExpenses = transactions
      .filter(t => 
        t.type === 'expense' && 
        t.date.startsWith(currentMonth) && 
        t.amount > 0 &&
        t.category?.trim()
      )
      .reduce((acc, t) => {
        const category = t.category.trim();
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {} as { [key: string]: number });

    return budgets.map(budget => {
      const spent = monthlyExpenses[budget.category] || 0;
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        ...budget,
        spent,
        remaining,
        percentage: Math.max(0, percentage)
      };
    });
  } catch (error) {
    console.error('Error calculating budget status:', error);
    return budgets.map(budget => ({
      ...budget,
      spent: 0,
      remaining: budget.amount,
      percentage: 0
    }));
  }
};

export const getSpendingInsights = (transactions: Transaction[], budgets: Budget[]): SpendingInsight[] => {
  try {
    const insights: SpendingInsight[] = [];
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonthExpenses = transactions.filter(t => 
      t.type === 'expense' && 
      t.date.startsWith(currentMonth) &&
      t.amount > 0
    );
    
    // Budget warnings
    const budgetStatus = calculateBudgetStatus(budgets, transactions);
    budgetStatus.forEach(budget => {
      if (budget.percentage > 90) {
        insights.push({
          type: 'warning',
          title: `${budget.category} Budget Alert`,
          description: `You've spent ${budget.percentage.toFixed(0)}% of your ${budget.category} budget this month.`,
          icon: 'AlertTriangle'
        });
      }
    });

    // Top spending category
    const categoryExpenses = getCategoryExpenses(thisMonthExpenses);
    if (categoryExpenses.length > 0) {
      const topCategory = categoryExpenses[0];
      insights.push({
        type: 'info',
        title: 'Top Spending Category',
        description: `${topCategory.category} accounts for ${formatCurrency(topCategory.amount)} of your spending this month.`,
        icon: 'TrendingUp'
      });
    }

    // Spending trend
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthKey = lastMonth.toISOString().slice(0, 7);
    
    const thisMonthTotal = thisMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const lastMonthTotal = transactions
      .filter(t => 
        t.type === 'expense' && 
        t.date.startsWith(lastMonthKey) &&
        t.amount > 0
      )
      .reduce((sum, t) => sum + t.amount, 0);

    if (lastMonthTotal > 0) {
      const change = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
      if (change > 10) {
        insights.push({
          type: 'warning',
          title: 'Increased Spending',
          description: `Your spending increased by ${change.toFixed(1)}% compared to last month.`,
          icon: 'TrendingUp'
        });
      } else if (change < -10) {
        insights.push({
          type: 'success',
          title: 'Great Savings!',
          description: `You've reduced spending by ${Math.abs(change).toFixed(1)}% compared to last month.`,
          icon: 'TrendingDown'
        });
      }
    }

    return insights.slice(0, 3);
  } catch (error) {
    console.error('Error generating spending insights:', error);
    return [];
  }
};

export const validateTransaction = (amount: string, date: string, description: string, category: string) => {
  const errors: { amount?: string; date?: string; description?: string; category?: string } = {};
  
  // Amount validation
  const numAmount = Number(amount);
  if (!amount || isNaN(numAmount) || numAmount < VALIDATION_CONFIG.minAmount) {
    errors.amount = `Please enter a valid amount greater than ${formatCurrency(VALIDATION_CONFIG.minAmount)}`;
  } else if (numAmount > VALIDATION_CONFIG.maxAmount) {
    errors.amount = `Amount cannot exceed ${formatCurrency(VALIDATION_CONFIG.maxAmount)}`;
  }
  
  // Date validation
  if (!date) {
    errors.date = 'Please select a date';
  } else {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (isNaN(selectedDate.getTime())) {
      errors.date = 'Please enter a valid date';
    } else if (selectedDate > today) {
      errors.date = 'Date cannot be in the future';
    }
  }
  
  // Description validation
  const trimmedDescription = description.trim();
  if (!trimmedDescription) {
    errors.description = 'Please enter a description';
  } else if (trimmedDescription.length < VALIDATION_CONFIG.minDescriptionLength) {
    errors.description = `Description must be at least ${VALIDATION_CONFIG.minDescriptionLength} characters long`;
  } else if (trimmedDescription.length > VALIDATION_CONFIG.maxDescriptionLength) {
    errors.description = `Description cannot exceed ${VALIDATION_CONFIG.maxDescriptionLength} characters`;
  }

  // Category validation
  const trimmedCategory = category.trim();
  if (!trimmedCategory) {
    errors.category = 'Please select a category';
  } else if (trimmedCategory.length > VALIDATION_CONFIG.maxCategoryLength) {
    errors.category = `Category name cannot exceed ${VALIDATION_CONFIG.maxCategoryLength} characters`;
  }
  
  return errors;
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Personal Care',
  'Groceries',
  'Rent/Mortgage',
  'Insurance',
  'Subscriptions',
  'Other'
] as const;

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investments',
  'Rental Income',
  'Side Hustle',
  'Gifts',
  'Refunds',
  'Other'
] as const;

export const safeParseFloat = (value: string | number): number => {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatDateForInput = (date: Date | string): string => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};