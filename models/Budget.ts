import mongoose, { Document, Schema } from "mongoose";
import { VALIDATION_CONFIG } from "@/lib/constants";

// 1. Define the interface for type checking
interface IBudget extends Document {
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
}

// 2. Define the schema with type parameters
const BudgetSchema = new Schema<IBudget>(
  {
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      unique: true,
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

// 3. Indexes for better query performance
BudgetSchema.index({ category: 1 });
BudgetSchema.index({ amount: -1 });

// 4. Pre-save middleware with proper typing
BudgetSchema.pre<IBudget>("save", function (next) {
  this.amount = Math.round(this.amount * 100) / 100;
  this.category = this.category.trim();
  this.remaining = this.amount - this.spent;
  this.percentage =
    this.amount > 0 ? (this.spent / this.amount) * 100 : 0;
  next();
});

// 5. Export model safely (Next.js/Mongoose hot-reload safe)
export default mongoose.models.Budget ||
  mongoose.model<IBudget>("Budget", BudgetSchema);