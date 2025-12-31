import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const contactos = await prisma.contacto.findMany({
    orderBy: { nombre: 'asc' }
  });
  return NextResponse.json(contactos);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const contacto = await prisma.contacto.create({
    data: {
      nombre: data.nombre,
      telefono: data.telefono,
      email: data.email || null,
      etiquetas: data.etiquetas || '[]',
      nivel: data.nivel || 3,
      ubicacion: data.ubicacion || null,
      comoNosConocimos: data.comoNosConocimos || null,
      notas: data.notas || null,
      confidencial: data.confidencial || false,
      userId: 'default-user',
    }
  });
  return NextResponse.json(contacto);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  await prisma.contacto.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
