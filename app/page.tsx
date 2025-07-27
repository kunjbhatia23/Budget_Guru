'use client';

import {
  useState,
  useEffect,
  useCallback
} from 'react';
import {
  useProfileStore
} from '@/store/profile-store';
import {
  profileApi,
  profileTransactionApi,
  profileBudgetApi,
} from '@/lib/profile-api';
import {
  assetApi
} from '@/lib/asset-api';
import {
  ViewModeToggle
} from '@/components/profile/view-mode-toggle';
import {
  TransactionForm
} from '@/components/TransactionForm';
import {
  TransactionList
} from '@/components/TransactionList';
import {
  ExpenseChart
} from '@/components/ExpenseChart';
import {
  CategoryChart
} from '@/components/CategoryChart';
import {
  BudgetSetup
} from '@/components/BudgetSetup';
import {
  BudgetOverview
} from '@/components/BudgetOverview';
import {
  BudgetChart
} from '@/components/BudgetChart';
import {
  FinanceStats
} from '@/components/FinanceStats';
import {
  Sidebar
} from '@/components/Sidebar';
import {
  Alert,
  AlertDescription
} from '@/components/ui/alert';
import {
  Button
} from '@/components/ui/button';
import {
  Transaction,
  Budget,
  Asset
} from '@/types/finance';
import {
  ProfileTransaction,
  ProfileBudget,
  ExpenseSplitData
} from '@/types/profile';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus
} from 'lucide-react';
import {
  ThemeToggle
} from '@/components/theme/theme-toggle';
import {
  ExpenseSplit
} from '@/components/ExpenseSplit';
import {
  useToast
} from "@/hooks/use-toast";
import {
  CreateProfileDialog
} from '@/components/profile/create-profile-dialog';
import {
  formatCurrency
} from '@/lib/finance-utils';
import {
  FinancialReports
} from '@/components/FinancialReports';
import {
  RecurringTransactionForm
} from '@/components/RecurringTransactionForm';
import {
  AssetList
} from '@/components/AssetList';
import {
  AssetForm
} from '@/components/AssetForm';


export default function Home() {
  const {
    toast
  } = useToast();
  const {
    currentGroup,
    currentProfile,
    viewMode,
    groups,
    setGroups,
    getCurrentGroupId,
    getCurrentProfileId,
    isGroupView,
  } = useProfileStore();

  const [transactions, setTransactions] = useState < Transaction[] > ([]);
  const [budgets, setBudgets] = useState < Budget[] > ([]);
  const [assets, setAssets] = useState < Asset[] > ([]);
  const [editingTransaction, setEditingTransaction] = useState < Transaction | undefined > ();
  const [editingAsset, setEditingAsset] = useState < Asset | undefined > ();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState < string | null > (null);
  const [splitData, setSplitData] = useState < ExpenseSplitData | null > (null);
  const [showAssetForm, setShowAssetForm] = useState(false);
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const loadProfileData = useCallback(async () => {
    const groupId = getCurrentGroupId();
    const profileId = getCurrentProfileId();

    if (!groupId) {
      setLoading(false);
      return;
    };

    try {
      setLoading(true);
      setError(null);
      setSplitData(null);

      const [transactionsData, budgetsData, assetsData] = await Promise.all([
        profileTransactionApi.getAll(profileId || undefined, groupId, viewMode.type),
        profileBudgetApi.getAll(profileId || undefined, groupId, viewMode.type),
        assetApi.getAll(profileId || undefined, groupId, viewMode.type)
      ]);

      if (viewMode.type === 'group') {
        const splitResult = await profileApi.getExpenseSplit(groupId);
        setSplitData(splitResult);
      }

      setTransactions(transactionsData.map((t: any) => ({ ...t,
        id: t._id
      })));
      setBudgets(budgetsData.map((b: any) => ({ ...b,
        id: b._id
      })));
      setAssets(assetsData.map((a: any) => ({ ...a,
        id: a._id
      })));

    } catch (err: any) {
      console.error('Error loading profile data:', err);
      setError(err.message || 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  }, [viewMode, getCurrentGroupId, getCurrentProfileId]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const groupsData = await profileApi.getGroups();
        setGroups(groupsData);
      } catch (err: any) {
        setError(err.message || "Failed to load initial data.");
      } finally {
        setLoading(false);
      }
    };
    if (isClient) {
        loadInitialData();
    }
  }, [setGroups, isClient]);

  useEffect(() => {
    if (groups.length > 0 && isClient) {
      loadProfileData();
    }
  }, [groups, currentGroup, currentProfile, viewMode, loadProfileData, isClient]);

  const refreshData = async () => {
    await loadProfileData();
  };

  const handleAddTransaction = async (transactionOrTransactions: Transaction | Transaction[]) => {
    try {
        if (Array.isArray(transactionOrTransactions)) {
            await Promise.all(transactionOrTransactions.map(tx => profileTransactionApi.create(tx as ProfileTransaction)));
            toast({ title: "Success", description: "Group income distributed." });
        } else {
            const transaction = transactionOrTransactions;
            if (editingTransaction) {
                await profileTransactionApi.update(editingTransaction.id!, transaction as ProfileTransaction);
                toast({ title: "Success", description: "Transaction updated." });
            } else {
                await profileTransactionApi.create(transaction as ProfileTransaction);
                toast({ title: "Success", description: "Transaction added." });
            }
        }
        await refreshData();
        setEditingTransaction(undefined);
        setActiveTab('transactions');
    } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
    }
};

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setActiveTab("add");
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await profileTransactionApi.delete(id);
      toast({
        title: "Success",
        description: "Transaction deleted."
      });
      await refreshData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(undefined);
    setActiveTab("transactions");
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setShowAssetForm(true);
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await assetApi.delete(id);
      toast({
        title: "Success",
        description: "Asset deleted successfully."
      });
      await refreshData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleSaveAsset = () => {
    setShowAssetForm(false);
    setEditingAsset(undefined);
    refreshData();
  };

  const handleSaveBudgets = async (newBudgets: Omit < Budget, "id" | "_id" | "spent" | "remaining" | "percentage" > []) => {
    const groupId = getCurrentGroupId();
    const profileId = getCurrentProfileId();
    if (!groupId || !profileId) {
      toast({
        title: "Error",
        description: "A profile and group must be selected.",
        variant: "destructive"
      });
      return;
    }
    try {
      await profileBudgetApi.saveAll(profileId, groupId, newBudgets);
      toast({
        title: "Success",
        description: "Budgets saved."
      });
      await refreshData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleSettleUp = async (fromProfileId: string, toProfileId: string, amount: number) => {
    const groupId = getCurrentGroupId();
    if (!groupId) {
      toast({
        title: "Error",
        description: "Group context missing for settlement.",
        variant: "destructive",
      });
      return;
    }
    try {
      await profileApi.settleExpense(fromProfileId, toProfileId, groupId, amount);
      toast({
        title: "Success",
        description: `Settlement recorded: ${formatCurrency(amount)} paid.`,
      });
      await refreshData();
    } catch (err: any) {
      console.error("Error recording settlement:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to record settlement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPageTitle = () => {
    if (isGroupView()) return currentGroup?.name || "Group Dashboard";
    return currentProfile?.name ? `${currentProfile.name}'s Dashboard` : "Personal Dashboard";
  };
  
  if (!isClient) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        </div>
    );
  }

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-12 w-12 animate-spin text-purple-600" /></div>;
    }
    if (error) {
      return (
        <div className="flex items-center justify-center py-20 min-h-[60vh]">
          <div className="max-w-md mx-auto">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            <Button onClick={refreshData} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            <FinanceStats transactions={transactions} isGroupView={isGroupView()} />
            <ExpenseChart transactions={transactions} />
          </div>
        );
      case "categories":
        return <CategoryChart transactions={transactions} />;
      case "budget":
        return (
          <div className="space-y-8">
            <div className="flex flex-col items-center md:items-start md:flex-row md:justify-between gap-4">
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                  Budget Management
                </h2>
                <p className="text-muted-foreground mt-2 text-lg">
                  Set and track your monthly spending goals
                </p>
              </div>
              {!isGroupView() && (
                <BudgetSetup budgets={budgets} onSaveBudgets={handleSaveBudgets} />
              )}
            </div>
            <BudgetOverview budgets={budgets} />
            {budgets.length > 0 && <BudgetChart budgets={budgets} />}
          </div>
        );
      case "add":
        return (
          <TransactionForm
            onSubmit={handleAddTransaction}
            editingTransaction={editingTransaction}
            onCancel={handleCancelEdit}
            isGroupView={isGroupView()}
            assets={assets}
          />
        );
      case "transactions":
        return (
          <TransactionList
            transactions={transactions}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            isGroupView={isGroupView()}
          />
        );
      case "recurring":
        return <RecurringTransactionForm onSave={refreshData} />;
      case "assets":
        return (
          <div className="space-y-6">
            {showAssetForm ? (
              <AssetForm
                assetToEdit={editingAsset}
                onSave={handleSaveAsset}
                onCancel={() => { setShowAssetForm(false); setEditingAsset(undefined); }}
              />
            ) : (
              <>
                <div className="flex justify-end">
                  <Button onClick={() => { setEditingAsset(undefined); setShowAssetForm(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Asset
                  </Button>
                </div>
                <AssetList
                  assets={assets}
                  transactions={transactions}
                  onEdit={handleEditAsset}
                  onDelete={handleDeleteAsset}
                />
              </>
            )}
          </div>
        );
      case "split":
        return (
          <ExpenseSplit
            splitData={splitData}
            loading={loading}
            isGroupView={isGroupView()}
            onSettleUp={handleSettleUp}
          />
        );
      case "reports":
        return <FinancialReports />;
      default:
        return null;
    }
  };

  if (groups.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
            Welcome to Budget Guru!
          </h1>
          <p className="text-muted-foreground text-lg">Create a profile to get started.</p>
          <CreateProfileDialog />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 md:ml-72 overflow-y-auto h-screen p-4 md:p-8">
        <div className="absolute top-4 right-4 md:right-8 z-10">
          <ThemeToggle />
        </div>
        <header className="mb-12 mt-16 md:mt-0 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-4">
            {getPageTitle()}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Your complete financial command center.
          </p>
          {currentGroup && <div className="flex justify-center"><ViewModeToggle /></div>}
        </header>
        <div className="w-full max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}