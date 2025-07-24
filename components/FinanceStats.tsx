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
  ArrowDownRight
} from 'lucide-react';

interface FinanceStatsProps {
  transactions: Transaction[];
}

export function FinanceStats({ transactions }: FinanceStatsProps) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
  const thisMonthIncome = thisMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const thisMonthExpenses = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const daysInMonth = new Date().getDate();
  const avgDailySpending = daysInMonth > 0 ? thisMonthExpenses / daysInMonth : 0;

  const savingsRate = thisMonthIncome > 0
    ? ((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100
    : 0;

  const stats = [
    {
      title: 'Total Balance',
      value: formatCurrency(balance),
      icon: DollarSign,
      color: balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      bgColor: balance >= 0 ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900',
      borderColor: balance >= 0 ? 'border-green-200 dark:border-green-700' : 'border-red-200 dark:border-red-700',
      description: 'Net worth',
      trend: balance >= 0 ? 'positive' : 'negative',
      change: balance >= 0 ? '+' : ''
    },
    {
      title: 'Monthly Income',
      value: formatCurrency(thisMonthIncome),
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900',
      borderColor: 'border-green-200 dark:border-green-700',
      description: 'This month',
      trend: 'positive',
      change: '+'
    },
    {
      title: 'Monthly Expenses',
      value: formatCurrency(thisMonthExpenses),
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900',
      borderColor: 'border-red-200 dark:border-red-700',
      description: 'This month',
      trend: 'negative',
      change: '-'
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
          ? 'bg-green-50 dark:bg-green-900'
          : savingsRate >= 10
          ? 'bg-yellow-50 dark:bg-yellow-900'
          : 'bg-red-50 dark:bg-red-900',
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

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full max-w-6xl mx-auto">
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
              {stat.badge && (
                <Badge
                  variant={stat.trend === 'positive' ? 'default' : 'secondary'}
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

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
