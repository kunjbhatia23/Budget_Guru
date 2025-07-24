'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Budget } from '@/types/finance';
import { useChartTheme } from '@/lib/theme-config';
import { formatCurrency } from '@/lib/finance-utils';
import { BarChart3 } from 'lucide-react';

interface BudgetChartProps {
  budgets: Budget[];
}

export function BudgetChart({ budgets }: BudgetChartProps) {
  const chartTheme = useChartTheme();

  const chartData = budgets.map((budget) => ({
    category:
      budget.category.length > 12
        ? budget.category.substring(0, 12) + '...'
        : budget.category,
    fullCategory: budget.category,
    budget: budget.amount,
    spent: budget.spent,
    remaining: budget.amount - budget.spent
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-md text-card-foreground">
          <p className="font-medium mb-2">{data.fullCategory}</p>
          <div className="space-y-1 text-sm">
            <p className="text-primary">Budget: {formatCurrency(data.budget)}</p>
            <p className="text-destructive">Spent: {formatCurrency(data.spent)}</p>
            <p
              className={
                data.remaining >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }
            >
              Remaining: {formatCurrency(data.remaining)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card className="w-full bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center md:text-left">
            <BarChart3 className="h-5 w-5" />
            Budget vs Actual
          </CardTitle>
          <CardDescription className="text-center md:text-left">
            Compare your planned budget with actual spending
          </CardDescription>
        </CardHeader>

        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No budget data available. Set up your budgets to see the comparison chart.
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray={chartTheme.grid.strokeDasharray}
                  />
                  <XAxis
                    dataKey="category"
                    className="text-sm"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    className="text-sm"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="budget"
                    fill="#7c3aed" // Tailwind violet-600
                    name="Budget"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="spent"
                    fill="#c026d3" // Tailwind fuchsia-600
                    name="Spent"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
