import { Transaction, Budget } from '@/types/finance';
import { API_CONFIG } from './constants';

// Enhanced error handling
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API request handler with retry logic
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code
      );
    }

    // Handle cases where the response body might be empty (e.g., for a DELETE request)
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408, 'TIMEOUT');
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Network error occurred',
      0,
      'NETWORK_ERROR'
    );
  }
}

// Transaction API functions with enhanced error handling
export const transactionApi = {
  async getAll(): Promise<Transaction[]> {
    try {
      return await apiRequest<Transaction[]>('/api/transactions');
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw new Error('Failed to fetch transactions. Please check your connection and try again.');
    }
  },

  async create(transaction: Omit<Transaction, '_id' | 'createdAt'>): Promise<Transaction> {
    try {
      // Validate transaction data before sending
      if (!transaction.amount || transaction.amount <= 0) {
        throw new Error('Invalid transaction amount');
      }
      if (!transaction.description?.trim()) {
        throw new Error('Transaction description is required');
      }
      if (!transaction.category?.trim()) {
        throw new Error('Transaction category is required');
      }

      return await apiRequest<Transaction>('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(transaction),
      });
    } catch (error) {
      console.error('Failed to create transaction:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create transaction. Please try again.'
      );
    }
  },

  async update(id: string, transaction: Omit<Transaction, '_id' | 'createdAt'>): Promise<Transaction> {
    try {
      if (!id) {
        throw new Error('Transaction ID is required');
      }

      return await apiRequest<Transaction>(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(transaction),
      });
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw new Error('Failed to update transaction. Please try again.');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      if (!id) {
        throw new Error('Transaction ID is required');
      }

      await apiRequest<void>(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw new Error('Failed to delete transaction. Please try again.');
    }
  },
};

// Budget API functions with enhanced error handling
export const budgetApi = {
  async getAll(): Promise<Budget[]> {
    try {
      return await apiRequest<Budget[]>('/api/budgets');
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
      throw new Error('Failed to fetch budgets. Please check your connection and try again.');
    }
  },

  async saveAll(budgets: Omit<Budget, '_id' | 'spent' | 'remaining' | 'percentage'>[]): Promise<Budget[]> {
    try {
      // Validate budget data
      if (!Array.isArray(budgets)) {
        throw new Error('Invalid budget data format');
      }

      for (const budget of budgets) {
        if (!budget.category?.trim()) {
          throw new Error('Budget category is required');
        }
        if (!budget.amount || budget.amount <= 0) {
          throw new Error('Budget amount must be greater than 0');
        }
      }

      return await apiRequest<Budget[]>('/api/budgets', {
        method: 'POST',
        body: JSON.stringify(budgets),
      });
    } catch (error) {
      console.error('Failed to save budgets:', error);
      throw new Error('Failed to save budgets. Please try again.');
    }
  },
};