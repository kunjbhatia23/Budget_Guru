'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, X, Trash2, Edit } from 'lucide-react';
import { profileApi } from '@/lib/profile-api';
import { useProfileStore } from '@/store/profile-store';
import { UserGroup, Profile } from '@/types/profile';
import { useToast } from '@/hooks/use-toast';

const profileColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

interface EditProfileDialogProps {
  group: UserGroup;
}

export function EditProfileDialog({ group }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState(group.name);
  const [profiles, setProfiles] = useState(group.profiles);
  
  const { groups, setGroups, setCurrentGroup, setCurrentProfile } = useProfileStore();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setGroupName(group.name);
      setProfiles(group.profiles);
    }
  }, [open, group]);

  const addProfile = () => {
    if (profiles.length < 10) {
      setProfiles([...profiles, { 
        name: '', 
        color: profileColors[profiles.length % profileColors.length] 
      }]);
    }
  };

  const removeProfile = async (profileId: string, index: number) => {
    if (profiles.length <= 1) {
      toast({
        title: 'Error',
        description: 'You cannot delete the last profile. Delete the group instead.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const updatedGroup = await profileApi.deleteProfile(group._id!, profileId);
      const updatedGroups = groups.map(g => g._id === group._id ? updatedGroup : g);
      setGroups(updatedGroups);
      
      // Update the current selection if the deleted profile was active
      setCurrentGroup(updatedGroup);

      toast({
        title: 'Profile Deleted',
        description: 'The profile and all its data have been deleted.',
      });
      setProfiles(updatedGroup.profiles); // Refresh local state
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete profile.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteGroup = async () => {
    setLoading(true);
    try {
      await profileApi.deleteGroup(group._id!);
      const updatedGroups = groups.filter(g => g._id !== group._id);
      setGroups(updatedGroups);

      toast({
        title: 'Group Deleted',
        description: `The group "${group.name}" and all its data have been deleted.`,
      });
      setOpen(false);
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete group.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  const updateProfile = (index: number, field: 'name' | 'color', value: string) => {
    setProfiles(profiles.map((profile, i) => 
      i === index ? { ...profile, [field]: value } : profile
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validProfiles = profiles.filter(p => p.name.trim());
    if (!groupName.trim() || validProfiles.length === 0) {
      toast({
        title: 'Error',
        description: 'Group name and at least one profile are required.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const updatedGroupData: Omit<UserGroup, '_id' | 'createdAt'> = {
        name: groupName.trim(),
        type: group.type,
        profiles: validProfiles.map(p => ({
          id: p._id,
          name: p.name.trim(),
          color: p.color,
        })),
      };

      const updatedGroup = await profileApi.updateGroup(group._id!, updatedGroupData);
      const updatedGroups = groups.map(g => g._id === group._id ? updatedGroup : g);
      setGroups(updatedGroups);
      setCurrentGroup(updatedGroup);
      
      toast({
        title: 'Success',
        description: 'Group updated successfully.',
      });
      setOpen(false);
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: 'Error',
        description: 'Failed to update group.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Edit className="h-4 w-4 mr-2"/> Edit Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit "{group.name}"</DialogTitle>
          <DialogDescription>
            Update group name, add, edit, or remove profiles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
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
                <div key={profile._id || index} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={profiles.length <= 1}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the profile "{profile.name}" and all of its associated transactions and budgets.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeProfile(profile._id!, index)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row sm:justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" disabled={loading}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Group
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{group.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the entire group, including all profiles and their financial data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteGroup}>
                    Confirm Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}