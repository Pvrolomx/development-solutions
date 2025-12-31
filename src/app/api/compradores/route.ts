import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const compradores = await prisma.comprador.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(compradores);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const comprador = await prisma.comprador.create({ data });
  return NextResponse.json(comprador);
}
