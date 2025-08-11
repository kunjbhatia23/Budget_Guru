"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Transaction } from "@/types/finance";
import {
  formatCurrency,
  formatDate,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/lib/finance-utils";
import {
  Search,
  Edit3,
  Trash2,
  Receipt,
  TrendingUp,
  TrendingDown,
  Filter,
  Repeat,
  X,
} from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  isGroupView: boolean;
}

export function TransactionList({
  transactions,
  onEdit,
  onDelete,
  isGroupView,
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "settlement">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterRecurring, setFilterRecurring] = useState<boolean>(false);

  const allCategories = useMemo(() => [
    ...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, 'Settlement']),
  ], []);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((transaction) => {
        // Search filter
        const matchesSearch =
          transaction.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.category.toLowerCase().includes(searchTerm.toLowerCase());

        // Type filter
        let matchesType = true;
        if (filterType !== "all") {
            if (filterType === "income") matchesType = transaction.type === "income";
            else if (filterType === "expense") matchesType = transaction.type === "expense";
            else if (filterType === "settlement") matchesType = transaction.type === "settlement_paid" || transaction.type === "settlement_received";
        }
        
        // Category filter
        const matchesCategory =
          filterCategory === "all" || transaction.category === filterCategory;

        // Recurring filter
        const matchesRecurring = !filterRecurring || !!transaction.isRecurring;

        return matchesSearch && matchesType && matchesCategory && matchesRecurring;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, filterType, filterCategory, filterRecurring]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterCategory("all");
    setFilterRecurring(false);
  };
  
  const hasActiveFilters = searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterRecurring;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          Transaction History
        </CardTitle>
        <CardDescription>
          View and manage all your transactions with advanced filtering options.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* --- Filter Section --- */}
        <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by description or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {!isGroupView && <SelectItem value="income">Income</SelectItem>}
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="settlement">Settlements</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-2 justify-start pt-2">
                <Switch 
                  id="recurring-filter" 
                  checked={filterRecurring}
                  onCheckedChange={setFilterRecurring}
                />
                <Label htmlFor="recurring-filter" className="text-sm font-medium">Show only recurring</Label>
              </div>
            </div>
            
            {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full md:w-auto text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
            )}
        </div>

        {/* --- Transaction List --- */}
        <div className="space-y-2">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => {
              const isPositive = transaction.type === "income" || transaction.type === "settlement_received";
              
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex-shrink-0 p-2 rounded-full ${isPositive ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"}`}>
                      {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{transaction.description}</p>
                        {transaction.isRecurring && (
                          <Badge
                            className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-transparent font-medium hover:bg-purple-200 dark:hover:bg-purple-900"
                          >
                            <Repeat className="h-3 w-3 mr-1" />
                            Recurring
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(transaction.date)} • <Badge variant="secondary" className="text-xs">{transaction.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <p className={`hidden sm:block font-bold text-lg ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {isPositive ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(transaction)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(transaction.id!)} className="text-red-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>No transactions found.</p>
              {hasActiveFilters && <p className="text-sm mt-1">Try adjusting your filters.</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}