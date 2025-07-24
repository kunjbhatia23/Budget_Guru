'use client';

import { useState, useEffect } from 'react';
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

export default function Home() {
  // Profile store
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

  // Load data from database on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load groups first
        const groupsData = await profileApi.getGroups();
        setGroups(groupsData);
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError(
          "Failed to load data. Please check your connection and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setGroups]);

  // Load profile-specific data when profile/view mode changes
  useEffect(() => {
    const loadProfileData = async () => {
      const groupId = getCurrentGroupId();
      const profileId = getCurrentProfileId();

      if (!groupId) return;

      try {
        setLoading(true);
        setError(null);
        setSplitData(null); // Clear previous split data

        const [transactionsData, budgetsData] = await Promise.all([
          profileTransactionApi.getAll(
            profileId || undefined,
            groupId,
            viewMode.type
          ),
          profileBudgetApi.getAll(
            profileId || undefined,
            groupId,
            viewMode.type
          ),
        ]);

        if (viewMode.type === 'group') {
          const splitResult = await profileApi.getExpenseSplit(groupId);
          setSplitData(splitResult);
        }

        // Convert MongoDB _id to id for compatibility
        const normalizedTransactions = transactionsData.map(
          (t: ProfileTransaction) => ({
            ...t,
            id: t._id || t.id,
          })
        );

        const normalizedBudgets = budgetsData.map((b: ProfileBudget) => ({
          ...b,
          id: b._id || b.id,
        }));

        setTransactions(normalizedTransactions);
        setBudgets(normalizedBudgets);
      } catch (err) {
        console.error("Error loading profile data:", err);
        setError(
          "Failed to load profile data. Please check your connection and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [
    currentGroup,
    currentProfile,
    viewMode,
    getCurrentGroupId,
    getCurrentProfileId,
  ]);

  const handleAddTransaction = async (transaction: Transaction) => {
    const groupId = getCurrentGroupId();
    const profileId = getCurrentProfileId();

    if (!groupId || !profileId) {
      setError("Please select a profile first");
      return;
    }

    try {
      const profileTransaction: Omit<ProfileTransaction, "_id" | "createdAt"> =
        {
          profileId,
          groupId,
          amount: transaction.amount,
          date: transaction.date,
          description: transaction.description,
          type: transaction.type,
          category: transaction.category,
        };

      if (editingTransaction) {
        const updated = await profileTransactionApi.update(
          editingTransaction.id!,
          profileTransaction
        );
        const normalizedTransaction: Transaction = {
          ...updated,
          id: updated._id,
        };
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === editingTransaction.id ? normalizedTransaction : t
          )
        );
        setEditingTransaction(undefined);
      } else {
        const created = await profileTransactionApi.create(profileTransaction);
        const normalizedTransaction: Transaction = {
          ...created,
          id: created._id,
        };
        setTransactions((prev) => [...prev, normalizedTransaction]);
      }

      // Refresh budgets to update spending
      const updatedBudgets = await profileBudgetApi.getAll(
        profileId,
        groupId,
        viewMode.type
      );
      setBudgets(
        updatedBudgets.map((b: ProfileBudget) => ({
          ...b,
          id: b._id || b.id,
        }))
      );
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
      setTransactions((prev) => prev.filter((t) => (t._id || t.id) !== id));

      // Refresh budgets to update spending
      const groupId = getCurrentGroupId();
      const profileId = getCurrentProfileId();
      if (groupId && profileId) {
        const updatedBudgets = await profileBudgetApi.getAll(
          profileId,
          groupId,
          viewMode.type
        );
        setBudgets(
          updatedBudgets.map((b: ProfileBudget) => ({
            ...b,
            id: b._id || b.id,
          }))
        );
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      setError("Failed to delete transaction. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(undefined);
    setActiveTab("overview");
  };

  const handleSaveBudgets = async (
    newBudgets: Omit<Budget, "spent" | "remaining" | "percentage">[]
  ) => {
    const groupId = getCurrentGroupId();
    const profileId = getCurrentProfileId();

    if (!groupId || !profileId) {
      setError("Please select a profile first");
      return;
    }

    try {
      const profileBudgets = newBudgets.map((budget) => ({
        category: budget.category,
        amount: budget.amount,
      }));

      const savedBudgets = await profileBudgetApi.saveAll(
        profileId,
        groupId,
        profileBudgets
      );
      setBudgets(
        savedBudgets.map((b: ProfileBudget) => ({
          ...b,
          id: b._id || b.id,
        }))
      );
    } catch (err) {
      console.error("Error saving budgets:", err);
      setError("Failed to save budgets. Please try again.");
    }
  };

  // Show loading if no groups are loaded yet
  if (groups.length === 0 && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 md:ml-72 overflow-y-auto h-screen">
          <div className="container mx-auto px-4 py-8 md:px-8 md:py-12 max-w-7xl">
            <div className="flex items-center justify-center py-20 min-h-[60vh]">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Loading Budget Guru</h3>
                  <p className="text-muted-foreground">
                    Setting up your financial dashboard...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show setup screen if no groups exist
  if (groups.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 md:ml-72 overflow-y-auto h-screen">
          <div className="container mx-auto px-4 py-8 md:px-8 md:py-12 max-w-7xl">
            <div className="flex items-center justify-center py-20 min-h-[60vh]">
              <div className="text-center space-y-6 max-w-md">
                <h2 className="text-2xl font-bold">Welcome to Budget Guru!</h2>
                <p className="text-muted-foreground">
                  Get started by creating your first profile group. You can set
                  up individual profiles for family members, roommates, or just
                  yourself.
                </p>
                <Button
                  size="lg"
                  onClick={() => {
                    // For now, create a default group
                    const createDefaultGroup = async () => {
                      try {
                        const defaultGroup = {
                          name: "My Finances",
                          type: "personal" as const,
                          profiles: [
                            {
                              name: "Me",
                              color: "#3B82F6",
                            },
                          ],
                        };

                        const created = await profileApi.createGroup(
                          defaultGroup
                        );
                        setGroups([created]);
                      } catch (err) {
                        console.error("Error creating default group:", err);
                        setError(
                          "Failed to create default group. Please try again."
                        );
                      }
                    };

                    createDefaultGroup();
                  }}
                >
                  Create My First Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const retryLoad = () => {
    window.location.reload();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20 min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                Loading your financial data
              </h3>
              <p className="text-muted-foreground">
                Please wait while we fetch your information...
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-20 min-h-[60vh]">
          <div className="max-w-md mx-auto">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={retryLoad} className="w-full">
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
            <div className="space-y-6">
              <FinanceStats transactions={transactions} />
            </div>
            <ExpenseChart transactions={transactions} />
          </div>
        );

      case "categories":
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Category Analysis
              </h2>
              <p className="text-muted-foreground mt-2 text-lg">
                Understand where your money goes with detailed category
                breakdowns
              </p>
            </div>
            <CategoryChart transactions={transactions} />
          </div>
        );

      case "budget":
        return (
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
              <BudgetSetup
                budgets={budgets}
                onSaveBudgets={handleSaveBudgets}
              />
            </div>
            <div className="grid gap-8">
              <BudgetOverview budgets={budgets} />
              {budgets.length > 0 && <BudgetChart budgets={budgets} />}
            </div>
          </div>
        );

      case "add":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {editingTransaction ? "Edit Transaction" : "Add Transaction"}
              </h2>
              <p className="text-muted-foreground mt-2 text-lg">
                {editingTransaction
                  ? "Update your transaction details"
                  : "Record a new income or expense"}
              </p>
            </div>
            <TransactionForm
              onSubmit={handleAddTransaction}
              editingTransaction={editingTransaction}
              onCancel={handleCancelEdit}
            />
          </div>
        );

      case "transactions":
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Transaction History
              </h2>
              <p className="text-muted-foreground mt-2 text-lg">
                View and manage all your financial transactions
              </p>
            </div>
            <TransactionList
              transactions={transactions}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          </div>
        );
      
      case "split":
        return (
          <ExpenseSplit splitData={splitData} loading={loading} isGroupView={isGroupView()} />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-purple-50 dark:from-background dark:via-background dark:to-background flex">
      {/* Fixed Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Scrollable Main Content */}
      <div className="flex-1 md:ml-72 overflow-y-auto h-screen">
        <div className="container mx-auto px-4 py-8 md:px-8 md:py-12 max-w-7xl relative">
          {/* Header */}
          <div className="absolute top-4 right-4 z-10">
            <ThemeToggle />
          </div>
          <div className="mb-12 mt-16 md:mt-0">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent mb-4">
                Personal Finance
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
                Complete financial management with expense tracking, budgeting,
                and intelligent insights
              </p>

              {/* View Mode Toggle */}
              {currentGroup && (
                <div className="flex justify-center">
                  <ViewModeToggle />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8 flex flex-col items-center md:items-stretch">
            <div className="w-full max-w-6xl mx-auto">{renderContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}