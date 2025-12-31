import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const eventos = await prisma.evento.findMany({
    orderBy: { fecha: 'asc' }
  });
  return NextResponse.json(eventos);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const evento = await prisma.evento.create({
    data: {
      titulo: data.titulo,
      fecha: new Date(data.fecha),
      ubicacion: data.ubicacion || null,
      notas: data.notas || null,
      userId: 'default-user',
    }
  });
  return NextResponse.json(evento);
}
