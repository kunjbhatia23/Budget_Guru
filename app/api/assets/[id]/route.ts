import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Asset from '@/models/Asset';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const body = await req.json();
    const updatedAsset = await Asset.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    if (!updatedAsset) {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }
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