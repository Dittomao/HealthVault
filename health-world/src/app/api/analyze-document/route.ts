import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const MODELS_TO_TRY = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest",
];

const MAX_RETRIES = 2;

function getPrescriptionPrompt(): string {
  return `You are an expert Indian pharmacist and medical AI assistant who specializes in reading doctor handwriting on prescriptions.

Analyze this uploaded prescription image.

1. Read the handwriting extremely carefully. Doctors often use abbreviations:
   - "Tab" = Tablet, "Cap" = Capsule, "Syp" = Syrup, "Inj" = Injection, "Oint" = Ointment
   - "BD" = twice daily, "TDS" = thrice daily, "OD" = once daily, "SOS" = as needed
2. For each medicine, match the handwritten name to a REAL Indian pharmaceutical brand. Common examples:
   - Augmentin, Amoxyclav, Azithral, Azee
   - Dolo 650, Crocin, Calpol
   - Pan 40, Pantop, Rantac
   - Montair LC, Montek LC, Levocetirizine
   - Shelcal, Supradyn, Becosules
   - Grilinctus, Benadryl, Ascoril
   - Combiflam, Flexon, Voveran
   - Metformin, Glycomet, Amaryl
3. Provide a 3-bullet summary of the diagnosis/instructions.
4. For EVERY medicine found, generate purchase URLs:
   - tata1mg: "https://www.1mg.com/search/all?name=" followed by the URL-encoded medicine name
   - apollo: "https://www.apollopharmacy.in/search-medicines/" followed by the URL-encoded medicine name

Respond with ONLY a raw JSON object (no markdown, no backticks, no explanation):
{"type":"prescription","summary":"- bullet 1\\n- bullet 2\\n- bullet 3","items":[{"name":"Medicine Name","tata1mg":"https://www.1mg.com/search/all?name=Medicine%20Name","apollo":"https://www.apollopharmacy.in/search-medicines/Medicine%20Name"}]}`;
}

function getBillPrompt(): string {
  return `You are an expert Indian healthcare cost analyst and patient advocate. You specialize in analyzing hospital bills, identifying overcharges, finding cost-cutting opportunities, and advising patients on follow-up care.

Analyze this uploaded hospital/medical bill image thoroughly.

Perform ALL of the following:

1. **Cost Breakdown**: Identify every line item and its cost. Calculate the total.

2. **Overcharges & Junk Fees**: Flag any charges that appear:
   - Inflated beyond standard Indian hospital rates (e.g., disposable gloves charged at ₹500, or simple saline at ₹1000)
   - Duplicated (same service billed twice)
   - Unnecessary (charges for services not typically required for the stated diagnosis)
   - Hidden fees (administrative fees, documentation charges, "facility charges")

3. **Cost-Cutting Suggestions**: For each flagged charge, suggest:
   - What a fair price would be
   - Whether the patient can dispute this charge
   - Alternative options (e.g., buying medicines from outside pharmacy vs hospital pharmacy)

4. **Follow-Up Recommendation**: Based on the diagnosis/treatment mentioned in the bill:
   - Recommend when the patient should schedule a follow-up appointment
   - Suggest what type of doctor to see (GP, specialist, etc.)
   - Any preventive care advice

5. **Summary**: Provide a concise 3-bullet overview of the bill.

Respond with ONLY a raw JSON object (no markdown, no backticks). Use this exact structure:
{
  "type": "bill",
  "summary": "- Total bill: ₹X for Y treatment at Z hospital\\n- X items flagged as potential overcharges totaling ₹Y\\n- Follow-up recommended in X weeks",
  "totalAmount": "₹12,500",
  "flaggedCharges": [
    {
      "item": "Name of the charge",
      "billedAmount": "₹500",
      "fairPrice": "₹100",
      "reason": "Why this is flagged (e.g., inflated, unnecessary, duplicate)",
      "canDispute": true
    }
  ],
  "costSavingTips": [
    "Buy prescribed medicines from an outside pharmacy like 1mg or Apollo — hospital pharmacies mark up by 30-60%",
    "Request itemized bill and challenge any 'miscellaneous' or 'documentation' fees"
  ],
  "followUp": {
    "recommendedDate": "2 weeks from discharge",
    "doctorType": "General Physician or relevant specialist",
    "notes": "Brief advice on what to monitor and when to seek immediate care"
  },
  "items": ["charge 1 description", "charge 2 description"]
}`;
}

function getJargonPrompt(): string {
  return `You are a helpful, senior-citizen-friendly medical assistant.
Your job is to translate confusing medical jargon, lab reports, insurance letters, or any health document into extremely simple, plain English that a grandparent would easily understand.

Analyze this uploaded document. Provide:
1. "What is this?" - One plain-English sentence.
2. "Do I owe money?" - Yes/No, plus amount if applicable.
3. "Deadlines?" - Extract any important dates (e.g., expiry, appointment). If none, say "None".
4. A 3-bullet summary in very simple words.

Respond with ONLY a raw JSON object (no markdown, no backticks).
{
  "type": "jargon",
  "whatIsThis": "This is a blood test report checking your cholesterol.",
  "oweMoney": "No",
  "deadline": "None",
  "summary": "- Your cholesterol is slightly high.\\n- The doctor might ask you to eat less fried food.\\n- Everything else looks normal."
}`;
}

function getReportPrompt(): string {
  return `You are an expert Indian doctor and medical AI assistant.
Your job is to analyze a health report (e.g., blood test, MRI, discharge summary) and recommend the next steps.

Analyze this uploaded report. Provide:
1. "summary" - A concise 3-bullet overview of the report's key findings.
2. "recommendedActions" - 2-3 simple, actionable steps the patient should take based on the report.
3. "appointments" - Recommend what type of doctor they should see and in what timeframe.

Respond with ONLY a raw JSON object (no markdown, no backticks). Use this exact structure:
{
  "type": "report",
  "summary": "- Finding 1\\n- Finding 2\\n- Finding 3",
  "recommendedActions": ["Drink more water", "Reduce salt intake"],
  "appointments": [
    {
      "doctorType": "Cardiologist",
      "timeframe": "Within 1 week",
      "reason": "To discuss high blood pressure findings"
    }
  ]
}`;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is missing. Add GEMINI_API_KEY to your .env.local file." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const { base64Image, mimeType, mode } = await req.json();

    if (!base64Image) {
      return NextResponse.json({ error: "No image data provided." }, { status: 400 });
    }

    const resolvedMimeType = mimeType || "image/png";
    let prompt;
    if (mode === 'bill') {
      prompt = getBillPrompt();
    } else if (mode === 'jargon') {
      prompt = getJargonPrompt();
    } else if (mode === 'report') {
      prompt = getReportPrompt();
    } else {
      prompt = getPrescriptionPrompt();
    }

    const imageParts = [
      { inlineData: { data: base64Image, mimeType: resolvedMimeType } }
    ];

    let lastError: any = null;

    for (const modelName of MODELS_TO_TRY) {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`[HealthVault] Mode: ${mode || 'prescription'}, Model: ${modelName}, Attempt: ${attempt + 1}`);

          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([prompt, ...imageParts]);
          const response = result.response;
          const text = response.text();

          console.log(`[HealthVault] Raw Gemini response (first 500 chars):`, text.substring(0, 500));

          let jsonText = text.trim();
          jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
          jsonText = jsonText.trim();

          const firstBrace = jsonText.indexOf('{');
          const lastBrace = jsonText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonText = jsonText.substring(firstBrace, lastBrace + 1);
          }

          const data = JSON.parse(jsonText);

          if (!data.type || !data.summary) {
            throw new Error("AI returned malformed data: missing type or summary.");
          }

          console.log(`[HealthVault] Successfully parsed. Type: ${data.type}`);
          return NextResponse.json(data);

        } catch (err: any) {
          lastError = err;
          const msg = err.message || '';

          if (msg.includes('404')) {
            console.warn(`[HealthVault] Model ${modelName} not found (404), trying next.`);
            break;
          }
          if (msg.includes('429') || msg.includes('quota')) {
            console.warn(`[HealthVault] Model ${modelName} rate-limited (429), trying next.`);
            break;
          }
          if (msg.includes('503') || msg.includes('Service Unavailable')) {
            console.warn(`[HealthVault] 503 from ${modelName}, retrying in ${(attempt + 1) * 2}s...`);
            await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
            continue;
          }
          if (msg.includes('JSON') || msg.includes('Unexpected token')) {
            console.warn(`[HealthVault] JSON parse failed for ${modelName}, retrying...`);
            continue;
          }
          console.error(`[HealthVault] Unknown error with ${modelName}:`, msg);
          continue;
        }
      }
    }

    console.error("[HealthVault] All models failed. Last error:", lastError?.message);
    return NextResponse.json(
      { error: lastError?.message || "All AI models failed. Please try again in a minute." },
      { status: 500 }
    );

  } catch (error: any) {
    console.error("[HealthVault] Unexpected server error:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}
