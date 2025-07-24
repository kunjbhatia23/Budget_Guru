import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import UserGroup from "@/models/UserGroup";
import ProfileTransaction from "@/models/ProfileTransaction";
import ProfileBudget from "@/models/ProfileBudget";
import mongoose from "mongoose";

// Update a group or its profiles
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    await dbConnect();
    const body = await request.json();

    const group = await UserGroup.findById(id);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Simple validation
    if (!body.name || body.profiles.length === 0) {
      return NextResponse.json(
        { error: "Group name and at least one profile are required." },
        { status: 400 }
      );
    }

    group.name = body.name;
    group.profiles = body.profiles;

    const updatedGroup = await group.save();
    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("Error updating user group:", error);
    return NextResponse.json(
      { error: "Failed to update user group" },
      { status: 500 }
    );
  }
}

// Delete a group or a specific profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const profileIdToDelete = searchParams.get('profileId');

  try {
    await dbConnect();

    // If a profileId is provided, delete only that profile
    if (profileIdToDelete) {
      const group = await UserGroup.findById(id);
      if (!group) {
        return NextResponse.json({ error: "Group not found" }, { status: 404 });
      }

      // Prevent deleting the last profile in a group
      if (group.profiles.length <= 1) {
        return NextResponse.json({ error: "Cannot delete the last profile in a group. Delete the group instead." }, { status: 400 });
      }
      
      // Pull the profile from the array
      group.profiles.pull({ _id: new mongoose.Types.ObjectId(profileIdToDelete) });
      
      // Also delete associated transactions and budgets
      await ProfileTransaction.deleteMany({ profileId: profileIdToDelete });
      await ProfileBudget.deleteMany({ profileId: profileIdToDelete });

      await group.save();
      return NextResponse.json(group);

    } else {
      // If no profileId, delete the entire group and all its associated data
      const group = await UserGroup.findByIdAndDelete(id);
      if (!group) {
        return NextResponse.json({ error: "Group not found" }, { status: 404 });
      }
      
      // Delete all associated transactions and budgets for the entire group
      await ProfileTransaction.deleteMany({ groupId: id });
      await ProfileBudget.deleteMany({ groupId: id });

      return NextResponse.json({ message: "Group deleted successfully" });
    }

  } catch (error) {
    console.error("Error deleting data:", error);
    return NextResponse.json(
      { error: "Failed to delete data" },
      { status: 500 }
    );
  }
}