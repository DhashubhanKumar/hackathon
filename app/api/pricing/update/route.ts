import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pricing/update
 * Update event price manually or toggle pricing mode
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventId, newPrice, pricingMode, minPrice, maxPrice, reason } = body;

        if (!eventId) {
            return NextResponse.json(
                { error: 'eventId is required' },
                { status: 400 }
            );
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        // Build update data
        const updateData: any = {
            lastPriceUpdate: new Date(),
        };

        // Update price if provided
        if (newPrice !== undefined) {
            updateData.basePrice = newPrice;
            updateData.priceUpdateReason = reason || 'Manual price update';

            // Log price change
            await prisma.pricingLog.create({
                data: {
                    eventId,
                    oldPrice: event.basePrice,
                    newPrice,
                    reason: updateData.priceUpdateReason,
                },
            });
        }

        // Update pricing mode if provided
        if (pricingMode) {
            updateData.pricingMode = pricingMode;
            updateData.autoPricingEnabled = pricingMode === 'AUTOMATIC';
        }

        // Update price range if provided
        if (minPrice !== undefined) {
            updateData.minPrice = minPrice;
        }
        if (maxPrice !== undefined) {
            updateData.maxPrice = maxPrice;
        }

        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            event: {
                id: updatedEvent.id,
                basePrice: updatedEvent.basePrice,
                pricingMode: updatedEvent.pricingMode,
                autoPricingEnabled: updatedEvent.autoPricingEnabled,
                lastPriceUpdate: updatedEvent.lastPriceUpdate,
            },
        });
    } catch (error: any) {
        console.error('Error updating price:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update price' },
            { status: 500 }
        );
    }
}
