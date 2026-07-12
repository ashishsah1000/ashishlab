import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { nodes, edges, conclusionNodeId } = await request.json();

    if (!nodes || !edges || !conclusionNodeId) {
      return NextResponse.json({ error: "Nodes, edges, and conclusion node ID are required" }, { status: 400 });
    }

    // Traverse the graph from root to conclusion to extract the "path" of thoughts.
    // Assuming a simple directed tree structure towards the conclusion.
    const thoughtPath = [];

    // Simple extraction: just collect all node texts and the conclusion.
    // In a more complex implementation, we would trace the specific path.
    const formattedThoughts = nodes.map((n: any) => {
      const isConclusion = n.id === conclusionNodeId;
      return `Thought: "${n.data?.text || ""}"\nAI Critique: "${n.data?.critique || ""}"\nIs Conclusion: ${isConclusion}`;
    }).join("\n\n");

    const prompt = `You are a creative writer and a philosopher. 
A user has gone through a journey of self-exploration by writing a flow of thoughts.
Here is the sequence of their thoughts, the AI's critiques, and the final conclusion they reached:

${formattedThoughts}

Using this flow, please write a cohesive, creative story of self-exploration, experience, and realization. The story should read like a beautifully written journal entry (in the first-person perspective, as if the user is writing it). Format the output in Markdown. Make it evocative and insightful. Do not use very difficult english words. We have to tell the story in an effective way.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return NextResponse.json({ story: response.text });
  } catch (error) {
    console.error("Error creating story:", error);
    return NextResponse.json({ error: "Failed to create story" }, { status: 500 });
  }
}
