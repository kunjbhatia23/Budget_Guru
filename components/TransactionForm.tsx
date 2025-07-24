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
import { validateTransaction, generateId, EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatCurrency } from '@/lib/finance-utils';
import { Plus, Edit3, DollarSign, Calendar, FileText, Tag, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionFormProps {
  onSubmit: (transaction: Transaction) => void;
  editingTransaction?: Transaction;
  onCancel?: () => void;
  isGroupView: boolean;
}

export function TransactionForm({ onSubmit, editingTransaction, onCancel, isGroupView }: TransactionFormProps) {
  const [amount, setAmount] = useState(editingTransaction?.amount.toString() || '');
  const [date, setDate] = useState(editingTransaction?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(editingTransaction?.description || '');
  const [type, setType] = useState<'income' | 'expense'>(editingTransaction?.type || 'expense');
  const [category, setCategory] = useState(editingTransaction?.category || '');
  const [errors, setErrors] = useState<{ amount?: string; date?: string; description?: string; category?: string }>({});

  useEffect(() => {
    if (isGroupView) {
      setType('expense');
    }
  }, [isGroupView]);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateTransaction(amount, date, description, category);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const transaction: Transaction = {
      _id: editingTransaction?._id,
      id: editingTransaction?.id || generateId(),
      amount: Number(amount),
      date,
      description: description.trim(),
      type: isGroupView ? 'expense' : type,
      category: category.trim(),
      createdAt: editingTransaction?.createdAt || new Date().toISOString(),
    };

    onSubmit(transaction);
    
    if (!editingTransaction) {
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setCategory('');
      setType('expense');
    }
    
    setErrors({});
  };

  const handleTypeChange = (newType: 'income' | 'expense') => {
    if (isGroupView) return; // Prevent changing type in group view
    setType(newType);
    setCategory('');
  };

  const previewAmount = amount ? Number(amount) : 0;

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
            {!isGroupView && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Transaction Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={type === 'expense' ? 'destructive' : 'outline'}
                    className="h-12"
                    onClick={() => handleTypeChange('expense')}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Expense
                  </Button>
                  <Button
                    type="button"
                    variant={type === 'income' ? 'default' : 'outline'}
                    className={`h-12 ${type === 'income' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                    onClick={() => handleTypeChange('income')}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Income
                  </Button>
                </div>
              </div>
            )}
            
            {isGroupView && <p className="text-sm text-center text-muted-foreground dark:text-zinc-400">Adding a group expense. Income cannot be added in group view.</p>}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="amount" className="text-base font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`h-12 text-lg ${errors.amount ? 'border-destructive' : ''}`}
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

            <Separator />

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                type="submit" 
                className="flex-1 h-12 text-base font-medium"
                disabled={!amount || !description || !category}
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