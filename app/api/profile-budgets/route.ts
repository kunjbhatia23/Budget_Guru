import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import ProfileBudget from "@/models/ProfileBudget";
import ProfileTransaction from "@/models/ProfileTransaction";
import { VALIDATION_CONFIG } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const groupId = searchParams.get('groupId');
    const viewMode = searchParams.get('viewMode') || 'individual';

    // **LOGIC FOR INDIVIDUAL VIEW**
    if (viewMode === 'individual') {
      if (!profileId) {
        return NextResponse.json({ error: "Profile ID is required for individual view" }, { status: 400 });
      }
      
      const budgets = await ProfileBudget.find({ profileId: new mongoose.Types.ObjectId(profileId) }).lean();
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      lastDayOfMonth.setHours(23, 59, 59, 999);

      const monthlyExpenses = await ProfileTransaction.aggregate([
        { $match: { 
            profileId: new mongoose.Types.ObjectId(profileId),
            type: "expense",
            date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
        }},
        { $group: { _id: "$category", spent: { $sum: "$amount" }}},
      ]);

      const expenseMap = monthlyExpenses.reduce((acc, item) => {
        acc[item._id] = item.spent;
        return acc;
      }, {} as Record<string, number>);

      const updatedBudgets = budgets.map((budget) => {
        const spent = expenseMap[budget.category] || 0;
        return {
          ...budget,
          spent,
          remaining: budget.amount - spent,
          percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
        };
      });
      return NextResponse.json(updatedBudgets);
    }
    
    // **NEW AGGREGATION LOGIC FOR GROUP VIEW**
    if (viewMode === 'group') {
      if (!groupId) {
        return NextResponse.json({ error: "Group ID is required for group view" }, { status: 400 });
      }
      const groupObjectId = new mongoose.Types.ObjectId(groupId);

      // 1. Aggregate budgets by category for the whole group
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
      
      // 2. Aggregate expenses by category for the whole group for the current month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      lastDayOfMonth.setHours(23, 59, 59, 999);

      const monthlyExpenses = await ProfileTransaction.aggregate([
        { $match: {
            groupId: groupObjectId,
            type: 'expense',
            date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
        }},
        { $group: {
            _id: '$category',
            spent: { $sum: '$amount' }
        }}
      ]);

      const expenseMap = monthlyExpenses.reduce((acc, item) => {
        acc[item._id] = item.spent;
        return acc;
      }, {} as Record<string, number>);

      // 3. Combine aggregated budgets and expenses
      const finalGroupBudgets = aggregatedBudgets.map(budget => {
        const spent = expenseMap[budget.category] || 0;
        return {
          id: budget.category, // Use category as a unique key
          ...budget,
          spent,
          remaining: budget.amount - spent,
          percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
        };
      });

      return NextResponse.json(finalGroupBudgets);
    }

    return NextResponse.json({ error: "Invalid view mode specified" }, { status: 400 });

  } catch (error) {
    console.error("Error fetching profile budgets:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch budgets",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!body.profileId || typeof body.profileId !== "string") {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      );
    }

    if (!body.groupId || typeof body.groupId !== "string") {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.budgets)) {
      return NextResponse.json(
        { error: "Budgets must be an array" },
        { status: 400 }
      );
    }

    for (const budget of body.budgets) {
      if (!budget.category || typeof budget.category !== "string" || budget.category.trim() === "") {
        return NextResponse.json(
          { error: "Each budget must have a valid category" },
          { status: 400 }
        );
      }

      if (!budget.amount || typeof budget.amount !== "number" || budget.amount < VALIDATION_CONFIG.minAmount) {
        return NextResponse.json(
          { error: "Each budget must have a valid amount greater than 0.01" },
          { status: 400 }
        );
      }

      if (budget.amount > VALIDATION_CONFIG.maxAmount) {
        return NextResponse.json(
          { error: `Budget amount cannot exceed ${VALIDATION_CONFIG.maxAmount}` },
          { status: 400 }
        );
      }
    }

    const categories = body.budgets.map((b: any) => b.category.trim().toLowerCase());
    const uniqueCategories = new Set(categories);
    if (categories.length !== uniqueCategories.size) {
      return NextResponse.json(
        { error: "Duplicate budget categories are not allowed" },
        { status: 400 }
      );
    }

    await ProfileBudget.deleteMany({ profileId: body.profileId });

    const sanitizedBudgets = body.budgets.map((budget: any) => ({
      profileId: body.profileId,
      groupId: body.groupId,
      category: budget.category.trim(),
      amount: Number(budget.amount.toFixed(2)),
    }));

    const savedBudgets = await ProfileBudget.insertMany(sanitizedBudgets);
    return NextResponse.json(savedBudgets, { status: 201 });
  } catch (error: any) {
    console.error("Error saving profile budgets:", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to save budgets",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}