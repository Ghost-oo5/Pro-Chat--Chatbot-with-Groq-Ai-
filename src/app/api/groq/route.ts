import { NextRequest, NextResponse } from 'next/server';
import { StreamingTextResponse } from 'ai';

export async function POST(req: NextRequest) {
  try {
    const { messages = [] }: Partial<{ messages: Array<any> }> = await req.json();

    console.log('Received messages:', messages);

    const lastMessage = messages[messages.length - 1];
    console.log('Last message:', lastMessage);

    const groqAIRequest = async (data: any) => {
      console.log('Sending request to Groq AI:', data);

      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: data
          }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Network response was not ok: ${response.statusText} - ${errorText}`);
        }

        const jsonResponse = await response.json();
        console.log('Groq AI response:', jsonResponse);

        return jsonResponse;
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }
    };

    const apiResponse = await groqAIRequest([{
      role: lastMessage.role,
      content: lastMessage.content
    }]);

    const messageContent = apiResponse.choices[0].message.content;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(messageContent));
        controller.close();
      }
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Error in Groq API handler:', error as Error);
    return NextResponse.json({ message: 'Internal Server Error', error: (error as Error).message }, { status: 500 });
  }
}

export const GET = () => {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
};
