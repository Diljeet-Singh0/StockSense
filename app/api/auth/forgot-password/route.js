import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOTP } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether email exists
      return NextResponse.json({ message: 'If that email is registered, an OTP has been sent.' });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { email },
      data: { otpCode: otp, otpExpiresAt },
    });

    // ponytail: SMTP send skipped if env vars missing — log OTP to console for dev
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'StockSense – Password Reset OTP',
        text: `Your OTP is: ${otp}\n\nThis code expires in 10 minutes.`,
        html: `<p>Your OTP is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
      });
    } else {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }

    return NextResponse.json({ message: 'If that email is registered, an OTP has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
