import { config } from "./config.js";
import { failed } from "./http.js";

// Groq chat completion. Related past doubts are injected as context: this is what makes answers personal.
export async function answer(subject, question, memories) {
  if (!config.groq) throw new Error("GROQ_API_KEY is not set on the server.");
  const ctx = memories.length
    ? "\n\nThe student previously asked these related doubts. Connect your answer to them where it helps:\n" +
      memories.map((m, i) => `${i + 1}. Q: ${m.question}${m.answer ? `\n   A: ${m.answer}` : ""}`).join("\n")
    : "";
  const base = {
    model: "openai/gpt-oss-120b",
    temperature: 0.3,
    // generous limit: gpt-oss is a reasoning model and spends part of the budget thinking before it answers
    max_tokens: 2000,
    messages: [
      { role: "system", content: "You are a patient tutor. Answer the student's doubt in under 150 words. Be accurate and concrete. If unsure, say so." + ctx },
      { role: "user", content: `Subject: ${subject}\nDoubt: ${question}` },
    ],
  };
  const send = (body) => fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.groq}` },
    body: JSON.stringify(body),
  });
  let res = await send({ ...base, reasoning_effort: "low" });
  if (res.status === 400) res = await send(base); // model without a reasoning_effort option
  if (!res.ok) throw await failed(res, "Groq request");
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Groq returned an empty answer. Try again.");
  return text;
}

// Gemini text embeddings (768 dims). Groq has no embedding model, so this is the one extra provider.
export const EMBED_DIM = 768;
export async function embed(text) {
  if (!config.gemini) throw new Error("GEMINI_API_KEY is not set on the server.");
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": config.gemini },
    body: JSON.stringify({ content: { parts: [{ text }] }, outputDimensionality: EMBED_DIM }),
  });
  if (!res.ok) throw await failed(res, "Gemini embedding request");
  const data = await res.json();
  const v = data.embedding?.values;
  if (!v?.length) throw new Error("Embedding response was empty.");
  return v;
}