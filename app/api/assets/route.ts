import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Asset from '@/models/Asset';
import { differenceInYears } from 'date-fns'; // Used for accurate year calculation

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const newAsset = new Asset(body);
    await newAsset.save();
    return NextResponse.json(newAsset, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get('groupId');
  const profileId = searchParams.get('profileId');
  const viewType = searchParams.get('viewType');

  if (!groupId) {
    return NextResponse.json({ message: 'Group ID is required' }, { status: 400 });
  }

  try {
    await dbConnect();
    const query = viewType === 'group' ? { groupId } : { profileId, groupId };
    
    // Fetch mongoose documents, not lean objects, so we can save them
    const assets = await Asset.find(query);

    const today = new Date();

    // --- FIX: DEPRECIATION LOGIC ---
    // Calculate and apply depreciation for each asset before returning
    const updatePromises = assets.map(asset => {
      if (asset.depreciationRate > 0) {
        const lastDate = asset.lastDepreciationDate || asset.purchaseDate;
        const yearsToDepreciate = differenceInYears(today, lastDate);

        if (yearsToDepreciate > 0) {
          let depreciatedValue = asset.currentValue;
          // Apply depreciation for each year that has passed
          for (let i = 0; i < yearsToDepreciate; i++) {
            depreciatedValue *= (1 - asset.depreciationRate / 100);
          }
          
          // Update the asset's values
          asset.currentValue = Math.max(0, depreciatedValue); // Ensure value doesn't go below zero
          asset.lastDepreciationDate = today;
          return asset.save(); // Save the updated asset back to the database
        }
      }
      // If no depreciation is needed, return the asset as is
      return Promise.resolve(asset);
    });
    
    // Wait for all updates to complete
    const updatedAssets = await Promise.all(updatePromises);

    return NextResponse.json(updatedAssets, { status: 200 });
    
  } catch (error: any) {
    console.error("Error fetching or depreciating assets:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}