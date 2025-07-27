import mongoose, { Document, Schema } from 'mongoose';

export interface IAsset extends Document {
  profileId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  name: string;
  type: 'Vehicle' | 'Property' | 'Electronics' | 'Investment' | 'Other';
  initialValue: number;
  currentValue: number;
  purchaseDate: Date;
  depreciationRate: number; // Annual percentage
  lastDepreciationDate?: Date;
}

const AssetSchema: Schema = new Schema({
  profileId: {
    type: Schema.Types.ObjectId,
    ref: 'UserProfile',
    required: true,
    index: true,
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'UserGroup',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  type: {
    type: String,
    required: true,
    enum: ['Vehicle', 'Property', 'Electronics', 'Investment', 'Other'],
  },
  initialValue: {
    type: Number,
    required: true,
    min: 0,
  },
  currentValue: {
    type: Number,
    required: true,
    min: 0,
  },
  purchaseDate: {
    type: Date,
    required: true,
  },
  depreciationRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  lastDepreciationDate: {
    type: Date,
  },
}, {
  timestamps: true
});

AssetSchema.pre('save', function(next) {
  if (this.isNew) {
    this.currentValue = this.initialValue;
  }
  next();
});

export default mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);