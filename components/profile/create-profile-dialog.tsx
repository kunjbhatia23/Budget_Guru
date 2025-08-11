'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, Users } from 'lucide-react';
import { profileApi } from '@/lib/profile-api';
import { useProfileStore } from '@/store/profile-store';
import { UserGroup } from '@/types/profile';
import { useToast } from '@/hooks/use-toast';

const profileColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export function CreateProfileDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState<'family' | 'roommates' | 'personal' | 'other' | 'friends'>('personal');
  const [profiles, setProfiles] = useState([
    { name: 'Me', color: profileColors[0] }
  ]);
  
  const { setGroups, groups } = useProfileStore();
  const { toast } = useToast();

  const addProfile = () => {
    if (profiles.length < 10) {
      setProfiles([...profiles, { 
        name: '', 
        color: profileColors[profiles.length % profileColors.length] 
      }]);
    }
  };

  const removeProfile = (index: number) => {
    if (profiles.length > 1) {
      setProfiles(profiles.filter((_, i) => i !== index));
    }
  };

  const updateProfile = (index: number, field: 'name' | 'color', value: string) => {
    setProfiles(profiles.map((profile, i) => 
      i === index ? { ...profile, [field]: value } : profile
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a group name',
        variant: 'destructive',
      });
      return;
    }

    const validProfiles = profiles.filter(p => p.name.trim());
    if (validProfiles.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one profile',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const newGroup: Omit<UserGroup, '_id' | 'createdAt'> = {
        name: groupName.trim(),
        type: groupType,
        profiles: validProfiles.map(p => ({
          name: p.name.trim(),
          color: p.color,
        })),
      };

      const createdGroup = await profileApi.createGroup(newGroup);
      setGroups([...groups, createdGroup]);
      
      toast({
        title: 'Success',
        description: `Created "${groupName}" with ${validProfiles.length} profile(s)`,
      });
      
      // Reset form
      setGroupName('');
      setGroupType('personal');
      setProfiles([{ name: 'Me', color: profileColors[0] }]);
      setOpen(false);
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create group. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Profile / Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Profile / Group
          </DialogTitle>
          <DialogDescription>
            Set up a new group with multiple profiles for tracking finances together.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  placeholder="e.g., Smith Family, Apartment 4B"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupType">Group Type</Label>
                <Select value={groupType} onValueChange={(value: any) => setGroupType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="roommates">Roommates</SelectItem>
                    <SelectItem value="friends">Friends</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Profiles</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProfile}
                disabled={profiles.length >= 10}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Profile
              </Button>
            </div>
            <div className="space-y-3">
              {profiles.map((profile, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: profile.color }}
                    />
                    <Input
                      placeholder={`Profile ${index + 1} name`}
                      value={profile.name}
                      onChange={(e) => updateProfile(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={profile.color}
                      onValueChange={(value) => updateProfile(index, 'color', value)}
                    >
                      <SelectTrigger className="w-20">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: profile.color }}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {profileColors.map((color) => (
                          <SelectItem key={color} value={color}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {profiles.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProfile(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}