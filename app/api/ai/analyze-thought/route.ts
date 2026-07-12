import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { thought } = await request.json();

    if (!thought) {
      return NextResponse.json({ error: "Thought is required" }, { status: 400 });
    }

    const prompt = `You are a factual and balanced philosophical analyst. 
A user has provided the following thought:
"${thought}"

Analyze this thought. Point out what is factually correct, any cognitive distortions, and offer a balanced critique. 
CRITICAL: Keep your response extremely concise, direct, and precise. Use a maximum of 2-3 short sentences. No fluff.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return NextResponse.json({ critique: response.text });
  } catch (error) {
    console.error("Error analyzing thought:", error);
    return NextResponse.json({ error: "Failed to analyze thought" }, { status: 500 });
  }
}
