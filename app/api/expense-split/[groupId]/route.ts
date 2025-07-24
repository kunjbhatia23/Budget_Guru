import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import ProfileTransaction from "@/models/ProfileTransaction";
import UserGroup from "@/models/UserGroup";
import { Balance, Settlement, ExpenseSplitData, Profile, UserGroup as UserGroupType } from "@/types/profile";

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

    const expenses = await ProfileTransaction.find({
      groupId: groupObjectId,
      type: 'expense'
    }).lean();

    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const perPersonShare = numProfiles > 0 ? totalExpense / numProfiles : 0;

    const paidByEachProfile: { [key: string]: number } = {};
    for (const expense of expenses) {
      const profileId = expense.profileId.toString();
      paidByEachProfile[profileId] = (paidByEachProfile[profileId] || 0) + expense.amount;
    }

    const balances: Balance[] = profiles.map((profile: Profile) => {
      const profileId = profile._id!.toString();
      const paid = paidByEachProfile[profileId] || 0;
      return {
        profileId,
        name: profile.name,
        color: profile.color,
        paid,
        balance: paid - perPersonShare
      };
    });

    const settlements: Settlement[] = [];
    const debtors = balances.filter(p => p.balance < 0).map(p => ({ ...p, balance: Math.abs(p.balance) }));
    const creditors = balances.filter(p => p.balance > 0);

    debtors.sort((a, b) => a.balance - b.balance);
    creditors.sort((a, b) => a.balance - b.balance);

    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];
      const amount = Math.min(debtor.balance, creditor.balance);

      if (amount > 0.005) {
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