// Optional AI answer via Groq (Llama 3.3), used in local mode. The key is the user's own and stays in their browser.
// With the backend enabled, the server makes this call instead (see server/).
export async function askGroq(key, subject, question, memories = []) {
  const ctx = memories.length
    ? "\n\nThe student previously asked these related doubts. Connect your answer to them where it helps:\n" +
      memories.map((m, i) => `${i + 1}. Q: ${m.question}${m.answer ? `\n   A: ${m.answer}` : ""}`).join("\n")
    : "";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        { role: "system", content: "You are a patient tutor. Answer the student's doubt in under 150 words. Be accurate and concrete. If unsure, say so." + ctx },
        { role: "user", content: `Subject: ${subject}\nDoubt: ${question}` },
      ],
    }),
  });
  if (!res.ok) throw new Error(res.status === 401 ? "That API key was rejected." : `AI request failed (${res.status}).`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}
