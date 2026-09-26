import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    const existing = await prisma.internalTransfer.findUnique({ where: { id } });

    if (!existing) return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    if (existing.status === 'DONE') {
      return NextResponse.json({ error: 'A completed transfer cannot be canceled' }, { status: 400 });
    }
    if (status !== 'CANCELED') {
      return NextResponse.json({ error: 'Only cancellation is supported here' }, { status: 400 });
    }

    const transfer = await prisma.internalTransfer.update({
      where: { id },
      data: { status: 'CANCELED' },
    });
    return NextResponse.json({ transfer, message: 'Transfer canceled before stock moved.' });
  } catch (error) {
    console.error('Transfer cancel error:', error);
    return NextResponse.json({ error: 'Failed to cancel transfer' }, { status: 500 });
  }
}
