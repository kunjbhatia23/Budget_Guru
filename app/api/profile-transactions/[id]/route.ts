import {
    NextRequest,
    NextResponse
} from 'next/server';
import dbConnect from '@/lib/db';
import ProfileTransaction from '@/models/ProfileTransaction';

export async function PUT(req: NextRequest, {
    params
}: {
    params: {
        id: string
    }
}) {
    try {
        await dbConnect();
        const body = await req.json();
        const {
            id,
            _id,
            assetId,
            ...updateData
        } = body;

        const updateOps: any = {
            $set: updateData
        };

        // This block prevents the database conflict.
        if (assetId && assetId !== 'none') {
            updateOps.$set.assetId = assetId;
        } else {
            updateOps.$unset = {
                assetId: ""
            };
        }

        const updatedTransaction = await ProfileTransaction.findByIdAndUpdate(
            params.id,
            updateOps, {
                new: true,
                runValidators: true
            }
        ).lean();

        if (!updatedTransaction) {
            return NextResponse.json({
                message: 'Transaction not found'
            }, {
                status: 404
            });
        }

        return NextResponse.json(updatedTransaction, {
            status: 200
        });

    } catch (error: any) {
        console.error('Error updating profile transaction:', error);
        const status = error.name === 'ValidationError' ? 400 : 500;
        return NextResponse.json({
            message: error.message,
            error: error
        }, {
            status
        });
    }
}

export async function DELETE(req: NextRequest, {
    params
}: {
    params: {
        id: string
    }
}) {
    try {
        await dbConnect();

        const deletedTransaction = await ProfileTransaction.findByIdAndDelete(params.id);

        if (!deletedTransaction) {
            return NextResponse.json({
                message: 'Transaction not found'
            }, {
                status: 404
            });
        }

        return NextResponse.json({
            message: 'Transaction deleted successfully'
        }, {
            status: 200
        });

    } catch (error: any) {
        console.error('Error deleting profile transaction:', error);
        return NextResponse.json({
            message: 'Server error',
            error: error.message
        }, {
            status: 500
        });
    }
}