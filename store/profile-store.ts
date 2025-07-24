import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, UserGroup, ViewMode } from '@/types/profile';

interface ProfileState {
  currentGroup: UserGroup | null;
  currentProfile: Profile | null;
  viewMode: ViewMode;
  groups: UserGroup[];
  setCurrentGroup: (group: UserGroup) => void;
  setCurrentProfile: (group: UserGroup, profile: Profile) => void;
  setGroups: (groups: UserGroup[]) => void;
  toggleViewMode: () => void;
  getCurrentGroupId: () => string | null;
  getCurrentProfileId: () => string | null;
  isGroupView: () => boolean;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      currentGroup: null,
      currentProfile: null,
      viewMode: { type: 'individual', groupId: '' },
      groups: [],

      setGroups: (groups) => {
        const { currentGroup } = get();
        const stillExists = groups.some(g => g._id === currentGroup?._id);
        
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

      setCurrentGroup: (group) => {
        set(() => {
          const firstProfile = group?.profiles[0] || null;
          return {
            currentGroup: group,
            currentProfile: firstProfile,
            viewMode: {
              type: 'individual',
              groupId: group?._id || group?.id || '',
              profileId: firstProfile?._id || firstProfile?.id
            }
          };
        });
      },

      // This function now correctly receives both group and profile
      setCurrentProfile: (group, profile) => {
        if (!profile || !group) {
            console.error("setCurrentProfile called with invalid arguments");
            return;
        }
        set({
          currentGroup: group,
          currentProfile: profile,
          viewMode: {
            type: 'individual',
            groupId: group._id || group.id || '',
            profileId: profile._id || profile.id,
          }
        });
      },

      toggleViewMode: () => {
        set((state) => {
          if (!state.currentGroup) return {};

          const isSwitchingToGroup = state.viewMode.type === 'individual';
          if (isSwitchingToGroup) {
            return {
              currentProfile: null, 
              viewMode: {
                type: 'group',
                groupId: state.currentGroup._id || state.currentGroup.id || '',
              }
            };
          } else { 
            const profileToSelect = state.currentGroup.profiles.find(p => p.name === 'Me') || state.currentGroup.profiles[0];
            return {
              currentProfile: profileToSelect,
              viewMode: {
                type: 'individual',
                groupId: state.currentGroup._id || state.currentGroup.id || '',
                profileId: profileToSelect._id || profileToSelect.id,
              }
            };
          }
        });
      },

      getCurrentGroupId: () => get().currentGroup?._id || null,
      getCurrentProfileId: () => {
        const { viewMode, currentProfile } = get();
        if (viewMode.type === 'individual') {
          return currentProfile?._id || null;
        }
        return null;
      },
      isGroupView: () => get().viewMode.type === 'group',
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
