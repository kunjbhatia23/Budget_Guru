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
  
  const handleAddTransaction = async (transaction: Transaction) => {
    const groupId = getCurrentGroupId();
    let profileId = getCurrentProfileId();

    if (isGroupView() && currentGroup) {
      profileId = currentGroup.profiles[0]?._id ?? profileId;
    }
    if (!groupId || !profileId) {
      setError("Please select a profile first");
      return;
    }
    try {
      const profileTransaction: Omit<ProfileTransaction, "_id" | "createdAt"> = {
        profileId, groupId,
        amount: transaction.amount, date: transaction.date,
        description: transaction.description, type: transaction.type,
        category: transaction.category,
      };
      if (editingTransaction) {
        await profileTransactionApi.update(editingTransaction.id!, profileTransaction);
        setEditingTransaction(undefined);
      } else {
        await profileTransactionApi.create(profileTransaction);
      }
      await refreshData();
    } catch (err) {
      console.error("Error saving transaction:", err);
      setError("Failed to save transaction. Please try again.");
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
    } catch (err) {
      console.error("Error deleting transaction:", err);
      setError("Failed to delete transaction. Please try again.");
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
      setError("Please select a profile first");
      return;
    }
    try {
      const profileBudgets = newBudgets.map((budget) => ({
        category: budget.category, amount: budget.amount,
      }));
      await profileBudgetApi.saveAll(profileId, groupId, profileBudgets);
      await refreshData();
    } catch (err) {
      console.error("Error saving budgets:", err);
      setError("Failed to save budgets. Please try again.");
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
        <ExpenseSplit splitData={splitData} loading={loading} isGroupView={isGroupView()} />
      );
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