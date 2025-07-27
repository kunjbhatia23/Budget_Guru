import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ProfileTransaction from "@/models/ProfileTransaction";
import mongoose from "mongoose";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;
  try {
    await dbConnect();
    const body = await request.json();

    // Prepare the update object, unsetting assetId if it's null or an empty string
    const updateData: { [key: string]: any } = { ...body };
    if (body.assetId) {
        updateData.assetId = new mongoose.Types.ObjectId(body.assetId);
    } else {
        // If assetId is missing or null, ensure it's removed from the document
        updateData.$unset = { assetId: 1 };
    }

    const updatedTransaction = await ProfileTransaction.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Error updating profile transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;
  try {
    await dbConnect();
    const deletedTransaction = await ProfileTransaction.findByIdAndDelete(id);
    if (!deletedTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}