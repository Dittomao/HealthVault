import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key is missing. Check your .env.local file." }, { status: 500 });
    }

    const { base64Image } = await req.json();

    if (!base64Image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      You are an expert medical AI assistant.
      Analyze this uploaded image and determine if it is a "bill" or a "prescription".
      
      If it is a "bill":
      1. Provide a brief 3-bullet summary of what the bill is for and the total cost.
      2. Identify any "unnecessary service charges", junk fees, or over-inflated costs as an array of strings.
      
      If it is a "prescription":
      1. Provide a brief 3-bullet summary of the diagnosis or instructions.
      2. Extract all prescribed medicines. For each medicine, generate search URLs:
         - tata1mg: "https://www.1mg.com/search/all?name=" + URL encoded medicine name
         - apollo: "https://www.apollopharmacy.in/search-medicines/" + URL encoded medicine name
      
      Format the response exactly as a JSON object with NO markdown wrapping. The JSON must have these exact keys:
      {
        "type": "bill" or "prescription",
        "summary": "string containing the 3-bullet summary",
        "items": [] 
      }
      
      For a bill, "items" should be an array of strings (the junk fees).
      For a prescription, "items" should be an array of objects: { "name": "medicine name", "tata1mg": "url", "apollo": "url" }.
    `;

    const imageParts = [{ inlineData: { data: base64Image, mimeType: "image/jpeg" } }];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) cleanedText = cleanedText.substring(7);
    if (cleanedText.endsWith('```')) cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    
    const data = JSON.parse(cleanedText);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: "Failed to analyze document" }, { status: 500 });
  }
}
