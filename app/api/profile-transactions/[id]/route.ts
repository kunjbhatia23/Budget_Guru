import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ProfileTransaction from "@/models/ProfileTransaction";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    await dbConnect();
    const body = await request.json();
    const updatedTransaction = await ProfileTransaction.findByIdAndUpdate(
      id,
      body,
      { new: true }
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
) {
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