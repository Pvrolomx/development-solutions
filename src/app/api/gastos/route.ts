import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const gastos = await prisma.gasto.findMany({ orderBy: { fecha: 'desc' } });
  return NextResponse.json(gastos);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const gasto = await prisma.gasto.create({ data });
  return NextResponse.json(gasto);
}
