import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, name, city, interests, email } = body; // email is read-only usually, but we need userId

        if (!userId && !email) {
            return NextResponse.json(
                { error: 'User ID or Email is required' },
                { status: 400 }
            );
        }

        // Find user by ID or Email
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: userId },
                    { email: email }
                ]
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name,
                city,
                interests: interests, // Prisma supports string[] for Postgres
            },
        });

        return NextResponse.json({
            success: true,
            user: updatedUser,
        });

    } catch (error: any) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update profile' },
            { status: 500 }
        );
    }
}
