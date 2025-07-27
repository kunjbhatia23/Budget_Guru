import { apiRequest } from './api'; // Import the correct function
import { Asset } from '@/types/finance';

const API_URL = '/api/assets';

export const assetApi = {
  async getAll(profileId: string | undefined, groupId: string, viewType: 'individual' | 'group'): Promise<Asset[]> {
    try {
      // Map your internal viewType to what the API expects
      const mappedViewType = viewType === 'individual' ? 'personal' : 'group';
      const url = `${API_URL}?profileId=${profileId || ''}&groupId=${groupId}&viewType=${mappedViewType}`;
      return await apiRequest<Asset[]>(url);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      throw new Error('Failed to fetch assets. Please check your connection and try again.');
    }
  },

  async create(assetData: Omit<Asset, 'id' | '_id' | 'currentValue' | 'totalExpenses'>): Promise<Asset> {
    try {
      if (!assetData.name?.trim()) {
        throw new Error('Asset name is required');
      }
      if (assetData.initialValue <= 0) {
        throw new Error('Initial value must be greater than 0');
      }

      return await apiRequest<Asset>(API_URL, {
        method: 'POST',
        body: JSON.stringify(assetData),
      });
    } catch (error) {
      console.error('Failed to create asset:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create asset. Please try again.'
      );
    }
  },

  async update(id: string, assetData: Partial<Omit<Asset, 'id' | '_id'>>): Promise<Asset> {
    try {
      if (!id) {
        throw new Error('Asset ID is required for update');
      }
      return await apiRequest<Asset>(`${API_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(assetData),
      });
    } catch (error) {
      console.error('Failed to update asset:', error);
      throw new Error('Failed to update asset. Please try again.');
    }
  },

  async delete(id: string): Promise<{ message: string }> {
    try {
      if (!id) {
        throw new Error('Asset ID is required for deletion');
      }
      return await apiRequest<{ message: string }>(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete asset:', error);
      throw new Error('Failed to delete asset. Please try again.');
    }
  },
};