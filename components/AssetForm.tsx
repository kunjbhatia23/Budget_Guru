'use client';

import { useState, useEffect } from 'react';
import { Asset } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useProfileStore } from '@/store/profile-store';
import { assetApi } from '@/lib/asset-api';
import { Save, X } from 'lucide-react';

interface AssetFormProps {
  assetToEdit?: Asset;
  onSave: () => void;
  onCancel: () => void;
}

const assetTypes: Asset['type'][] = ['Vehicle', 'Property', 'Electronics', 'Investment', 'Other'];

export function AssetForm({ assetToEdit, onSave, onCancel }: AssetFormProps) {
  const { toast } = useToast();
  const { currentProfile, getCurrentGroupId } = useProfileStore();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<Asset['type']>('Other');
  const [initialValue, setInitialValue] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [depreciationRate, setDepreciationRate] = useState('');

  useEffect(() => {
    if (assetToEdit) {
      setName(assetToEdit.name);
      setType(assetToEdit.type);
      setInitialValue(String(assetToEdit.initialValue));
      setPurchaseDate(new Date(assetToEdit.purchaseDate).toISOString().split('T')[0]);
      setDepreciationRate(String(assetToEdit.depreciationRate));
    } else {
      setName('');
      setType('Vehicle'); // Default to a common type
      setInitialValue('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setDepreciationRate('');
    }
  }, [assetToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const profileId = currentProfile?._id;
    const groupId = getCurrentGroupId();

    if (!name || !type || !initialValue || !purchaseDate || !profileId || !groupId) {
      toast({ title: 'Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }
    
    const parsedInitialValue = parseFloat(initialValue);

    const assetData = {
      name,
      type,
      initialValue: parsedInitialValue,
      currentValue: assetToEdit ? assetToEdit.currentValue : parsedInitialValue, // FIX: Set currentValue on creation
      purchaseDate: new Date(purchaseDate).toISOString(),
      depreciationRate: parseFloat(depreciationRate) || 0,
      profileId,
      groupId,
    };

    try {
      if (assetToEdit) {
        await assetApi.update(assetToEdit.id, assetData);
        toast({ title: 'Success', description: 'Asset updated successfully.' });
      } else {
        await assetApi.create(assetData as any);
        toast({ title: 'Success', description: 'Asset added successfully.' });
      }
      onSave();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save asset.', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{assetToEdit ? 'Edit Asset' : 'Add New Asset'}</CardTitle>
        <CardDescription>Track the value and costs of your significant assets.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Asset Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Honda Civic" />
            </div>
            <div>
              <Label>Asset Type</Label>
              <Select value={type} onValueChange={(v: Asset['type']) => setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {assetTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="initialValue">Initial Value (₹)</Label>
              <Input id="initialValue" type="number" value={initialValue} onChange={(e) => setInitialValue(e.target.value)} placeholder="370000" />
            </div>
            <div>
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input id="purchaseDate" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="depreciationRate">Annual Depreciation Rate (%)</Label>
            <Input id="depreciationRate" type="number" value={depreciationRate} onChange={(e) => setDepreciationRate(e.target.value)} placeholder="15" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" /> Save Asset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}