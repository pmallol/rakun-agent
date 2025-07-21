import { codingAgent } from "../utils/agent";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { config } from 'dotenv';
import path from 'path';

// Load .env.local file
config({ path: path.join(process.cwd(), '.env.local') });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, repoUrl }: { prompt: string; repoUrl?: string } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({ error: 'repoUrl is required' });
    }

    console.log('Processing agent request:', { prompt, repoUrl });

    const result = await Promise.race([
      codingAgent(prompt, repoUrl),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Agent timeout after 60s')), 60000))
    ]);
    console.log("agent completed successfully");

    // Extract PR link if present in the response - check multiple patterns
    console.log("Response:", result.response);
    let prLinkMatch = result.response.match(/linkToPR:\s*(https:\/\/github\.com\/[^\s]+)/);
    if (!prLinkMatch) {
      prLinkMatch = result.response.match(/(https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+)/);
    }
    const prLink = prLinkMatch ? prLinkMatch[1] : null;
    console.log("PR link:", prLink);

    console.log("Sending response...");
    const responseData = { 
      response: result.response,
      prLink
    };
    
    res.status(200).json(responseData);
    console.log("Response sent successfully");
    return; // Ensure we exit here
  } catch (error) {
    console.error('Agent error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}