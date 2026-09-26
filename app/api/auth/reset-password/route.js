import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Email, OTP, and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.otpCode !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { email },
      data: { passwordHash, otpCode: null, otpExpiresAt: null },
    });

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
