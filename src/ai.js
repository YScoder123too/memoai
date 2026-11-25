// Local mode only: the student's own Groq key, called straight from the browser. The key never leaves the browser except to Groq.
// With the backend enabled, the server makes these calls instead (see server/).
const MODEL = "openai/gpt-oss-120b";
export const MISC = "Miscellaneous";

async function chat(key, body) {
  const send = (extra) => fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, ...body, ...extra }),
  });
  let res = await send({ reasoning_effort: "low" }); // gpt-oss is a reasoning model, keep the thinking short
  if (res.status === 400) res = await send({});
  if (!res.ok) throw new Error(res.status === 401 ? "That API key was rejected." : `AI request failed (${res.status}).`);
  return (await res.json()).choices?.[0]?.message?.content?.trim() || "";
}

export async function askGroq(key, exam, question, memories = [], history = []) {
  const ctx = memories.length
    ? "\n\nThe student previously asked these related doubts. Connect your answer to them where it helps:\n" +
      memories.map((m, i) => `${i + 1}. Q: ${m.question}${m.answer ? `\n   A: ${m.answer}` : ""}`).join("\n")
    : "";
  return chat(key, {
    temperature: 0.3,
    max_tokens: 2000,
    messages: [
      { role: "system", content: "You are a patient tutor. Answer the student's doubt in under 150 words. Be accurate and concrete. If unsure, say so." + ctx },
      ...history.map((h) => ({ role: h.role === "ai" ? "assistant" : "user", content: String(h.text).slice(0, 1500) })),
      { role: "user", content: `${exam ? `Exam: ${exam}\n` : ""}Doubt: ${question}` },
    ],
  });
}

// Files the doubt under one of the student's topics. Falls back to Miscellaneous instead of failing.
export async function classifyGroq(key, question, topics) {
  if (!key || !topics.length) return MISC;
  try {
    const raw = (await chat(key, {
      temperature: 0,
      max_tokens: 400,
      messages: [
        { role: "system", content: `You file a student's doubt under exactly one topic. Reply with only the topic name, copied exactly from this list, or "${MISC}" if no topic clearly fits.\n\nTopics:\n${topics.join("\n")}` },
        { role: "user", content: question },
      ],
    })).replace(/^["'`]+|["'`.]+$/g, "").toLowerCase();
    return topics.find((t) => t.toLowerCase() === raw) || MISC;
  } catch { return MISC; }
}