import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import ProfileTransaction from "@/models/ProfileTransaction";
import UserGroup from "@/models/UserGroup";
import { Balance, Settlement, ExpenseSplitData, Profile, UserGroup as UserGroupType, ProfileTransaction as ProfileTransactionType } from "@/types/profile";

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const { groupId } = params;

  if (!groupId) {
    return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
  }

  try {
    await dbConnect();
    const groupObjectId = new mongoose.Types.ObjectId(groupId);

    const group = await UserGroup.findById(groupObjectId).lean<UserGroupType>();
    if (!group || !group.profiles || group.profiles.length === 0) {
      return NextResponse.json({ error: "Group not found or has no members" }, { status: 404 });
    }
    const profiles = group.profiles;
    const numProfiles = profiles.length;

    // Fetch ALL relevant transactions for the group
    const allTransactions = await ProfileTransaction.find({
      groupId: groupObjectId,
      type: { $in: ['expense', 'settlement_paid', 'settlement_received'] } // Include settlement types
    }).lean<ProfileTransactionType[]>();

    // Separate actual expenses from settlement transactions
    const actualExpenses = allTransactions.filter(t => t.type === 'expense');
    const settlementTransactions = allTransactions.filter(t => t.type === 'settlement_paid' || t.type === 'settlement_received');

    // Calculate total expense and per-person share ONLY from actual expenses
    const totalExpense = actualExpenses.reduce((sum, t) => sum + t.amount, 0);
    const perPersonShare = numProfiles > 0 ? totalExpense / numProfiles : 0;

    // Calculate money paid by each profile ONLY from actual expenses
    const paidByEachProfile: { [key: string]: number } = {};
    for (const expense of actualExpenses) {
      const profileId = expense.profileId.toString();
      paidByEachProfile[profileId] = (paidByEachProfile[profileId] || 0) + expense.amount;
    }

    // Initialize balances based on actual expenses
    const balancesMap: { [key: string]: { paid: number; balance: number } } = {};
    for (const profile of profiles) {
      const profileId = profile._id!.toString();
      const paid = paidByEachProfile[profileId] || 0;
      balancesMap[profileId] = {
        paid,
        balance: paid - perPersonShare
      };
    }

    // Adjust balances for recorded settlements
    for (const settlement of settlementTransactions) {
      const profileId = settlement.profileId.toString();
      if (balancesMap[profileId]) { // Ensure profile exists in map
        if (settlement.type === 'settlement_paid') {
          balancesMap[profileId].balance += settlement.amount;
        } else if (settlement.type === 'settlement_received') {
          balancesMap[profileId].balance -= settlement.amount;
        }
      }
    }

    const balances: Balance[] = profiles.map((profile: Profile) => {
      const profileId = profile._id!.toString();
      const currentBalance = balancesMap[profileId];
      return {
        profileId,
        name: profile.name,
        color: profile.color,
        paid: currentBalance.paid,
        balance: parseFloat(currentBalance.balance.toFixed(2)) // Ensure precision
      };
    });

    // Re-calculate settlements from the adjusted balances
    const settlements: Settlement[] = [];
    const tempBalances = balances.map(b => ({ ...b, balance: b.balance }));

    const debtors = tempBalances.filter(p => p.balance < 0).map(p => ({ ...p, balance: Math.abs(p.balance) }));
    const creditors = tempBalances.filter(p => p.balance > 0);

    debtors.sort((a, b) => a.balance - b.balance);
    creditors.sort((a, b) => a.balance - b.balance);

    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];
      const amount = Math.min(debtor.balance, creditor.balance);

      if (amount > 0.005) { // Threshold for floating point inaccuracies to avoid tiny settlements
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: parseFloat(amount.toFixed(2))
        });
        debtor.balance -= amount;
        creditor.balance -= amount;
      }

      if (debtor.balance < 0.005) {
        debtorIndex++;
      }
      if (creditor.balance < 0.005) {
        creditorIndex++;
      }
    }

    const responseData: ExpenseSplitData = {
      totalExpense,
      perPersonShare,
      balances,
      settlements
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Error calculating expense split:", error);
    return NextResponse.json(
      { error: "Failed to calculate expense split" },
      { status: 500 }
    );
  }
}