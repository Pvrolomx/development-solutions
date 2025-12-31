import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const unidades = await prisma.unidad.findMany({ orderBy: { planta: 'asc' } });
  return NextResponse.json(unidades);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const unidad = await prisma.unidad.create({ data });
  return NextResponse.json(unidad);
}
