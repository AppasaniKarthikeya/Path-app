// src/lib/ai-provider.ts
// Triple-fallback AI provider: Gemini Flash → Groq (Llama 3.3) → Ollama
// Each provider streams tokens via an async generator.

import { GoogleGenerativeAI, type Content } from "@google/generative-ai";
import Groq from "groq-sdk";

// ────────────────────────────────────────────
// Shared types
// ────────────────────────────────────────────

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ────────────────────────────────────────────
// Provider 1 — Google Gemini Flash
// ────────────────────────────────────────────

async function* streamGemini(
  messages: ChatMessage[],
  systemPrompt: string
): AsyncGenerator<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  });

  // Convert messages to Gemini's Content format (skip system messages — handled above)
  const contents: Content[] = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const chat = model.startChat({ history: contents.slice(0, -1) });

  // The last message is the one we're responding to
  const lastMessage = contents[contents.length - 1];
  const lastPart = lastMessage?.parts[0];
  const lastText: string = lastPart && "text" in lastPart ? (lastPart.text ?? "") : "";

  const result = await chat.sendMessageStream(lastText);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

// ────────────────────────────────────────────
// Provider 2 — Groq (Llama 3.3 70B)
// ────────────────────────────────────────────

async function* streamGroq(
  messages: ChatMessage[],
  systemPrompt: string
): AsyncGenerator<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const groq = new Groq({ apiKey });

  // Prepend the system prompt as the first message
  const fullMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.filter((m) => m.role !== "system"),
  ];

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: fullMessages,
    stream: true,
    temperature: 0.7,
    max_tokens: 2048,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}

// ────────────────────────────────────────────
// Provider 3 — Ollama (local, raw fetch)
// ────────────────────────────────────────────

async function* streamOllama(
  messages: ChatMessage[],
  systemPrompt: string
): AsyncGenerator<string> {
  const baseUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2";

  // Build messages array with system prompt
  const fullMessages = [
    { role: "system", content: systemPrompt },
    ...messages.filter((m) => m.role !== "system"),
  ];

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: fullMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama error (${response.status}): ${errorText}`);
  }

  if (!response.body) {
    throw new Error("Ollama returned no response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Ollama streams newline-delimited JSON
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // keep the incomplete last line

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
        if (parsed.message?.content) {
          yield parsed.message.content;
        }
      } catch {
        // Skip malformed JSON lines
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer) as { message?: { content?: string } };
      if (parsed.message?.content) {
        yield parsed.message.content;
      }
    } catch {
      // Skip malformed final chunk
    }
  }
}

// ────────────────────────────────────────────
// Main entry point — cascading fallback
// ────────────────────────────────────────────

export async function* streamChatResponse(
  messages: ChatMessage[],
  systemPrompt: string
): AsyncGenerator<string> {
  // --- Try Gemini first ---
  try {
    console.log("[Path AI] Attempting Gemini Flash...");
    const generator = streamGemini(messages, systemPrompt);

    // Pull the first chunk to verify the stream actually works
    // (catches auth / rate-limit errors before we commit to this provider)
    const first = await generator.next();
    if (!first.done && first.value) {
      console.log("[Path AI] ✓ Using Gemini Flash");
      yield first.value;
      yield* generator;
      return;
    }
  } catch (error) {
    console.warn("[Path AI] Gemini failed:", error instanceof Error ? error.message : error);
  }

  // --- Fall back to Groq ---
  try {
    console.log("[Path AI] Attempting Groq (Llama 3.3 70B)...");
    const generator = streamGroq(messages, systemPrompt);

    const first = await generator.next();
    if (!first.done && first.value) {
      console.log("[Path AI] ✓ Using Groq (Llama 3.3 70B)");
      yield first.value;
      yield* generator;
      return;
    }
  } catch (error) {
    console.warn("[Path AI] Groq failed:", error instanceof Error ? error.message : error);
  }

  // --- Fall back to Ollama ---
  try {
    console.log("[Path AI] Attempting Ollama...");
    const generator = streamOllama(messages, systemPrompt);

    const first = await generator.next();
    if (!first.done && first.value) {
      console.log("[Path AI] ✓ Using Ollama");
      yield first.value;
      yield* generator;
      return;
    }
  } catch (error) {
    console.warn("[Path AI] Ollama failed:", error instanceof Error ? error.message : error);
  }

  // --- All providers failed ---
  throw new Error(
    "All AI providers failed. Please check your API keys (GEMINI_API_KEY, GROQ_API_KEY) " +
    "or ensure Ollama is running locally."
  );
}
