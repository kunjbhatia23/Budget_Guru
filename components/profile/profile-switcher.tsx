'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus, Users, User, Edit } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useProfileStore } from '@/store/profile-store';
import { Profile, UserGroup } from '@/types/profile';
import { CreateProfileDialog } from './create-profile-dialog';
import { EditProfileDialog } from './edit-profile-dialog';

interface ProfileSwitcherProps {
  className?: string;
}

export function ProfileSwitcher({ className }: ProfileSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  
  const {
    currentGroup,
    currentProfile,
    groups,
    setCurrentGroup,
    setCurrentProfile,
    viewMode,
    setViewMode,
  } = useProfileStore();

  /**
   * CRITICAL FIX: This function now accepts both the group and the profile.
   * This ensures that when a user selects a profile from any group,
   * the application's state for BOTH the current group and current profile is updated,
   * preventing inconsistent states that caused the bug.
   */
  const handleProfileSelect = (group: UserGroup, profile: Profile) => {
    setCurrentGroup(group);
    setCurrentProfile(profile);
    setOpen(false);
  };

  const toggleViewMode = () => {
    if (!currentGroup) return;
    
    const newMode = viewMode.type === 'individual' ? 'group' : 'individual';
    setViewMode({
      type: newMode,
      profileId: newMode === 'individual' ? currentProfile?._id || currentProfile?.id : undefined,
      groupId: currentGroup._id || currentGroup.id || '',
    });
    setOpen(false);
  };

  const getDisplayText = () => {
    if (!currentGroup) return 'Select Profile';
    
    if (viewMode.type === 'group') {
      return `${currentGroup.name} (Group View)`;
    }
    
    return currentProfile ? `${currentProfile.name}` : currentGroup.name;
  };

  const getDisplayIcon = () => {
    if (viewMode.type === 'group') {
      return <Users className="h-4 w-4" />;
    }
    return <User className="h-4 w-4" />;
  };

  if (groups.length === 0) {
    return <CreateProfileDialog />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select profile"
          className={cn('w-[200px] justify-between', className)}
        >
          <div className="flex items-center gap-2">
            {getDisplayIcon()}
            <span className="truncate">{getDisplayText()}</span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search profiles..." />
          <CommandList>
            <CommandEmpty>No profiles found.</CommandEmpty>
            
            {currentGroup && (
              <>
                <CommandGroup heading="Actions">
                  <CommandItem onSelect={toggleViewMode} className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      {viewMode.type === 'group' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                      <span>
                        Switch to {viewMode.type === 'group' ? 'Individual' : 'Group View'}
                      </span>
                    </div>
                  </CommandItem>
                   <CommandItem onSelect={() => {}}>
                    <EditProfileDialog group={currentGroup} />
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {groups.map((group) => (
              <CommandGroup key={group._id || group.id} heading={group.name}>
                {group.profiles.map((profile) => (
                  <CommandItem
                    key={profile._id || profile.id}
                    onSelect={() => handleProfileSelect(group, profile)} // Pass both group and profile here
                    className="text-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback 
                          className="text-xs"
                          style={{ backgroundColor: profile.color }}
                        >
                          {profile.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{profile.name}</span>
                      {currentProfile?._id === profile._id && viewMode.type === 'individual' && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={() => {}}>
                <div className="w-full">
                  <CreateProfileDialog />
                </div>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}