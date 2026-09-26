import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Access restricted: This portal is for warehouse staff and managers only. Please log in through the customer store.' }, { status: 403 });
    }

    const token = await signToken({ id: user.id, email: user.email, name: user.name, role: user.role });

    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
