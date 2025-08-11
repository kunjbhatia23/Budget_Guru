import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import UserGroup from "@/models/UserGroup";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const userId = (session.user as any).id;
    const groups = await UserGroup.find({ userId: userId }).lean();
    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching user groups:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user groups",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "An internal server error occurred.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const userId = (session.user as any).id;

    // --- Validation ---
    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    const allowedGroupTypes = ['family', 'roommates', 'personal', 'other', 'friends'];
    if (!body.type || !allowedGroupTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Valid group type is required. Must be one of: ${allowedGroupTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.profiles) || body.profiles.length === 0) {
      return NextResponse.json(
        { error: "At least one profile is required" },
        { status: 400 }
      );
    }

    for (const profile of body.profiles) {
      if (!profile.name || typeof profile.name !== "string" || profile.name.trim() === "") {
        return NextResponse.json(
          { error: "Each profile must have a valid name" },
          { status: 400 }
        );
      }
    }
    // --- End Validation ---

    const group = new UserGroup({
      name: body.name.trim(),
      type: body.type,
      profiles: body.profiles.map((p: any) => ({
        name: p.name.trim(),
        avatar: p.avatar || '',
        color: p.color || '#3B82F6',
      })),
      userId: userId, // Associate the group with the logged-in user
    });

    const savedGroup = await group.save();
    return NextResponse.json(savedGroup, { status: 201 });

  } catch (error: any) {
    console.error("Error creating user group:", error);

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
        error: "Failed to create user group",
        details:
          process.env.NODE_ENV === "development" ? error.message : "An internal server error occurred.",
      },
      { status: 500 }
    );
  }
}