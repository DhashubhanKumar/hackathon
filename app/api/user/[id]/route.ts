import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: params.id },
            select: {
                id: true,
                name: true,
                email: true,
                city: true,
                interests: true,
                role: true,
                bookings: {
                    include: {
                        event: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                feedbacks: true
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    } catch (error: any) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch user' },
            { status: 500 }
        );
    }
}
