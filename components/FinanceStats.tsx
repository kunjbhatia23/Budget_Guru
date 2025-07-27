'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/types/finance';
import { formatCurrency } from '@/lib/finance-utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinanceStatsProps {
  transactions: Transaction[];
  isGroupView: boolean;
}

export function FinanceStats({ transactions, isGroupView }: FinanceStatsProps) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));

  // --- Calculations for Monthly Income/Expenses (Actual Budgeting Categories) ---
  // These should *not* include settlement transactions, as they represent actual income/spending for budgeting.
  const actualMonthlyIncome = thisMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const actualMonthlyExpenses = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // --- Calculations for Overall Total Balance (All Cash Movements) ---
  // This *should* include settlement transactions to reflect net cash position.
  const totalCashInflow = transactions
    .filter(t => t.type === 'income' || t.type === 'settlement_received')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCashOutflow = transactions
    .filter(t => t.type === 'expense' || t.type === 'settlement_paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const netOverallBalance = totalCashInflow - totalCashOutflow;

  // --- Savings Rate calculation ---
  const savingsRate = actualMonthlyIncome > 0
    ? ((actualMonthlyIncome - actualMonthlyExpenses) / actualMonthlyIncome) * 100
    : 0;

  let stats = [
    {
      title: 'Total Balance',
      value: formatCurrency(netOverallBalance), // Use netOverallBalance here
      icon: IndianRupee,
      color: netOverallBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      bgColor: netOverallBalance >= 0 ? 'bg-green-50 dark:bg-green-900/50' : 'bg-red-50 dark:bg-red-900/50',
      borderColor: netOverallBalance >= 0 ? 'border-green-200 dark:border-green-700' : 'border-red-200 dark:border-red-700',
      description: 'Net financial position across all types',
      trend: netOverallBalance >= 0 ? 'positive' : 'negative',
    },
    {
      title: 'Monthly Income',
      value: formatCurrency(actualMonthlyIncome), // Use actualMonthlyIncome
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/50',
      borderColor: 'border-green-200 dark:border-green-700',
      description: 'This month (excluding settlements)',
      trend: 'positive',
    },
    {
      title: 'Monthly Expenses',
      value: formatCurrency(actualMonthlyExpenses), // Use actualMonthlyExpenses
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/50',
      borderColor: 'border-red-200 dark:border-red-700',
      description: 'This month (excluding settlements)',
      trend: 'negative',
    },
    {
      title: 'Savings Rate',
      value: `${savingsRate.toFixed(1)}%`,
      icon: Target,
      color:
        savingsRate >= 20
          ? 'text-green-600 dark:text-green-400'
          : savingsRate >= 10
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-red-600 dark:text-red-400',
      bgColor:
        savingsRate >= 20
          ? 'bg-green-50 dark:bg-green-900/50'
          : savingsRate >= 10
          ? 'bg-yellow-50 dark:bg-yellow-900/50'
          : 'bg-red-50 dark:bg-red-900/50',
      borderColor:
        savingsRate >= 20
          ? 'border-green-200 dark:border-green-700'
          : savingsRate >= 10
          ? 'border-yellow-200 dark:border-yellow-700'
          : 'border-red-200 dark:border-red-700',
      description: 'Monthly rate',
      trend: savingsRate >= 20 ? 'positive' : savingsRate >= 10 ? 'neutral' : 'negative',
      badge: savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs Work'
    },
  ];

  if (isGroupView) {
    // In group view, income and savings rate are typically not relevant per profile
    stats = stats.filter(stat => stat.title !== 'Monthly Income' && stat.title !== 'Savings Rate');
    // Adjust description for Total Balance in group view if needed
    stats = stats.map(stat => stat.title === 'Total Balance' ? { ...stat, description: 'Net balance including settlements' } : stat);
  }

  return (
    <div className={cn(
        "grid gap-4 grid-cols-1 sm:grid-cols-2",
        isGroupView ? "lg:grid-cols-2" : "lg:grid-cols-4"
    )}>
      {stats.map((stat, index) => (
        <Card
          key={index}
          className={cn(
            "transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2",
            stat.borderColor,
            "bg-white dark:bg-zinc-900"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-zinc-300">
                {stat.title}
              </CardTitle>
              {stat.badge && !isGroupView && ( // Savings rate badge only in individual view
                <Badge
                  variant={stat.trend === 'positive' ? 'default' : stat.trend === 'neutral' ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {stat.badge}
                </Badge>
              )}
            </div>
            <div className={cn("p-3 rounded-xl shadow-sm", stat.bgColor)}>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={cn("text-xl lg:text-2xl font-bold", stat.color)}>
                {stat.value}
              </div>
              {stat.trend === 'positive' && (
                <ArrowUpRight className="h-4 w-4 text-green-500 dark:text-green-300" />
              )}
              {stat.trend === 'negative' && (
                <ArrowDownRight className="h-4 w-4 text-red-500 dark:text-red-300" />
              )}
            </div>
            <p className="text-xs text-muted-foreground dark:text-zinc-400">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}