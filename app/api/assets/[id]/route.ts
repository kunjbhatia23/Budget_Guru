// kunjbhatia23/budget_guru/Budget_Guru-5fc8173f4eb07b451f8a37faf6a16fae98c2b211/app/api/assets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Asset from '@/models/Asset';
import { differenceInYears } from 'date-fns';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const body = await req.json();

    const assetToUpdate = await Asset.findById(params.id);
    if (!assetToUpdate) {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }

    // Apply updates from the request body
    assetToUpdate.set(body);

    // --- FIX: Recalculate depreciation from scratch on any update ---
    let newCurrentValue = assetToUpdate.initialValue;
    const today = new Date();
    const yearsPassed = differenceInYears(today, assetToUpdate.purchaseDate);

    if (assetToUpdate.depreciationRate > 0 && yearsPassed > 0) {
      for (let i = 0; i < yearsPassed; i++) {
        newCurrentValue *= (1 - assetToUpdate.depreciationRate / 100);
      }
    }
    
    assetToUpdate.currentValue = Math.max(0, newCurrentValue);
    // Align last depreciation date with the current calculation
    assetToUpdate.lastDepreciationDate = today; 

    const updatedAsset = await assetToUpdate.save();
    
    return NextResponse.json(updatedAsset, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const deletedAsset = await Asset.findByIdAndDelete(params.id);
    if (!deletedAsset) {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }
    // You might also want to unlink this asset from any transactions
    // await ProfileTransaction.updateMany({ assetId: params.id }, { $unset: { assetId: "" } });
    return NextResponse.json({ message: 'Asset deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}