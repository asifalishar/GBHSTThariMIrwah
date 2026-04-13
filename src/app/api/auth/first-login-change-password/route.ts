import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export async function POST(request: Request) {
  try {
    const { username, oldPassword, newPassword } = await request.json();

    if (!username || !oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Username, old password, and new password are required' }, { status: 400 });
    }

    // Validate new password format
    const parsedNewPassword = passwordSchema.safeParse(newPassword);
    if (!parsedNewPassword.success) {
      return NextResponse.json(
        { error: parsedNewPassword.error.issues.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the user requires a password change (for this specific flow)
    if (!user.requiresPasswordChange) {
      return NextResponse.json({ error: 'Password change is not required for this user' }, { status: 403 });
    }

    // Verify the old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid old password' }, { status: 401 });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        requiresPasswordChange: false,
      },
    });

    // Update session cookie — clear requiresPasswordChange flag
    const sessionPayload = Buffer.from(
      JSON.stringify({ id: user.id, username: user.username, role: user.role, requiresPasswordChange: false })
    ).toString('base64');

    const response = NextResponse.json({ success: true, message: 'Password updated successfully.' }, { status: 200 });
    response.cookies.set('session', sessionPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
