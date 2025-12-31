import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const inversionistas = await prisma.inversionista.findMany({ orderBy: { montoInvertido: 'desc' } });
  return NextResponse.json(inversionistas);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const inversionista = await prisma.inversionista.create({ data });
  return NextResponse.json(inversionista);
}
