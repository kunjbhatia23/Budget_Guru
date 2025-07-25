'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ExpenseSplitData, Profile } from '@/types/profile';
import { formatCurrency } from '@/lib/finance-utils';
import { Scale, ArrowRight, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfileStore } from '@/store/profile-store';

interface ExpenseSplitProps {
  splitData: ExpenseSplitData | null;
  loading: boolean;
  isGroupView: boolean;
  onSettleUp: (fromProfileId: string, toProfileId: string, amount: number) => Promise<void>;
}

export function ExpenseSplit({ splitData, loading, isGroupView, onSettleUp }: ExpenseSplitProps) {
  const { currentGroup } = useProfileStore();

  if (!isGroupView) {
    return (
       <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Expense Split
          </CardTitle>
          <CardDescription>
            This feature is only available in Group View to settle expenses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Please switch to Group View to see the expense breakdown.
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
       <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Expense Split
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Calculating splits...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!splitData || splitData.totalExpense === 0) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Expense Split
          </CardTitle>
          <CardDescription>
            No expenses found for this group to calculate splits.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { totalExpense, perPersonShare, balances, settlements } = splitData;

  const getProfileIdFromName = (name: string): string | undefined => {
    return currentGroup?.profiles.find((p: Profile) => p.name === name)?._id;
  };

  const handleSettleUpClick = async (fromName: string, toName: string, amount: number) => {
    const fromProfileId = getProfileIdFromName(fromName);
    const toProfileId = getProfileIdFromName(toName);
    const groupId = currentGroup?._id;

    if (fromProfileId && toProfileId && groupId) {
      await onSettleUp(fromProfileId, toProfileId, amount);
    } else {
      console.error("Could not find profile IDs or group ID for settlement.");
      // Optionally show a toast error here if onSettleUp doesn't handle it
    }
  };

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Summary
          </CardTitle>
          <CardDescription>
            A summary of who paid what and who owes whom in the group.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-lg">Overall Totals</h3>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Group Expense:</span>
              <span className="font-bold text-lg">{formatCurrency(totalExpense)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Share per Person:</span>
              <span className="font-bold text-lg">{formatCurrency(perPersonShare)}</span>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-lg mb-4">Balances</h3>
            {balances.map(p => (
              <div key={p.profileId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback style={{ backgroundColor: p.color }}>
                      {p.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{p.name}</span>
                </div>
                <div className="text-right">
                  <div className={p.balance >= 0 ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                    {p.balance >= 0 ? `Is owed ${formatCurrency(p.balance)}` : `Owes ${formatCurrency(Math.abs(p.balance))}`}
                  </div>
                   <div className="text-xs text-muted-foreground">Paid {formatCurrency(p.paid)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Settle Up</CardTitle>
          <CardDescription>
            The simplest way for everyone to get paid back.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">All expenses are settled!</p>
          ) : (
            <div className="space-y-4">
              {settlements.map((s, index) => (
                <div key={index} className="flex flex-col md:flex-row items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2 md:mb-0">
                    <span className="font-medium text-red-500">{s.from}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-lg text-primary">{formatCurrency(s.amount)}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-green-500">{s.to}</span>
                  </div>
                  <Button
                    onClick={() => handleSettleUpClick(s.from, s.to, s.amount)}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Settle Up
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}