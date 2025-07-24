import mongoose, { Document, Schema } from "mongoose";

interface IProfile extends Document {
  name: string;
  avatar?: string;
  color?: string;
}

interface IUserGroup extends Document {
  name: string;
  type: 'family' | 'roommates' | 'personal' | 'other' | 'friends';
  profiles: IProfile[];
}

const ProfileSchema = new Schema<IProfile>(
  {
    name: {
      type: String,
      required: [true, "Profile name is required"],
      trim: true,
      maxlength: [50, "Profile name cannot exceed 50 characters"],
      minlength: [1, "Profile name cannot be empty"],
    },
    avatar: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: "#3B82F6",
      match: [/^#[0-9A-F]{6}$/i, "Color must be a valid hex color"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const UserGroupSchema = new Schema<IUserGroup>(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      maxlength: [100, "Group name cannot exceed 100 characters"],
      minlength: [1, "Group name cannot be empty"],
    },
    type: {
      type: String,
      required: [true, "Group type is required"],
      enum: {
        // *** CRITICAL FIX: Ensure 'friends' is in the schema enum ***
        values: ['family', 'roommates', 'personal', 'other', 'friends'],
        message: 'Type must be one of: family, roommates, personal, friends, other',
      },
      default: 'personal',
    },
    profiles: [ProfileSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
UserGroupSchema.index({ type: 1 });
UserGroupSchema.index({ "profiles.name": 1 });

// Pre-save middleware
UserGroupSchema.pre<IUserGroup>("save", function (next) {
  this.name = this.name.trim();
  this.profiles.forEach(profile => {
    profile.name = profile.name.trim();
  });
  next();
});

export default mongoose.models.UserGroup ||
  mongoose.model<IUserGroup>("UserGroup", UserGroupSchema);