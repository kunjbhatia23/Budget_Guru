import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, UserGroup, ViewMode } from '@/types/profile';

interface ProfileState {
  // Current state
  currentGroup: UserGroup | null;
  currentProfile: Profile | null;
  viewMode: ViewMode;
  
  // Available data
  groups: UserGroup[];
  
  // Actions
  setCurrentGroup: (group: UserGroup | null) => void;
  setCurrentProfile: (profile: Profile | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setGroups: (groups: UserGroup[]) => void;
  
  // Computed getters
  getCurrentGroupId: () => string | null;
  getCurrentProfileId: () => string | null;
  isGroupView: () => boolean;
  isIndividualView: () => boolean;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentGroup: null,
      currentProfile: null,
      viewMode: { type: 'individual', groupId: '' },
      groups: [],

      // Actions
      setCurrentGroup: (group) => {
        const { currentProfile } = get();
        set({ currentGroup: group });
        
        // If the new group doesn't contain the current profile, update it
        if (group && (!currentProfile || !group.profiles.some(p => p._id === currentProfile._id))) {
            const firstProfile = group.profiles[0];
            set({ 
              currentProfile: firstProfile,
              viewMode: { 
                type: 'individual', 
                profileId: firstProfile?._id || firstProfile?.id,
                groupId: group._id || group.id || ''
              }
            });
        } else if (!group) { // If group is null, clear profile
            set({ currentProfile: null });
        }
      },

      setCurrentProfile: (profile) => {
        set({ currentProfile: profile });
        
        const { currentGroup } = get();
        if (profile && currentGroup) {
          set({
            viewMode: {
              type: 'individual',
              profileId: profile._id || profile.id,
              groupId: currentGroup._id || currentGroup.id || ''
            }
          });
        }
      },

      setViewMode: (mode) => set({ viewMode: mode }),

      setGroups: (groups) => {
        const { currentGroup, currentProfile } = get();
        const stillExists = groups.some(g => g._id === currentGroup?._id);
        
        // If the current group was deleted, select the first available group.
        if (!stillExists && groups.length > 0) {
            const firstGroup = groups[0];
            const firstProfile = firstGroup.profiles[0];
            set({ 
                groups, 
                currentGroup: firstGroup, 
                currentProfile: firstProfile,
                viewMode: {
                    type: 'individual',
                    profileId: firstProfile?._id || firstProfile?.id,
                    groupId: firstGroup._id || firstGroup.id || ''
                }
            });
        } else if (groups.length === 0) {
            set({ groups: [], currentGroup: null, currentProfile: null });
        } else {
            set({ groups });
        }
      },


      // Computed getters
      getCurrentGroupId: () => {
        const { currentGroup } = get();
        return currentGroup?._id || currentGroup?.id || null;
      },

      getCurrentProfileId: () => {
        const { currentProfile } = get();
        return currentProfile?._id || currentProfile?.id || null;
      },

      isGroupView: () => get().viewMode.type === 'group',

      isIndividualView: () => get().viewMode.type === 'individual',
    }),
    {
      name: 'profile-store',
      partialize: (state) => ({
        currentGroup: state.currentGroup,
        currentProfile: state.currentProfile,
        viewMode: state.viewMode,
      }),
    }
  )
);