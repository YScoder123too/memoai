// import { config } from "./config.js";
// import { failed } from "./http.js";

// // Groq chat completion. Related past doubts are injected as context: this is what makes answers personal.
// export async function answer(subject, question, memories, history = []) {
//   if (!config.groq) throw new Error("GROQ_API_KEY is not set on the server.");
//   const ctx = memories.length
//     ? "\n\nThe student previously asked these related doubts. Connect your answer to them where it helps:\n" +
//       memories.map((m, i) => `${i + 1}. Q: ${m.question}${m.answer ? `\n   A: ${m.answer}` : ""}`).join("\n")
//     : "";
//   const base = {
//     model: "openai/gpt-oss-120b",
//     temperature: 0.3,
//     // generous limit: gpt-oss is a reasoning model and spends part of the budget thinking before it answers
//     max_tokens: 2000,
//     messages: [
//       { role: "system", content: "You are a patient tutor. Answer the student's doubt in under 150 words. Be accurate and concrete. If unsure, say so." + ctx },
//             ...history,
//       { role: "user", content: `Subject: ${subject}\nDoubt: ${question}` },
//     ],
//   };
//   const send = (body) => fetch("https://api.groq.com/openai/v1/chat/completions", {
//     method: "POST",
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.groq}` },
//     body: JSON.stringify(body),
//   });
//   let res = await send({ ...base, reasoning_effort: "low" });
//   if (res.status === 400) res = await send(base); // model without a reasoning_effort option
//   if (!res.ok) throw await failed(res, "Groq request");
//   const data = await res.json();
//   const text = data.choices?.[0]?.message?.content?.trim();
//   if (!text) throw new Error("Groq returned an empty answer. Try again.");
//   return text;
// }

// // Gemini text embeddings (768 dims). Groq has no embedding model, so this is the one extra provider.
// export const EMBED_DIM = 768;
// export async function embed(text) {
//   if (!config.gemini) throw new Error("GEMINI_API_KEY is not set on the server.");
//   const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent", {
//     method: "POST",
//     headers: { "Content-Type": "application/json", "x-goog-api-key": config.gemini },
//     body: JSON.stringify({ content: { parts: [{ text }] }, outputDimensionality: EMBED_DIM }),
//   });
//   if (!res.ok) throw await failed(res, "Gemini embedding request");
//   const data = await res.json();
//   const v = data.embedding?.values;
//   if (!v?.length) throw new Error("Embedding response was empty.");
//   return v;
// }
import { config } from "./config.js";
import { failed } from "./http.js";

const MODEL = config.groqModel || "openai/gpt-oss-120b";

// One place that talks to Groq. gpt-oss is a reasoning model, so ask for low effort first and
// retry without that option if the model rejects it.
async function groq(base) {
  const send = (body) => fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.groq}` },
    body: JSON.stringify(body),
  });
  let res = await send({ ...base, reasoning_effort: "low" });
  if (res.status === 400) res = await send(base);
  if (!res.ok) throw await failed(res, "Groq request");
  return res;
}

// Groq chat completion. Related past doubts are injected as context: this is what makes answers personal.
export async function answer(subject, question, memories, history = []) {
  if (!config.groq) throw new Error("GROQ_API_KEY is not set on the server.");
  const ctx = memories.length
    ? "\n\nThe student previously asked these related doubts. Connect your answer to them where it helps:\n" +
      memories.map((m, i) => `${i + 1}. Q: ${m.question}${m.answer ? `\n   A: ${m.answer}` : ""}`).join("\n")
    : "";
  const base = {
    model: MODEL,
    temperature: 0.3,
    // generous limit: gpt-oss is a reasoning model and spends part of the budget thinking before it answers
    max_tokens: 2000,
    messages: [
      { role: "system", content: "You are a patient tutor. Answer the student's doubt in under 150 words. Be accurate and concrete. If unsure, say so." + ctx },
      ...history, // earlier turns of the same chat, so follow-ups make sense
      { role: "user", content: `${subject ? `Exam: ${subject}\n` : ""}Doubt: ${question}` },
    ],
  };
  const res = await groq(base);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Groq returned an empty answer. Try again.");
  return text;
}

// Files a doubt under one topic of the student's exam, so nobody has to pick a subject by hand.
// Never throws: if the model fails or answers with something off-list, the doubt goes to "Miscellaneous".
export const MISC = "Miscellaneous";
export async function classify(question, topics) {
  if (!config.groq || !topics.length) return MISC;
  try {
    const res = await groq({
      model: MODEL,
      temperature: 0,
      max_tokens: 400, // reasoning models spend part of this budget thinking
      messages: [
        { role: "system", content: `You file a student's doubt under exactly one topic. Reply with only the topic name, copied exactly from this list, or "${MISC}" if no topic clearly fits.\n\nTopics:\n${topics.join("\n")}` },
        { role: "user", content: question },
      ],
    });
    const raw = (await res.json()).choices?.[0]?.message?.content?.trim().replace(/^["'`]+|["'`.]+$/g, "").toLowerCase();
    if (!raw) return MISC;
    return topics.find((t) => t.toLowerCase() === raw) || MISC;
  } catch (e) {
    console.error("[classify] failed:", e.message);
    return MISC;
  }
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