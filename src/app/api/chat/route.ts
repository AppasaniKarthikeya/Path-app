// src/app/api/chat/route.ts
// POST /api/chat — streaming AI chat endpoint

import { streamChatResponse, type ChatMessage } from "@/lib/ai-provider";
import { buildSystemPrompt, type UserProfile } from "@/lib/system-prompt";

interface ChatRequestBody {
  messages: ChatMessage[];
  userProfile: UserProfile;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const { messages, userProfile } = body;

    // ── Validate request ──
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required and must not be empty" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Build personalized system prompt ──
    const defaultProfile: UserProfile = {
      name: "",
      status: "",
      degree: "",
      branch: "",
      year: "",
      graduationYear: "",
      currentJob: "",
      yearsExperience: "",
      careerGoal: "",
      interests: [],
      learningStyle: "",
      timeAvailable: "",
      languagesKnown: [],
      projects: "",
      challenges: "",
    };
    const profile: UserProfile = userProfile
      ? { ...defaultProfile, ...userProfile }
      : defaultProfile;

    const systemPrompt = buildSystemPrompt(profile);

    // ── Stream the response ──
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamChatResponse(messages, systemPrompt);

          for await (const chunk of generator) {
            // Yield the native chunk directly to prevent TextEncoder from 
            // corrupting split emojis or ZWJ sequences.
            controller.enqueue(encoder.encode(chunk));
            // Add a small delay between chunks for a reading-speed effect
            await new Promise((r) => setTimeout(r, 20));
          }

          controller.close();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "An unexpected error occurred";

          // Send error as a final chunk so the client can handle it
          controller.enqueue(
            encoder.encode(`\n\n[ERROR]: ${errorMessage}`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Path API] Request error:", error);

    const message =
      error instanceof SyntaxError
        ? "Invalid JSON in request body"
        : "Internal server error";
    const status = error instanceof SyntaxError ? 400 : 500;

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
