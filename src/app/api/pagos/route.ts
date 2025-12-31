import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const pagos = await prisma.pago.findMany({ orderBy: { fechaProgramada: 'asc' } });
  return NextResponse.json(pagos);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const pago = await prisma.pago.create({ data });
  return NextResponse.json(pago);
}
