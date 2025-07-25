import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import ProfileTransaction from "@/models/ProfileTransaction";
import UserGroup from "@/models/UserGroup";
import { UserGroup as UserGroupType } from "@/types/profile";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { fromProfileId, toProfileId, groupId, amount } = await request.json();

    if (!fromProfileId || !toProfileId || !groupId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: "Missing or invalid settlement data" }, { status: 400 });
    }

    const groupObjectId = new mongoose.Types.ObjectId(groupId);

    const group = await UserGroup.findById(groupObjectId).lean<UserGroupType>();
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const fromProfile = group.profiles.find((p) => p._id?.toString() === fromProfileId);
    const toProfile = group.profiles.find((p) => p._id?.toString() === toProfileId);

    if (!fromProfile || !toProfile) {
      return NextResponse.json({ error: "One or both profiles not found in the group" }, { status: 404 });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      const payerTransaction = new ProfileTransaction({
        profileId: new mongoose.Types.ObjectId(fromProfileId),
        groupId: groupObjectId,
        amount: amount,
        date: currentDate,
        description: `Settlement paid to ${toProfile.name}`,
        type: 'settlement_paid', // CHANGED TYPE
        category: 'Settlement',
      });

      const receiverTransaction = new ProfileTransaction({
        profileId: new mongoose.Types.ObjectId(toProfileId),
        groupId: groupObjectId,
        amount: amount,
        date: currentDate,
        description: `Settlement received from ${fromProfile.name}`,
        type: 'settlement_received', // CHANGED TYPE
        category: 'Settlement',
      });

      await payerTransaction.save({ session });
      await receiverTransaction.save({ session });

      await session.commitTransaction();
      session.endSession();

      return NextResponse.json({ message: "Settlement recorded successfully" }, { status: 200 });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Transaction failed during settlement:", error);
      return NextResponse.json({ error: "Failed to record settlement due to transaction error" }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in settle-expense API:", error);
    return NextResponse.json(
      { error: "Internal Server Error during settlement process" },
      { status: 500 }
    );
  }
}