import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [{
            image: { content: base64 },
            features: [{ type: "TEXT_DETECTION" }]
          }]
        })
      }
    )

    const data = await response.json()
    const text = data.responses?.[0]?.fullTextAnnotation?.text || ""

    // Parse fields from OCR text (Spanish + English)
    const fields = parseClientFields(text)

    return NextResponse.json({ text, fields })
  } catch (error) {
    console.error("OCR Error:", error)
    return NextResponse.json({ error: "OCR failed" }, { status: 500 })
  }
}

function parseClientFields(text: string) {
  const fields: Record<string, string> = {}
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)
  
  // === NOMBRE ===
  // INE: buscar nombre completo (apellidos + nombre)
  const nombreMatch = text.match(/NOMBRE\s*[:\n]?\s*([A-ZÁÉÍÓÚÑ\s]+)/i) ||
                      text.match(/Name[:\s]+(.+?)(?:\n|Date)/i)
  if (nombreMatch) fields.name = nombreMatch[1].trim()

  // === FECHA NACIMIENTO ===
  const dobMatch = text.match(/FECHA\s*DE\s*NACIMIENTO[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i) ||
                   text.match(/NACIMIENTO[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i) ||
                   text.match(/Date of Birth[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i) ||
                   text.match(/(\d{2}[\/-]\d{2}[\/-]\d{4})/)
  if (dobMatch) fields.dob = formatDate(dobMatch[1])

  // === CURP (18 caracteres alfanumericos) ===
  const curpMatch = text.match(/CURP[:\s]*([A-Z]{4}\d{6}[A-Z]{6}\d{2})/i) ||
                    text.match(/([A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2})/i)
  if (curpMatch) fields.curp = curpMatch[1].toUpperCase()

  // === CLAVE DE ELECTOR (INE) ===
  const ineMatch = text.match(/CLAVE\s*DE\s*ELECTOR[:\s]*([A-Z]{6}\d{8}[A-Z]\d{3})/i) ||
                   text.match(/ELECTOR[:\s]*([A-Z0-9]{18})/i) ||
                   text.match(/([A-Z]{6}\d{8}[A-Z]\d{3})/i)
  if (ineMatch) fields.ine = ineMatch[1].toUpperCase()

  // === DOMICILIO / DIRECCION ===
  const domMatch = text.match(/DOMICILIO[:\s]*(.+?)(?:SECCI[OÓ]N|LOCALIDAD|$)/is) ||
                   text.match(/CALLE[:\s]*(.+?)(?:COLONIA|CP|$)/is) ||
                   text.match(/Address[:\s]*(.+?)(?:\n|$)/i)
  if (domMatch) fields.addressMx = domMatch[1].replace(/\n/g, ', ').trim()

  // === SECCION ELECTORAL ===
  const seccionMatch = text.match(/SECCI[OÓ]N[:\s]*(\d+)/i)
  
  // === ESTADO ===
  const estadoMatch = text.match(/ESTADO[:\s]*([A-ZÁÉÍÓÚÑ\s]+?)(?:\n|MUNICIPIO|$)/i)

  // === RFC ===
  const rfcMatch = text.match(/RFC[:\s]*([A-Z]{3,4}\d{6}[A-Z\d]{3})/i)
  if (rfcMatch) fields.rfc = rfcMatch[1].toUpperCase()

  // === NACIONALIDAD ===
  const natMatch = text.match(/NACIONALIDAD[:\s]*(\w+)/i) ||
                   text.match(/Nationality[:\s]*(\w+)/i)
  if (natMatch) {
    const nat = natMatch[1].toLowerCase()
    if (nat.includes('mex')) fields.nationality = 'México'
    else if (nat.includes('usa') || nat.includes('american')) fields.nationality = 'EUA'
    else if (nat.includes('canad')) fields.nationality = 'Canadá'
  }

  // === SEXO (para inferir datos) ===
  const sexoMatch = text.match(/SEXO[:\s]*(H|M|HOMBRE|MUJER)/i)

  // === PASAPORTE ===
  const passMatch = text.match(/PASAPORTE[:\s]*([A-Z0-9]+)/i) ||
                    text.match(/Passport[:\s]*([A-Z0-9]+)/i)
  if (passMatch) fields.passport = passMatch[1]

  // === EMAIL ===
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
  if (emailMatch) fields.email = emailMatch[1].toLowerCase()

  // === TELEFONO ===
  const phoneMatch = text.match(/TEL[EÉFONO]*[:\s]*(\+?[\d\s\-()]{10,})/i) ||
                     text.match(/CEL[ULAR]*[:\s]*(\+?[\d\s\-()]{10,})/i) ||
                     text.match(/(\+?52[\s\-]?\d{10})/i) ||
                     text.match(/(\d{3}[\s\-]?\d{3}[\s\-]?\d{4})/i)
  if (phoneMatch) fields.phone = phoneMatch[1].replace(/[\s\-()]/g, '')

  return fields
}

function formatDate(dateStr: string): string {
  const clean = dateStr.replace(/\s/g, "")
  const parts = clean.split(/[\/\-]/)
  if (parts.length === 3) {
    let [d, m, y] = parts
    if (y.length === 2) {
      y = parseInt(y) > 50 ? "19" + y : "20" + y
    }
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }
  return ""
}
