import mongoose, { Document, Schema } from "mongoose";
import { VALIDATION_CONFIG } from "@/lib/constants";

interface IProfileBudget extends Document {
  profileId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
}

const ProfileBudgetSchema = new Schema<IProfileBudget>(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Profile ID is required"],
      index: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Group ID is required"],
      ref: 'UserGroup',
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [
        VALIDATION_CONFIG.maxCategoryLength,
        `Category cannot exceed ${VALIDATION_CONFIG.maxCategoryLength} characters`,
      ],
      minlength: [1, "Category cannot be empty"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [
        VALIDATION_CONFIG.minAmount,
        `Amount must be at least ${VALIDATION_CONFIG.minAmount}`,
      ],
      max: [
        VALIDATION_CONFIG.maxAmount,
        `Amount cannot exceed ${VALIDATION_CONFIG.maxAmount}`,
      ],
      validate: {
        validator: function (value: number) {
          return !isNaN(value) && isFinite(value);
        },
        message: "Amount must be a valid number",
      },
    },
    spent: {
      type: Number,
      default: 0,
      min: [0, "Spent amount cannot be negative"],
    },
    remaining: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
      min: [0, "Percentage cannot be negative"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for better query performance
ProfileBudgetSchema.index({ profileId: 1, category: 1 }, { unique: true });
ProfileBudgetSchema.index({ groupId: 1, category: 1 });
ProfileBudgetSchema.index({ amount: -1 });

// Pre-save middleware
ProfileBudgetSchema.pre<IProfileBudget>("save", function (next) {
  this.amount = Math.round(this.amount * 100) / 100;
  this.category = this.category.trim();
  this.remaining = this.amount - this.spent;
  this.percentage =
    this.amount > 0 ? (this.spent / this.amount) * 100 : 0;
  next();
});

export default mongoose.models.ProfileBudget ||
  mongoose.model<IProfileBudget>("ProfileBudget", ProfileBudgetSchema);