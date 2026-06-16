import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SYSTEM_PROMPT = `You are Carbon Coach, a friendly and practical AI sustainability advisor.

Your role:
- Help users understand and reduce their personal carbon footprint.
- Give concrete, encouraging, jargon-free advice tailored to everyday life.
- When the user shares numbers (kWh, km, kg CO2), reason with them; cite typical CO2 savings in parentheses.
- Never shame the user. Celebrate any positive change, no matter how small.
- Keep replies under 200 words unless a deep dive is requested. Use short paragraphs and bullet lists where helpful.
- If a question is outside sustainability, gently redirect.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(body.messages as UIMessage[]),
        });
        return result.toUIMessageStreamResponse({
          originalMessages: body.messages as UIMessage[],
          onError: (err) => {
            const e = err as { statusCode?: number; message?: string } | Error;
            const status = (e as { statusCode?: number }).statusCode;
            if (status === 429) return "Rate limit reached — please try again in a moment.";
            if (status === 402) return "AI credits exhausted. Add credits to your workspace to continue.";
            return "Something went wrong while contacting the AI Coach.";
          },
        });
      },
    },
  },
});
