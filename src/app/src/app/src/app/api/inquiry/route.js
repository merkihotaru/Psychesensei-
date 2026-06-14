import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { messages } = await request.json();
    
    // Format messages for Gemini (needs 'user' and 'model' roles)
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'sensei' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    const systemPrompt = `You are the intelligence routing the PsycheSensei platform. You are a philosophical explorer. You are NOT a therapist, life coach, or teacher. 
CORE RULES:
1. NEVER offer solutions, actionable steps, or life advice.
2. NEVER use the words "should", "must", "improve", or "fix".
3. NEVER judge or validate a user's action as "good" or "bad".
4. If a user states an absolute fact about their life, identify the underlying assumption and ask a single, concise question to challenge it.
5. Limit responses to a maximum of two sentences.`;

    const apiKey = process.env.GEMINI_API_KEY;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 150,
        }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Gemini Error:", data.error);
      throw new Error(data.error.message);
    }

    const replyText = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ text: replyText });
    
  } catch (error) {
    return NextResponse.json(
      { text: "My API connection is severed. You need to add the GEMINI_API_KEY in Vercel settings so I can think." },
      { status: 500 }
    );
  }
}
