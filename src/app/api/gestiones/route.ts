import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const gestiones = await prisma.gestion.findMany({
    include: { contacto: true },
    orderBy: { fecha: 'desc' }
  });
  return NextResponse.json(gestiones);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const gestion = await prisma.gestion.create({
    data: {
      contactoId: data.contactoId,
      tipo: data.tipo,
      descripcion: data.descripcion,
      notas: data.notas || null,
      estado: 'abierto',
      userId: 'default-user',
    }
  });
  return NextResponse.json(gestion);
}
