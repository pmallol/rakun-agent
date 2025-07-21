import { codingAgent } from "../utils/agent";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { prompt, repoUrl }: { prompt: string; repoUrl?: string } = body;

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('Processing agent request:', { prompt, repoUrl });

    const result = await codingAgent(prompt, repoUrl);

    // Extract PR link if present in the response
    const prLinkMatch = result.response.match(/linkToPR:\s*(https:\/\/github\.com\/[^\s]+)/);
    const prLink = prLinkMatch ? prLinkMatch[1] : null;

    return new Response(JSON.stringify({ 
      response: result.response,
      prLink
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
    });
  } catch (error) {
    console.error('Agent error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    },
  });
}