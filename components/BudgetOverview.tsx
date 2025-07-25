'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Budget } from '@/types/finance';
import { formatCurrency } from '@/lib/finance-utils';
import {
  Target,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface BudgetOverviewProps {
  budgets: Budget[];
}

export function BudgetOverview({ budgets }: BudgetOverviewProps) {
  if (budgets.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <Card className="bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-center md:text-left text-violet-800 dark:text-violet-100">
              <Target className="h-5 w-5" />
              Budget Overview
            </CardTitle>
            <CardDescription className="text-center md:text-left text-violet-600 dark:text-violet-300">
              Set up budgets to track your spending goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-violet-500 dark:text-violet-300">
              No budgets set up yet. Click "Setup Budget" to get started.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // This function now uses the already calculated percentage from the budget object
  const getBudgetStatus = (percentage: number) => {
    if (percentage >= 100)
      return { color: 'destructive', icon: AlertTriangle, text: 'Over Budget' };
    if (percentage >= 80)
      return { color: 'warning', icon: Clock, text: 'Near Limit' };
    return { color: 'success', icon: CheckCircle, text: 'On Track' };
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0); // Use spent directly from budget object
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card className="bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center md:text-left text-violet-800 dark:text-violet-100">
            <Target className="h-5 w-5" />
            Budget Overview
          </CardTitle>
          <CardDescription className="text-center md:text-left text-violet-600 dark:text-violet-300">
            Track your spending against your monthly budgets
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overall Budget Summary */}
          <div className="p-4 rounded-lg bg-violet-100/60 dark:bg-violet-900">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-violet-800 dark:text-violet-200">
                Overall Budget
              </h3>
              <Badge
                variant={
                  overallPercentage >= 100
                    ? 'destructive'
                    : overallPercentage >= 80
                    ? 'secondary'
                    : 'default'
                }
              >
                {overallPercentage.toFixed(0)}%
              </Badge>
            </div>
            <Progress
              value={Math.min(100, overallPercentage)}
              variant={
                overallPercentage >= 100
                  ? 'destructive'
                  : overallPercentage >= 80
                  ? 'warning'
                  : 'default'
              }
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-violet-700 dark:text-violet-300">
              <span>Spent: {formatCurrency(totalSpent)}</span>
              <span>Budget: {formatCurrency(totalBudget)}</span>
            </div>
          </div>

          {/* Individual Budgets */}
          <div className="space-y-4">
            {budgets.map((budget) => {
              // Directly use values from the budget object, which are calculated by the API
              const status = getBudgetStatus(budget.percentage);
              const StatusIcon = status.icon;

              return (
                <div key={budget.id} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-violet-800 dark:text-violet-100">
                        {budget.category}
                      </h4>
                      <Badge
                        variant={
                          status.color === 'destructive'
                            ? 'destructive'
                            : status.color === 'warning'
                            ? 'secondary'
                            : 'default'
                        }
                        className="text-xs"
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.text}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium text-center sm:text-right text-violet-700 dark:text-violet-300">
                      {budget.percentage.toFixed(0)}%
                    </span>
                  </div>

                  <Progress
                    value={Math.min(100, budget.percentage)}
                    variant={
                      budget.percentage >= 100
                        ? 'destructive'
                        : budget.percentage >= 80
                        ? 'warning'
                        : 'default'
                    }
                    className="h-2"
                  />

                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-violet-700 dark:text-violet-300 gap-1">
                    <span>Spent: {formatCurrency(budget.spent)}</span>
                    <span className="text-center sm:text-right">
                      {budget.remaining >= 0
                        ? `${formatCurrency(budget.remaining)} left`
                        : `${formatCurrency(Math.abs(budget.remaining))} over`}
                    </span>
                    <span className="text-right">
                      Budget: {formatCurrency(budget.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}