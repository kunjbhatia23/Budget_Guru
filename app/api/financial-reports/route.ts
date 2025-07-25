import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import ProfileTransaction from "@/models/ProfileTransaction";
import ProfileBudget from "@/models/ProfileBudget";
import UserGroup from "@/models/UserGroup";
import { ProfileTransaction as ProfileTransactionType, ProfileBudget as ProfileBudgetType, UserGroup as UserGroupType } from "@/types/profile";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const groupId = searchParams.get('groupId');
    const month = searchParams.get('month'); // YYYY-MM format

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Month is required and must be in YYYY-MM format" }, { status: 400 });
    }

    const startOfMonth = `${month}-01`;
    const endOfMonth = new Date(new Date(month).getFullYear(), new Date(month).getMonth() + 1, 0).toISOString().slice(0, 10);

    const groupObjectId = new mongoose.Types.ObjectId(groupId);

    let transactionQuery: any = {
      groupId: groupObjectId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    };
    let budgetQuery: any = {
      groupId: groupObjectId,
    };

    let profileName: string | undefined;
    let groupName: string | undefined;

    // Fetch the group once to get its name and potentially the profile name
    const group = await UserGroup.findById(groupObjectId).lean<UserGroupType>();
    if (group) {
        groupName = group.name;
        if (profileId) {
            const foundProfile = group.profiles.find(p => p._id?.toString() === profileId);
            profileName = foundProfile?.name;
            transactionQuery.profileId = new mongoose.Types.ObjectId(profileId);
            budgetQuery.profileId = new mongoose.Types.ObjectId(profileId);
        }
    } else {
        // If group not found, return error
        return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }


    // Fetch transactions
    const transactions = await ProfileTransaction.find(transactionQuery).lean<ProfileTransactionType[]>();

    // Fetch budgets relevant to the group/profile
    let budgets = [];
    if (profileId) { // Individual Budget vs. Actual
      budgets = await ProfileBudget.find(budgetQuery).lean<ProfileBudgetType[]>();
    } else { // Group Budget vs. Actual (using aggregated budgets from all profiles in the group)
      const aggregatedBudgets = await ProfileBudget.aggregate([
        { $match: { groupId: groupObjectId } },
        { $group: {
            _id: "$category",
            amount: { $sum: "$amount" }
        }},
        { $project: {
            _id: 0,
            category: "$_id",
            amount: 1
        }}
      ]);
      budgets = aggregatedBudgets;
    }


    // Calculate Monthly Income and Expenses (excluding settlements for true financial tracking)
    const monthlyIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate Category-wise Spending
    const categorySpending: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
      });

    // Calculate Budget vs. Actual
    const budgetVsActual: any[] = [];
    const monthlyExpensesForBudgets = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    budgets.forEach((budget: any) => {
        const spent = monthlyExpensesForBudgets[budget.category] || 0;
        budgetVsActual.push({
            category: budget.category,
            budgeted: budget.amount,
            spent: spent,
            remaining: budget.amount - spent,
            percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0
        });
    });

    return NextResponse.json({
      reportMonth: month,
      scope: profileId && profileName
        ? `Individual (${profileName} in ${groupName || 'Unknown Group'})`
        : `Group (${groupName || 'Unknown Group'})`,
      summary: {
        totalIncome: monthlyIncome,
        totalExpenses: monthlyExpenses,
      },
      categorySpending: Object.entries(categorySpending).map(([category, amount]) => ({ category, amount })),
      budgetVsActual,
      transactions: transactions.map(t => ({
        id: t._id,
        profileId: t.profileId,
        groupId: t.groupId,
        amount: t.amount,
        date: t.date,
        description: t.description,
        type: t.type,
        category: t.category,
        createdAt: t.createdAt
      })),
    });

  } catch (error) {
    console.error("Error generating financial report:", error);
    return NextResponse.json(
      { error: "Failed to generate financial report" },
      { status: 500 }
    );
  }
}