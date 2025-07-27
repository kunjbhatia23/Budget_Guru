import mongoose from "mongoose";

export interface IProfileTransaction extends mongoose.Document {
  profileId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  assetId?: mongoose.Types.ObjectId; // ADDED: Optional link to an Asset
  amount: number;
  date: string;
  description: string;
  type: 'income' | 'expense' | 'settlement_paid' | 'settlement_received';
  category: string;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringDayOfMonth?: number;
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
    assetId: { // ADDED
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset', // This should match the model name you use for assets
      index: true,
      default: null,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, `Amount must be at least 0`],
    },
    date: {
      type: String,
      required: [true, "Date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [1, `Description must be at least 1 character`],
      maxlength: [200, `Description cannot exceed 200 characters`],
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: {
        values: ["income", "expense", "settlement_paid", "settlement_received"],
        message: 'Type must be one of: "income", "expense", "settlement_paid", or "settlement_received"',
      },
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [50, `Category cannot exceed 50 characters`],
    },
    isRecurring: {
        type: Boolean,
        default: false,
    },
    recurringFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    recurringDayOfMonth: {
        type: Number,
        min: 1,
        max: 32, // Allow 32 to represent "Last Day of Month"
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ProfileTransactionSchema.index({ isRecurring: 1, groupId: 1 });

ProfileTransactionSchema.pre("save", function (next) {
  this.amount = Math.round((this.amount as number) * 100) / 100;
  this.description = this.description.trim();
  this.category = this.category.trim();
  next();
});

export default mongoose.models.ProfileTransaction ||
  mongoose.model<IProfileTransaction>("ProfileTransaction", ProfileTransactionSchema);