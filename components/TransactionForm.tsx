'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Transaction } from '@/types/finance';
import { validateTransaction, generateId, EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatCurrency, safeParseFloat } from '@/lib/finance-utils';
import { Plus, Edit3, DollarSign, Calendar, FileText, Tag, Save, X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfileStore } from '@/store/profile-store'; // Import useProfileStore

interface TransactionFormProps {
  onSubmit: (transaction: Transaction | Transaction[]) => void; // Modified to accept array
  editingTransaction?: Transaction;
  onCancel?: () => void;
  isGroupView: boolean;
}

export function TransactionForm({ onSubmit, editingTransaction, onCancel, isGroupView }: TransactionFormProps) {
  const { currentGroup } = useProfileStore(); // Get currentGroup from store

  const [amount, setAmount] = useState(editingTransaction?.amount.toString() || '');
  const [date, setDate] = useState(editingTransaction?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(editingTransaction?.description || '');
  const [type, setType] = useState<'income' | 'expense'>(editingTransaction?.type === 'income' ? 'income' : 'expense'); // Ensure initial type is valid
  const [category, setCategory] = useState(editingTransaction?.category || '');
  const [errors, setErrors] = useState<{ amount?: string; date?: string; description?: string; category?: string; distribution?: string }>({});

  // New state for group income distribution
  const [incomeDistribution, setIncomeDistribution] = useState<Array<{ profileId: string; name: string; amount: number; }>>([]);
  const [totalDistributed, setTotalDistributed] = useState(0);

  useEffect(() => {
    // Reset income distribution when group, type, or amount changes
    if (type === 'income' && isGroupView && currentGroup) {
      const newDistribution = currentGroup.profiles.map(p => ({
        profileId: p._id || p.id || '',
        name: p.name,
        amount: 0,
      }));
      setIncomeDistribution(newDistribution);
      setTotalDistributed(0);
    } else {
      setIncomeDistribution([]); // Clear when not in group income mode
    }
  }, [type, isGroupView, currentGroup]);

  useEffect(() => {
    // Update total distributed whenever incomeDistribution changes
    setTotalDistributed(incomeDistribution.reduce((sum, item) => sum + safeParseFloat(item.amount), 0));
  }, [incomeDistribution]);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleDistributeEvenly = () => {
    const totalAmount = safeParseFloat(amount);
    const numRecipients = incomeDistribution.length;
    if (totalAmount > 0 && numRecipients > 0) {
      const share = totalAmount / numRecipients;
      setIncomeDistribution(incomeDistribution.map(item => ({
        ...item,
        amount: parseFloat(share.toFixed(2)), // Round to 2 decimal places
      })));
    }
  };

  const handleRecipientAmountChange = (profileId: string, value: string) => {
    setIncomeDistribution(incomeDistribution.map(item =>
      item.profileId === profileId ? { ...item, amount: safeParseFloat(value) } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateTransaction(amount, date, description, category);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Specific validation for group income distribution
    if (type === 'income' && isGroupView) {
      const totalAmountNum = safeParseFloat(amount);
      if (totalDistributed !== totalAmountNum) {
        setErrors(prev => ({ ...prev, distribution: `Distributed amount (${formatCurrency(totalDistributed)}) does not match total income (${formatCurrency(totalAmountNum)})` }));
        return;
      }
      if (incomeDistribution.some(item => safeParseFloat(item.amount) <= 0)) {
        setErrors(prev => ({ ...prev, distribution: 'All distributed amounts must be greater than 0' }));
        return;
      }
    }

    setErrors({}); // Clear errors if validation passes

    if (type === 'income' && isGroupView) {
      // Create multiple transactions for group income
      const transactionsToSubmit: Transaction[] = incomeDistribution.map(item => ({
        _id: editingTransaction?._id, // Only applies if we're editing a *single* group income entry
        id: editingTransaction?.id || generateId(),
        amount: safeParseFloat(item.amount),
        date,
        description: description.trim() + ` (Share for ${item.name})`, // Add profile name to description
        type: 'income',
        category: category.trim(),
        profileId: item.profileId, // IMPORTANT: Tie to specific profile
        groupId: currentGroup?._id || currentGroup?.id || '', // Tie to current group
        createdAt: editingTransaction?.createdAt || new Date().toISOString(),
      }));
      onSubmit(transactionsToSubmit);

    } else {
      // Create a single transaction for individual or group expense
      const transaction: Transaction = {
        _id: editingTransaction?._id,
        id: editingTransaction?.id || generateId(),
        amount: safeParseFloat(amount),
        date,
        description: description.trim(),
        type: type,
        category: category.trim(),
        profileId: currentGroup?.profiles.find(p => p._id === (currentGroup.type === 'personal' ? currentGroup.profiles[0]._id : undefined))?._id || currentGroup?.profiles[0]?._id || currentGroup?.profiles[0]?.id || '', // Logic to get correct profileId
        groupId: currentGroup?._id || currentGroup?.id || '',
        createdAt: editingTransaction?.createdAt || new Date().toISOString(),
      };
      onSubmit(transaction);
    }
    
    // Reset form fields after submission
    if (!editingTransaction) {
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setCategory('');
      setType('expense');
      setIncomeDistribution([]);
    }
  };

  const previewAmount = safeParseFloat(amount);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 px-4 md:px-0">
       {/* Preview Card */}
       {amount && description && (
        <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/20 dark:bg-zinc-800/30 dark:border-zinc-700">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <p className="font-medium">{description}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Badge variant={type === 'income' ? 'default' : 'secondary'}>
                    {type}
                  </Badge>
                  {category && (
                    <Badge variant="outline">
                      {category}
                    </Badge>
                  )}
                </div>
              </div>
              <div className={cn("text-2xl font-bold text-center",
                type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {type === 'income' ? '+' : '-'}{formatCurrency(previewAmount)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Card */}
      <Card className="shadow-lg border-0 bg-white dark:bg-zinc-900">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">Transaction Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={type === 'expense' ? 'destructive' : 'outline'}
                  className="h-12"
                  onClick={() => setType('expense')}
                  disabled={editingTransaction?.type === 'income' && isGroupView} // Disable type change if editing group income
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={type === 'income' ? 'default' : 'outline'}
                  className={`h-12 ${type === 'income' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                  onClick={() => setType('income')}
                  disabled={editingTransaction?.type === 'expense'} // Disable type change if editing expense
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Income
                </Button>
              </div>
            </div>
            
            {/* Conditional message for group income */}
            {isGroupView && type === 'expense' && <p className="text-sm text-center text-muted-foreground dark:text-zinc-400">Adding a group expense.</p>}
            {isGroupView && type === 'income' && <p className="text-sm text-center text-muted-foreground dark:text-zinc-400">Distribute group income among profiles.</p>}


            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="amount" className="text-base font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`h-12 text-lg ${errors.amount ? 'border-destructive' : ''}`}
                  disabled={editingTransaction && type === 'income' && isGroupView} // Disable total amount input when editing group income
                />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="date" className="text-base font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`h-12 ${errors.date ? 'border-destructive' : ''}`}
                />
                {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="category" className="text-base font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className={`h-12 ${errors.category ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-base font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Enter transaction description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`h-12 ${errors.description ? 'border-destructive' : ''}`}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
              </div>
            </div>

            {/* Group Income Distribution Section */}
            {isGroupView && type === 'income' && currentGroup && currentGroup.profiles.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Distribute to Profiles
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDistributeEvenly}
                    disabled={safeParseFloat(amount) <= 0}
                  >
                    Distribute Evenly
                  </Button>
                </div>
                <div className="space-y-2">
                  {incomeDistribution.map(item => (
                    <div key={item.profileId} className="flex items-center gap-2">
                      <Label htmlFor={`profile-amount-${item.profileId}`} className="w-24 shrink-0">{item.name}</Label>
                      <Input
                        id={`profile-amount-${item.profileId}`}
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => handleRecipientAmountChange(item.profileId, e.target.value)}
                        placeholder="0.00"
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-medium mt-4">
                  <span>Total Distributed:</span>
                  <span className={cn(
                    totalDistributed === safeParseFloat(amount) ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(totalDistributed)}
                  </span>
                </div>
                {errors.distribution && <p className="text-sm text-destructive">{errors.distribution}</p>}
              </div>
            )}

            <Separator />

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                type="submit" 
                className="flex-1 h-12 text-base font-medium"
                disabled={!amount || !description || !category || (type === 'income' && isGroupView && totalDistributed !== safeParseFloat(amount))}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
              </Button>
              {editingTransaction && onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  className="h-12 px-6"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}