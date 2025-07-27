// kunjbhatia23/budget_guru/Budget_Guru-5fc8173f4eb07b451f8a37faf6a16fae98c2b211/components/TransactionForm.tsx
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
  CardContent
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
  Transaction,
  Asset
} from '@/types/finance';
import {
  validateTransaction,
  generateId,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  formatCurrency,
  safeParseFloat
} from '@/lib/finance-utils';
import {
  Plus,
  Save,
  X,
  IndianRupee,
  Users,
  Calendar,
  Tag,
  FileText
} from 'lucide-react';
import {
  cn
} from '@/lib/utils';
import {
  useProfileStore
} from '@/store/profile-store';

interface TransactionFormProps {
  onSubmit: (transaction: Transaction | Transaction[]) => void;
  editingTransaction?: Transaction;
  onCancel?: () => void;
  isGroupView: boolean;
  assets: Asset[]; // FIXED: Added the missing assets prop
}

export function TransactionForm({
  onSubmit,
  editingTransaction,
  onCancel,
  isGroupView,
  assets
}: TransactionFormProps) {
  const {
    currentGroup,
    currentProfile
  } = useProfileStore();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [type, setType] = useState < 'income' | 'expense' > ('expense');
  const [category, setCategory] = useState('');
  const [errors, setErrors] = useState < {
    amount?: string;
    date?: string;
    description?: string;
    category?: string;
    distribution?: string
  } > ({});
  const [assetId, setAssetId] = useState < string | undefined > (undefined);

  const [incomeDistribution, setIncomeDistribution] = useState < Array < {
    profileId: string;
    name: string;
    amount: number;
  } >> ([]);
  const [totalDistributed, setTotalDistributed] = useState(0);

  useEffect(() => {
    if (editingTransaction) {
      setAmount(String(editingTransaction.amount));
      setDate(editingTransaction.date);
      setDescription(editingTransaction.description);
      setType(editingTransaction.type as 'income' | 'expense');
      setCategory(editingTransaction.category);
      setAssetId(editingTransaction.assetId);
    } else {
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setType('expense');
      setCategory('');
      setAssetId(undefined);
    }
  }, [editingTransaction]);

  useEffect(() => {
    if (type === 'income' && isGroupView && currentGroup) {
      const newDistribution = currentGroup.profiles.map(p => ({
        profileId: p._id || p.id || '',
        name: p.name,
        amount: 0,
      }));
      setIncomeDistribution(newDistribution);
    } else {
      setIncomeDistribution([]);
    }
  }, [type, isGroupView, currentGroup]);

  useEffect(() => {
    const total = incomeDistribution.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    setTotalDistributed(total);
  }, [incomeDistribution]);


  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleDistributeEvenly = () => {
    const totalAmount = safeParseFloat(amount);
    const numRecipients = incomeDistribution.length;
    if (totalAmount > 0 && numRecipients > 0) {
      const share = totalAmount / numRecipients;
      const distributedAmounts = incomeDistribution.map(item => ({
        ...item,
        amount: parseFloat(share.toFixed(2)),
      }));

      const sum = distributedAmounts.reduce((acc, curr) => acc + curr.amount, 0);
      const difference = totalAmount - sum;
      if (difference !== 0 && distributedAmounts.length > 0) {
        distributedAmounts[distributedAmounts.length - 1].amount += difference;
        distributedAmounts[distributedAmounts.length - 1].amount = parseFloat(distributedAmounts[distributedAmounts.length - 1].amount.toFixed(2));
      }

      setIncomeDistribution(distributedAmounts);
    }
  };

  const handleRecipientAmountChange = (profileId: string, value: string) => {
    setIncomeDistribution(incomeDistribution.map(item =>
      item.profileId === profileId ? { ...item,
        amount: value ? parseFloat(value) : 0
      } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateTransaction(amount, date, description, category);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (type === 'income' && isGroupView) {
      const totalAmountNum = safeParseFloat(amount);
      if (Math.abs(totalDistributed - totalAmountNum) > 0.01) {
        setErrors(prev => ({ ...prev,
          distribution: `Distributed amount (${formatCurrency(totalDistributed)}) does not match total income (${formatCurrency(totalAmountNum)})`
        }));
        return;
      }
      if (incomeDistribution.some(item => (Number(item.amount) || 0) <= 0)) {
        setErrors(prev => ({ ...prev,
          distribution: 'All distributed amounts must be greater than 0'
        }));
        return;
      }
    }

    setErrors({});

    if (type === 'income' && isGroupView) {
      const transactionsToSubmit: Transaction[] = incomeDistribution.map(item => ({
        id: generateId(),
        amount: Number(item.amount) || 0,
        date,
        description: description.trim() + ` (Share for ${item.name})`,
        type: 'income',
        category: category.trim(),
        profileId: item.profileId,
        groupId: currentGroup?._id || currentGroup?.id || '',
        createdAt: new Date().toISOString(),
      }));
      onSubmit(transactionsToSubmit);

    } else {
      const transaction: Transaction = {
        id: editingTransaction?.id || generateId(),
        _id: editingTransaction?._id,
        amount: safeParseFloat(amount),
        date,
        description: description.trim(),
        type: type,
        category: category.trim(),
        // --- FIX: Use original profile/group IDs when editing, otherwise use current profile ---
        profileId: editingTransaction?.profileId || currentProfile?._id || '',
        groupId: editingTransaction?.groupId || currentGroup?._id || '',
        createdAt: editingTransaction?.createdAt || new Date().toISOString(),
        assetId: assetId === 'none' ? undefined : assetId,
      };
      onSubmit(transaction);
    }

    if (!editingTransaction) {
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setCategory('');
      setType('expense');
      setIncomeDistribution([]);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
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
              >
                <IndianRupee className="h-4 w-4 mr-2" />
                Expense
              </Button>
              <Button
                type="button"
                variant={type === 'income' ? 'default' : 'outline'}
                className={`h-12 ${type === 'income' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                onClick={() => setType('income')}
                disabled={isGroupView && !!editingTransaction}
              >
                <IndianRupee className="h-4 w-4 mr-2" />
                Income
              </Button>
            </div>
          </div>
          
          {isGroupView && type === 'expense' && <p className="text-sm text-center text-muted-foreground">Adding a group expense.</p>}
          {isGroupView && type === 'income' && <p className="text-sm text-center text-muted-foreground">Distribute group income among profiles.</p>}

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-base font-medium flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
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
                className={`h-12 text-lg ${errors.date ? 'border-destructive' : ''}`}
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
                placeholder="e.g., Groceries, Salary..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`h-12 text-lg ${errors.description ? 'border-destructive' : ''}`}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>
          </div>

          {type === 'expense' && assets.length > 0 && (
            <div className="space-y-3">
              <Label htmlFor="asset" className="text-base font-medium">Link to Asset (Optional)</Label>
              <Select value={assetId || 'none'} onValueChange={setAssetId}>
                <SelectTrigger id="asset" className="h-12 text-lg">
                  <SelectValue placeholder="Choose an asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                  Math.abs(totalDistributed - safeParseFloat(amount)) < 0.01 ? 'text-green-600' : 'text-red-600'
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
              disabled={!amount || !description || !category || (type === 'income' && isGroupView && Math.abs(totalDistributed - safeParseFloat(amount)) > 0.01)}
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
  );
}