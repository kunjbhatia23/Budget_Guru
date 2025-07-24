'use client';

import * as React from 'react';
import { Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProfileStore } from '@/store/profile-store';

export function ViewModeToggle() {
  const {
    currentGroup,
    viewMode,
    toggleViewMode,
  } = useProfileStore();

  if (!currentGroup) return null;

  const isGroupView = viewMode.type === 'group';

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">View:</span>
        <Badge variant={isGroupView ? 'default' : 'secondary'}>
          {isGroupView ? (
            <>
              <Users className="h-3 w-3 mr-1" />
              Group
            </>
          ) : (
            <>
              <User className="h-3 w-3 mr-1" />
              Individual
            </>
          )}
        </Badge>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={toggleViewMode}
        className="h-8"
      >
        {isGroupView ? (
          <>
            <User className="h-4 w-4 mr-2" />
            Switch to My View
          </>
        ) : (
          <>
            <Users className="h-4 w-4 mr-2" />
            Switch to Group View
          </>
        )}
      </Button>
    </div>
  );
}