import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { messages } = await request.json();
    const lastUserMessage = messages[messages.length - 1]?.text || "";

    const systemPrompt = `You are PsycheSensei. You are a cold, calm, minimalist Socratic explorer. You are NOT a therapist, teacher, or coach.
RULES:
1. NEVER offer solutions, actionable strategies, or life steps.
2. NEVER use self-help words like "should", "must", "improve", or "fix".
3. Keep answers strictly bounded to 1 or 2 deep, precise questions that uncover structural premises.
4. If the user presents stress about time or value, decouple their identity from standard societal timelines immediately.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: lastUserMessage }
        ],
        max_tokens: 150,
        temperature: 0.6
      })
    });

    const data = await response.json();
    const replyText = data.choices[0]?.message?.content || "What core truth are we avoiding here?";
    return NextResponse.json({ text: replyText });
  } catch (error) {
    return NextResponse.json({ text: "Connection thin. What happens if we look at this thought without needing immediate response?" });
  }
}
