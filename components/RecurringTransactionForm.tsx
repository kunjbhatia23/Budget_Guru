'use client';

import {
  useState,
  useEffect
} from 'react';
import {
  Button
} from '@/components/ui/button';
import {
  Input
} from '@/components/ui/input';
import {
  Label
} from '@/components/ui/label';
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
import {
  Separator
} from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DayOfMonthPicker
} from '@/components/ui/day-of-month-picker';
import {
  validateTransaction,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  safeParseFloat,
} from '@/lib/finance-utils';
import {
  Save,
  IndianRupee,
  Calendar,
  Tag,
  FileText,
  Repeat
} from 'lucide-react';
import {
  useProfileStore
} from '@/store/profile-store';
// --- FIX: Import the correct API handler ---
import {
  profileTransactionApi
} from '@/lib/profile-api';
import {
  useToast
} from '@/hooks/use-toast';
import {
  ProfileTransaction
} from '@/types/profile';

interface RecurringTransactionFormProps {
  onSave?: () => void;
}

export function RecurringTransactionForm({
  onSave
}: RecurringTransactionFormProps) {
  const {
    currentProfile,
    getCurrentGroupId
  } = useProfileStore();
  const {
    toast
  } = useToast();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState < 'income' | 'expense' > ('expense');
  const [category, setCategory] = useState('');
  const [recurringFrequency, setRecurringFrequency] = useState < 'daily' | 'weekly' | 'monthly' | 'yearly' > ('monthly');
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState < number > (15);
  const [errors, setErrors] = useState < Record < string, string >> ({});

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  useEffect(() => {
    setCategory('');
  }, [type]);

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
      new Date().toISOString().split('T')[0], // Use current date for validation purposes
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
    
    const transactionData: Omit < ProfileTransaction, '_id' | 'createdAt' | 'updatedAt' > = {
        amount: safeParseFloat(amount),
        date: new Date().toISOString().split('T')[0], // This will be the start date
        description: description.trim(),
        type,
        category: category.trim(),
        isRecurring: true,
        recurringFrequency,
        profileId,
        groupId,
    };
    
    if (recurringFrequency === 'monthly') {
        transactionData.recurringDayOfMonth = recurringDayOfMonth;
    }

    try {
      // --- FIX: Call the correct API endpoint ---
      await profileTransactionApi.create(transactionData);
      toast({
        title: 'Success',
        description: 'Recurring transaction saved.',
      });
      if (onSave) onSave();

      // Reset form
      setAmount('');
      setDescription('');
      setCategory('');
      setRecurringDayOfMonth(15);
      setType('expense');

    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save recurring transaction.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Recurring Transaction</CardTitle>
        <CardDescription>Set up transactions that repeat on a schedule. They will be automatically added on the correct day.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">Transaction Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={type === 'expense' ? 'destructive' : 'outline'}
                className="h-12"
                onClick={() => setType('expense')}
              >
                <IndianRupee className="h-4 w-4 mr-2" />
                Expense
              </Button>
              <Button
                type="button"
                variant={type === 'income' ? 'default' : 'outline'}
                className={`h-12 ${type === 'income' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                onClick={() => setType('income')}
              >
                <IndianRupee className="h-4 w-4 mr-2" />
                Income
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label htmlFor="amount" className="text-base font-medium flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="category" className="text-base font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className={`h-12 text-lg ${errors.category ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                placeholder="e.g., Netflix, Salary..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`h-12 text-lg ${errors.description ? 'border-destructive' : ''}`}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <Label className="text-base font-medium flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Recurrence Rules
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label>Frequency</Label>
                <Select value={recurringFrequency} onValueChange={(v: any) => setRecurringFrequency(v)}>
                  <SelectTrigger className="h-12">
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
                      <Button variant="outline" className="w-full justify-start font-normal h-12">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>{getDayLabel(recurringDayOfMonth)}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <DayOfMonthPicker value={recurringDayOfMonth} onChange={setRecurringDayOfMonth} />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" className="w-full" size="lg">
              <Save className="h-4 w-4 mr-2" />
              Save Recurring Transaction
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}