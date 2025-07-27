import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ProfileTransaction from "@/models/ProfileTransaction";
import mongoose from "mongoose";

// --- GET Handler ---
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const groupId = searchParams.get('groupId');
    const viewMode = searchParams.get('viewMode');

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    // Build the query based on the view mode
    const query: { [key: string]: any } = { groupId: new mongoose.Types.ObjectId(groupId) };
    if (viewMode === 'individual' && profileId) {
      query.profileId = new mongoose.Types.ObjectId(profileId);
    }
    
    const transactions = await ProfileTransaction.find(query).sort({ date: -1, createdAt: -1 });

    return NextResponse.json(transactions);

  } catch (error: any) {
    console.error("Error fetching profile transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions", details: error.message },
      { status: 500 }
    );
  }
}


// --- POST Handler ---
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const transactionData: any = {
      profileId: body.profileId,
      groupId: body.groupId,
      amount: body.amount,
      date: body.date,
      description: body.description,
      type: body.type,
      category: body.category,
      isRecurring: body.isRecurring || false,
    };

    if (body.assetId) {
      transactionData.assetId = new mongoose.Types.ObjectId(body.assetId);
    }
    
    if (body.isRecurring) {
        transactionData.recurringFrequency = body.recurringFrequency;
        transactionData.recurringDayOfMonth = body.recurringDayOfMonth;
    }

    const transaction = new ProfileTransaction(transactionData);
    await transaction.save();
    
    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error("Error creating profile transaction:", error);
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create transaction", details: error.message },
      { status: 500 }
    );
  }
}