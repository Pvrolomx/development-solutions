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

    const fields = parseClientFields(text)
    return NextResponse.json({ text, fields })
  } catch (error) {
    console.error("OCR Error:", error)
    return NextResponse.json({ error: "OCR failed" }, { status: 500 })
  }
}

function parseClientFields(text: string) {
  const fields: Record<string, string> = {}
  
  // Limpiar texto (quitar saltos de linea extra)
  const cleanText = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ')
  
  // === NAME ===
  const nameMatch = cleanText.match(/Name:\s*([A-Za-záéíóúñÁÉÍÓÚÑ\s]+?)(?:\s*Date|\s*\*)/i) ||
                    cleanText.match(/NOMBRE[:\s]*([A-Za-záéíóúñÁÉÍÓÚÑ\s]+?)(?:\s*Fecha|\s*\*)/i)
  if (nameMatch) fields.name = nameMatch[1].trim()

  // === DATE OF BIRTH ===
  const dobMatch = cleanText.match(/Date of Birth:\s*(\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{2,4})/i) ||
                   cleanText.match(/Birth:\s*(\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{2,4})/i) ||
                   cleanText.match(/NACIMIENTO[:\s]*(\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{2,4})/i)
  if (dobMatch) fields.dob = formatDate(dobMatch[1])

  // === PLACE OF BIRTH ===
  const pobMatch = cleanText.match(/Place of Birth:\s*([^*]+?)(?:\s*Nationality|\s*\*)/i) ||
                   cleanText.match(/LUGAR[:\s]*([^*]+?)(?:\s*Nacional|\s*\*)/i)
  if (pobMatch) fields.pob = pobMatch[1].trim()

  // === NATIONALITY ===
  const natMatch = cleanText.match(/Nationality:\s*(\w+)/i) ||
                   cleanText.match(/NACIONALIDAD[:\s]*(\w+)/i)
  if (natMatch) {
    const nat = natMatch[1].toUpperCase()
    if (nat === 'USA' || nat === 'AMERICAN' || nat === 'US') fields.nationality = 'EUA'
    else if (nat.includes('MEX')) fields.nationality = 'México'
    else if (nat.includes('CANAD')) fields.nationality = 'Canadá'
  }

  // === PASSPORT (numero + fechas) ===
  const passMatch = cleanText.match(/Passport:\s*(\d+)/i) ||
                    cleanText.match(/PASAPORTE[:\s]*(\d+)/i)
  if (passMatch) fields.passport = passMatch[1]
  
  // Fecha vencimiento pasaporte (segundo par de fechas despues del numero)
  const passDateMatch = cleanText.match(/Passport:\s*\d+\s*\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{2,4}\s*(\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{2,4})/i)
  if (passDateMatch) fields.passportVenc = formatDate(passDateMatch[1])

  // === MARITAL STATUS ===
  const marMatch = cleanText.match(/Marital Status:\s*(\w+)/i) ||
                   cleanText.match(/Estado Civil[:\s]*(\w+)/i)
  if (marMatch) {
    const status = marMatch[1].toLowerCase()
    if (status === 'married' || status === 'casado') fields.marital = 'Casado/a'
    else if (status === 'single' || status === 'soltero') fields.marital = 'Soltero/a'
    else if (status === 'divorced' || status === 'divorciado') fields.marital = 'Divorciado/a'
    else if (status === 'widowed' || status === 'viudo') fields.marital = 'Viudo/a'
  }

  // === ADDRESS IN MEXICO ===
  const addrMxMatch = cleanText.match(/Address in Mexico:\s*(.+?)(?:\s*Address Abroad|\s*Occupation|\s*\*)/i) ||
                      cleanText.match(/Direccion en Mexico[:\s]*(.+?)(?:\s*Direccion|\s*Ocupacion|\s*\*)/i)
  if (addrMxMatch) fields.addressMx = addrMxMatch[1].trim()

  // === ADDRESS ABROAD ===
  const addrAbMatch = cleanText.match(/Address Abroad:\s*(.+?)(?:\s*Occupation|\s*\*)/i) ||
                      cleanText.match(/Direccion.{0,20}Extranjero[:\s]*(.+?)(?:\s*Ocupacion|\s*\*)/i)
  if (addrAbMatch) fields.addressAbroad = addrAbMatch[1].trim()

  // === OCCUPATION ===
  const occMatch = cleanText.match(/Occupation:\s*(\w+)/i) ||
                   cleanText.match(/OCUPACION[:\s]*(\w+)/i)
  if (occMatch && occMatch[1].toUpperCase() !== 'N' && occMatch[1].toUpperCase() !== 'NA') {
    fields.occupation = occMatch[1]
  }

  // === COMPANY ===
  const compMatch = cleanText.match(/Name of the Company:\s*([^*]+?)(?:\s*Type|\s*Telephone|\s*\*)/i) ||
                    cleanText.match(/EMPRESA[:\s]*([^*]+?)(?:\s*Tipo|\s*\*)/i)
  if (compMatch && !compMatch[1].match(/^N\/?A$/i)) fields.company = compMatch[1].trim()

  // === CURP ===
  const curpMatch = cleanText.match(/CURP:\s*([A-Z0-9]{18})/i) ||
                    cleanText.match(/([A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2})/i)
  if (curpMatch && !curpMatch[1].match(/^N\/?A$/i)) fields.curp = curpMatch[1].toUpperCase()

  // === RFC ===
  const rfcMatch = cleanText.match(/RFC[^:]*:\s*([A-Z0-9]{10,13})/i) ||
                   cleanText.match(/Tax ID[^:]*:\s*([A-Z0-9]{10,13})/i)
  if (rfcMatch && !rfcMatch[1].match(/^N\/?A$/i)) fields.rfc = rfcMatch[1].toUpperCase()

  // === EMAIL ===
  const emailMatch = cleanText.match(/Email:\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i) ||
                     cleanText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
  if (emailMatch) fields.email = emailMatch[1].toLowerCase()

  // === PHONE ===
  const phoneMatch = cleanText.match(/Cell Phone:\s*([+\d\s\-()]+?)(?:\s*SS|\s*\*|$)/i) ||
                     cleanText.match(/Phone:\s*([+\d\s\-()]+?)(?:\s*SS|\s*\*|$)/i) ||
                     cleanText.match(/TEL[EFONO]*[:\s]*([+\d\s\-()]+?)(?:\s*SS|\s*\*|$)/i)
  if (phoneMatch) fields.phone = phoneMatch[1].replace(/[\s\-()]/g, '').trim()

  return fields
}

function formatDate(dateStr: string): string {
  const clean = dateStr.replace(/\s/g, "")
  const parts = clean.split("/")
  if (parts.length === 3) {
    let [d, m, y] = parts
    // Si el año tiene 4 digitos pero con espacios (ej: "19 42" -> "1942")
    if (y.length === 2) {
      y = parseInt(y) > 50 ? "19" + y : "20" + y
    }
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }
  return ""
}
