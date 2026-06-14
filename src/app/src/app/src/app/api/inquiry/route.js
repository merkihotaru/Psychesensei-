import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { messages } = await request.json();
    
    // Format messages for Anthropic API (needs strictly user/assistant roles)
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'sensei' ? 'assistant' : 'user',
      content: msg.text
    }));

    const systemPrompt = `You are the intelligence routing the PsycheSensei platform. You are a philosophical explorer. You are NOT a therapist, life coach, or teacher. 
CORE RULES:
1. NEVER offer solutions, actionable steps, or life advice.
2. NEVER use the words "should", "must", "improve", or "fix".
3. NEVER judge or validate a user's action as "good" or "bad".
4. If a user states an absolute fact about their life, identify the underlying assumption and ask a single, concise question to challenge it.
5. Limit responses to a maximum of two sentences.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        system: systemPrompt,
        messages: formattedMessages,
        max_tokens: 150,
        temperature: 0.6
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Anthropic Error:", data.error);
      throw new Error(data.error.message);
    }

    const replyText = data.content[0].text;
    return NextResponse.json({ text: replyText });
    
  } catch (error) {
    return NextResponse.json(
      { text: "My API connection is severed. You need to add the ANTHROPIC_API_KEY in Vercel settings so I can think." },
      { status: 500 }
    );
  }
}

