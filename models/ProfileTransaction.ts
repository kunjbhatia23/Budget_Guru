import mongoose from "mongoose";
// You might have these imports, ensure they are here if your linter complains
// import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/finance-utils";
// import { VALIDATION_CONFIG } from "@/lib/constants";

export interface IProfileTransaction extends mongoose.Document {
  profileId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  amount: number;
  date: string; // Stored as YYYY-MM-DD string
  description: string;
  type: 'income' | 'expense' | 'settlement_paid' | 'settlement_received'; // <--- THIS IS THE CRITICAL LINE TO UPDATE
  category: string;
  createdAt: Date;
  updatedAt: Date;
}


const ProfileTransactionSchema = new mongoose.Schema<IProfileTransaction>(
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
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [
        0, // Assuming minAmount is 0 for simplicity, adjust if you have VALIDATION_CONFIG
        `Amount must be at least 0`,
      ],
      validate: {
        validator: function (value: number) {
          return !isNaN(value) && isFinite(value);
        },
        message: "Amount must be a valid number",
      },
    },
    date: {
      type: String, // Changed to String type for YYYY-MM-DD format consistency
      required: [true, "Date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
      validate: {
        validator: function (value: string) {
          const date = new Date(value);
          return !isNaN(date.getTime()) && date <= new Date();
        },
        message: "Date must be a valid date and cannot be in the future",
      },
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [
        1, // Assuming minDescriptionLength is 1
        `Description must be at least 1 character`,
      ],
      maxlength: [
        200, // Assuming maxDescriptionLength is 200
        `Description cannot exceed 200 characters`,
      ],
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: {
        values: ["income", "expense", "settlement_paid", "settlement_received"], // <--- ENSURE THIS LINE IS CORRECTLY UPDATED
        message: 'Type must be one of: "income", "expense", "settlement_paid", or "settlement_received"',
      },
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [
        50, // Assuming maxCategoryLength is 50
        `Category cannot exceed 50 characters`,
      ],
      minlength: [1, "Category cannot be empty"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ProfileTransactionSchema.index({ profileId: 1, type: 1, date: -1 });
ProfileTransactionSchema.index({ groupId: 1, type: 1, date: -1 });
ProfileTransactionSchema.index({ profileId: 1, category: 1, type: 1 });
ProfileTransactionSchema.index({ createdAt: -1 });

ProfileTransactionSchema.pre("save", function (next) {
  this.amount = Math.round((this.amount as number) * 100) / 100;
  this.description = this.description.trim();
  this.category = this.category.trim();
  next();
});

export default mongoose.models.ProfileTransaction ||
  mongoose.model<IProfileTransaction>("ProfileTransaction", ProfileTransactionSchema);