'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DayOfMonthPicker } from '@/components/ui/day-of-month-picker';
import {
  validateTransaction,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  safeParseFloat,
} from '@/lib/finance-utils';
import { Save, Repeat, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfileStore } from '@/store/profile-store';
import { profileTransactionApi } from '@/lib/profile-api';
import { useToast } from '@/hooks/use-toast';

interface RecurringTransactionFormProps {
  onSave?: () => void;
}

export function RecurringTransactionForm({
  onSave,
}: RecurringTransactionFormProps) {
  const { currentProfile, getCurrentGroupId } = useProfileStore();
  const { toast } = useToast();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [recurringFrequency, setRecurringFrequency] = useState<
    'daily' | 'weekly' | 'monthly' | 'yearly'
  >('monthly');
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState<number>(28);

  const [errors, setErrors] = useState<{
    amount?: string;
    description?: string;
    category?: string;
  }>({});

  const categories =
    type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const getDayLabel = (day: number) => {
    if (day === 32) return 'Last Day of Month';
    if ([1, 21, 31].includes(day)) return `${day}st`;
    if ([2, 22].includes(day)) return `${day}nd`;
    if ([3, 23].includes(day)) return `${day}rd`;
    return `${day}th`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateTransaction(
      amount,
      new Date().toISOString().split('T')[0],
      description,
      category
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const profileId = currentProfile?._id;
    const groupId = getCurrentGroupId();

    if (!profileId || !groupId) {
      toast({
        title: 'Error',
        description: 'A profile and group must be selected.',
        variant: 'destructive',
      });
      return;
    }

    const transactionData = {
      amount: safeParseFloat(amount),
      date: new Date().toISOString().split('T')[0],
      description: description.trim(),
      type: type,
      category: category.trim(),
      isRecurring,
      recurringFrequency,
      ...(recurringFrequency === 'monthly' && { recurringDayOfMonth }),
      profileId,
      groupId,
    };

    try {
      await profileTransactionApi.create(transactionData as any);
      toast({
        title: 'Success',
        description: 'Recurring transaction saved successfully.',
      });
      if (onSave) {
        onSave();
      }
      setAmount('');
      setDescription('');
      setCategory('');
      setRecurringDayOfMonth(28);
    } catch (err: any) {
      toast({
        title: 'Error',
        description:
          err.message || 'Failed to save recurring transaction.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Recurring Transaction</CardTitle>
        <CardDescription>
          Set up transactions that repeat on a schedule.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="is-recurring">Enable Recurring</Label>
            <Switch
              id="is-recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={errors.amount ? 'border-destructive' : ''}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(value: 'income' | 'expense') => setType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="e.g., Monthly Salary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
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
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category}</p>
            )}
          </div>

          {isRecurring && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Frequency</Label>
                <Select
                  value={recurringFrequency}
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') => setRecurringFrequency(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recurringFrequency === 'monthly' && (
                <div>
                  <Label>Day of Month</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className='w-full justify-start text-left font-normal'
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span>{getDayLabel(recurringDayOfMonth)}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <DayOfMonthPicker
                        value={recurringDayOfMonth}
                        onChange={setRecurringDayOfMonth}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" /> Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}