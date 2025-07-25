'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProfileStore } from '@/store/profile-store';
import {
  profileApi,
  profileTransactionApi,
  profileBudgetApi,
} from '@/lib/profile-api';
import { ViewModeToggle } from '@/components/profile/view-mode-toggle';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { ExpenseChart } from '@/components/ExpenseChart';
import { CategoryChart } from '@/components/CategoryChart';
import { BudgetSetup } from '@/components/BudgetSetup';
import { BudgetOverview } from '@/components/BudgetOverview';
import { BudgetChart } from '@/components/BudgetChart';
import { FinanceStats } from '@/components/FinanceStats';
import { Sidebar } from '@/components/Sidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Transaction, Budget } from '@/types/finance';
import { ProfileTransaction, ProfileBudget, ExpenseSplitData } from '@/types/profile';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { ExpenseSplit } from '@/components/ExpenseSplit';
import { useToast } from "@/hooks/use-toast";
import { CreateProfileDialog } from '@/components/profile/create-profile-dialog';
import { formatCurrency } from '@/lib/finance-utils';
import { FinancialReports } from '@/components/FinancialReports';

export default function Home() {
  const { toast } = useToast();
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

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<
    Transaction | undefined
  >();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [splitData, setSplitData] = useState<ExpenseSplitData | null>(null);

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

      const [transactionsData, budgetsData] = await Promise.all([
        profileTransactionApi.getAll(profileId || undefined, groupId, viewMode.type),
        profileBudgetApi.getAll(profileId || undefined, groupId, viewMode.type)
      ]);
      
      if (viewMode.type === 'group') {
        const splitResult = await profileApi.getExpenseSplit(groupId);
        setSplitData(splitResult);
      }
      
      setTransactions(transactionsData.map((t: ProfileTransaction) => ({...t, id: t._id || t.id})));
      setBudgets(budgetsData.map((b: ProfileBudget) => ({...b, id: b._id || b.id})));
    } catch (err: any) {
      console.error('Error loading profile data:', err);
      setError(err.message || 'Failed to load profile data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [viewMode, getCurrentGroupId, getCurrentProfileId]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const groupsData = await profileApi.getGroups();
        setGroups(groupsData);
      } catch (err: any) {
        console.error("Error loading initial data:", err);
        setError(err.message || "Failed to load data. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [setGroups]);

  useEffect(() => {
    if (groups.length > 0) {
      loadProfileData();
    }
  }, [groups, currentGroup, currentProfile, viewMode, loadProfileData]);

  const refreshData = async () => {
    await loadProfileData();
  };
  
  const handleAddTransaction = async (transactionOrTransactions: Transaction | Transaction[]) => {
    const groupId = getCurrentGroupId();
    let profileId: string | null = getCurrentProfileId();

    if (!Array.isArray(transactionOrTransactions)) {
        if (isGroupView() && currentGroup) {
            if (!profileId && currentGroup.profiles.length > 0) {
                profileId = currentGroup.profiles[0]?._id || currentGroup.profiles[0]?.id || null;
            }
        }
    }
    
    if (!groupId || (Array.isArray(transactionOrTransactions) ? false : !profileId)) {
      toast({
        title: "Error",
        description: "Please select a profile/group first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (Array.isArray(transactionOrTransactions)) {
        await Promise.all(transactionOrTransactions.map(async (tx) => {
            const profileTransaction: Omit<ProfileTransaction, "_id" | "createdAt"> = {
                profileId: tx.profileId,
                groupId: tx.groupId,
                amount: tx.amount,
                date: tx.date,
                description: tx.description,
                type: tx.type,
                category: tx.category,
            };
            await profileTransactionApi.create(profileTransaction);
        }));
        toast({
            title: "Success",
            description: "Group income distributed successfully.",
        });
      } else {
        const transaction = transactionOrTransactions;
        const profileTransaction: Omit<ProfileTransaction, "_id" | "createdAt"> = {
          profileId: profileId!,
          groupId,
          amount: transaction.amount,
          date: transaction.date,
          description: transaction.description,
          type: transaction.type,
          category: transaction.category,
        };

        if (editingTransaction) {
          await profileTransactionApi.update(editingTransaction.id!, profileTransaction);
          toast({
            title: "Success",
            description: "Transaction updated successfully.",
          });
        } else {
          await profileTransactionApi.create(profileTransaction);
          toast({
            title: "Success",
            description: "Transaction added successfully.",
          });
        }
      }
      await refreshData();
    } catch (err: any) {
      console.error("Error saving transaction:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to save transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setActiveTab("add");
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await profileTransactionApi.delete(id);
      await refreshData();
      toast({
        title: "Success",
        description: "Transaction deleted successfully.",
      });
    } catch (err: any) {
      console.error("Error deleting transaction:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(undefined);
    setActiveTab("overview");
  };

  const handleSaveBudgets = async (newBudgets: Omit<Budget, "spent" | "remaining" | "percentage">[]) => {
    const groupId = getCurrentGroupId();
    const profileId = getCurrentProfileId();
    if (!groupId || !profileId) {
      toast({
        title: "Error",
        description: "Please select a profile/group first.",
        variant: "destructive",
      });
      return;
    }
    try {
      const profileBudgets = newBudgets.map((budget) => ({
        category: budget.category, amount: budget.amount,
      }));
      await profileBudgetApi.saveAll(profileId, groupId, profileBudgets);
      await refreshData();
      toast({
        title: "Success",
        description: "Budgets saved successfully.",
      });
    } catch (err: any) {
      console.error("Error saving budgets:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to save budgets. Please try again.",
        variant: "destructive",
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
    if (isGroupView()) {
      return currentGroup?.name || "Group Dashboard";
    }
    return currentProfile?.name ? `${currentProfile.name}'s Dashboard` : "Personal Dashboard";
  };
  
  if (groups.length === 0 && loading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  if (groups.length === 0 && !loading) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md p-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Welcome to Budget Guru!</h1>
                <p className="text-muted-foreground text-lg">
                    Get started by creating your first profile group.
                </p>
                <CreateProfileDialog />
            </div>
        </div>
    );
  }

  const renderContent = () => {
    if (loading) {
      return <div className="flex items-center justify-center py-20 min-h-[60vh]"><Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" /></div>;
    }
    if (error) {
      return (
        <div className="flex items-center justify-center py-20 min-h-[60vh]">
          <div className="max-w-md mx-auto">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
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
      case "overview": return (
        <div className="space-y-8">
          <FinanceStats transactions={transactions} isGroupView={isGroupView()} />
          <ExpenseChart transactions={transactions} />
        </div>
      );
      case "categories": return <CategoryChart transactions={transactions} />;
      case "budget": return (
        <div className="space-y-8">
            <div className="flex flex-col items-center md:items-start md:flex-row md:justify-between gap-4">
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Budget Management
                </h2>
                <p className="text-muted-foreground mt-2 text-lg">
                  Set and track your monthly spending goals
                </p>
              </div>
              {!isGroupView() && (
                 <BudgetSetup
                    budgets={budgets}
                    onSaveBudgets={handleSaveBudgets}
                  />
              )}
            </div>
          <BudgetOverview budgets={budgets} />
          {budgets.length > 0 && <BudgetChart budgets={budgets} />}
        </div>
      );
      case "add": return (
        <TransactionForm
          onSubmit={handleAddTransaction}
          editingTransaction={editingTransaction}
          onCancel={handleCancelEdit}
          isGroupView={isGroupView()}
        />
      );
      case "transactions": return (
        <TransactionList
          transactions={transactions}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          isGroupView={isGroupView()}
        />
      );
       case "split": return (
        <ExpenseSplit splitData={splitData} loading={loading} isGroupView={isGroupView()} onSettleUp={handleSettleUp} />
      );
      case "reports": return <FinancialReports />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 md:ml-72 overflow-y-auto h-screen">
        <div className="container mx-auto px-4 py-8 md:px-8 md:py-12 max-w-7xl relative">
          <div className="absolute top-4 right-4 md:right-8 z-10">
            <ThemeToggle />
          </div>
          <div className="mb-12 mt-16 md:mt-0">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                {getPageTitle()}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                Complete financial management with expense tracking, budgeting, and intelligent insights.
              </p>
              {currentGroup && <div className="flex justify-center"><ViewModeToggle /></div>}
            </div>
          </div>
          <div className="space-y-8 flex flex-col items-center md:items-stretch">
            <div className="w-full max-w-6xl mx-auto">{renderContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}