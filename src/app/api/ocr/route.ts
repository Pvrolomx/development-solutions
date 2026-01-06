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

    // Parse fields from OCR text
    const fields = parseClientFields(text)

    return NextResponse.json({ text, fields })
  } catch (error) {
    console.error("OCR Error:", error)
    return NextResponse.json({ error: "OCR failed" }, { status: 500 })
  }
}

function parseClientFields(text: string) {
  const fields: Record<string, string> = {}
  
  // Name
  const nameMatch = text.match(/Name:\s*(.+?)(?:\n|Date)/i)
  if (nameMatch) fields.name = nameMatch[1].trim()

  // DOB
  const dobMatch = text.match(/Date of Birth:\s*(\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{2,4})/i)
  if (dobMatch) fields.dob = formatDate(dobMatch[1])

  // Place of Birth
  const pobMatch = text.match(/Place of Birth:\s*(.+?)(?:\n|Nationality)/i)
  if (pobMatch) fields.pob = pobMatch[1].trim()

  // Nationality
  const natMatch = text.match(/Nationality:\s*(\w+)/i)
  if (natMatch) fields.nationality = natMatch[1].trim()

  // Passport
  const passMatch = text.match(/Passport:\s*(\w+)/i)
  if (passMatch) fields.passport = passMatch[1].trim()

  // Immigration Status
  const immMatch = text.match(/Immigration Status:\s*(\w+)/i)
  if (immMatch) fields.immigration = immMatch[1].trim()

  // Marital Status
  const marMatch = text.match(/Marital Status:\s*(\w+)/i)
  if (marMatch) fields.marital = marMatch[1].trim()

  // Address in Mexico
  const addrMxMatch = text.match(/Address in Mexico:\s*(.+?)(?:\n|Address Abroad)/i)
  if (addrMxMatch) fields.addressMx = addrMxMatch[1].trim()

  // Address Abroad
  const addrAbMatch = text.match(/Address Abroad:\s*(.+?)(?:\n|Occupation)/i)
  if (addrAbMatch) fields.addressAbroad = addrAbMatch[1].trim()

  // Occupation
  const occMatch = text.match(/Occupation:\s*(.+?)(?:\n|Name of)/i)
  if (occMatch) fields.occupation = occMatch[1].trim()

  // Email
  const emailMatch = text.match(/Email:\s*(\S+@\S+)/i)
  if (emailMatch) fields.email = emailMatch[1].trim()

  // Phone
  const phoneMatch = text.match(/Cell Phone:\s*(.+?)(?:\n|SS)/i)
  if (phoneMatch) fields.phone = phoneMatch[1].trim()

  // SS#
  const ssMatch = text.match(/SS.*?#.*?:\s*(\d[\d\s]+)/i)
  if (ssMatch) fields.ssn = ssMatch[1].replace(/\s/g, "")

  // CURP
  const curpMatch = text.match(/CURP:\s*(\w+)/i)
  if (curpMatch && curpMatch[1] !== "N") fields.curp = curpMatch[1].trim()

  // RFC
  const rfcMatch = text.match(/RFC.*?:\s*(\w+)/i)
  if (rfcMatch && rfcMatch[1] !== "N") fields.rfc = rfcMatch[1].trim()

  return fields
}

function formatDate(dateStr: string): string {
  const parts = dateStr.replace(/\s/g, "").split("/")
  if (parts.length === 3) {
    let year = parts[2]
    if (year.length === 2) {
      year = parseInt(year) > 50 ? "19" + year : "20" + year
    }
    return `${year}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`
  }
  return ""
}
